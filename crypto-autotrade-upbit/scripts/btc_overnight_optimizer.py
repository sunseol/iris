import csv
import itertools
import math
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional

import requests

BASE_URL = "https://api.upbit.com/v1/candles/minutes/60"
UTC = timezone.utc


@dataclass
class Config:
    market: str = "KRW-BTC"
    bars: int = 4000
    fee_rate: float = 0.0005
    slippage_rate: float = 0.0005
    initial_cash: float = 10_000_000


def parse_utc(s: str) -> datetime:
    return datetime.strptime(s, "%Y-%m-%dT%H:%M:%S").replace(tzinfo=UTC)


def fetch_candles_60m(market: str, total: int) -> List[dict]:
    rows = []
    to = None
    remain = total

    while remain > 0:
        count = min(200, remain)
        params = {"market": market, "count": count}
        if to:
            params["to"] = to

        retries = 0
        while True:
            resp = requests.get(BASE_URL, params=params, timeout=10)
            if resp.status_code == 429:
                retries += 1
                if retries > 8:
                    resp.raise_for_status()
                time.sleep(min(2 ** retries, 20))
                continue
            resp.raise_for_status()
            chunk = resp.json()
            break

        time.sleep(0.12)
        if not chunk:
            break

        rows.extend(chunk)
        last = parse_utc(chunk[-1]["candle_date_time_utc"])
        to = (last - timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")
        remain -= len(chunk)

    seen = set()
    data = []
    for r in rows:
        key = r["candle_date_time_utc"]
        if key in seen:
            continue
        seen.add(key)
        data.append(
            {
                "time": parse_utc(key),
                "open": float(r["opening_price"]),
                "high": float(r["high_price"]),
                "low": float(r["low_price"]),
                "close": float(r["trade_price"]),
                "volume": float(r["candle_acc_trade_volume"]),
            }
        )

    data.sort(key=lambda x: x["time"])
    return data


def sma(values: List[float]) -> float:
    return sum(values) / len(values) if values else float("nan")


def precompute_indicators(data: List[dict]) -> None:
    trs = []
    for i, c in enumerate(data):
        prev_close = data[i - 1]["close"] if i > 0 else c["close"]
        tr = max(c["high"] - c["low"], abs(c["high"] - prev_close), abs(c["low"] - prev_close))
        trs.append(tr)
        c["tr"] = tr

    ma_periods = [50, 100, 200]
    for p in ma_periods:
        vals = [float("nan")] * len(data)
        for i in range(p - 1, len(data)):
            vals[i] = sma([data[j]["close"] for j in range(i - p + 1, i + 1)])
        for i in range(len(data)):
            data[i][f"ma_{p}"] = vals[i]

    atr_periods = [10, 14, 20]
    for p in atr_periods:
        vals = [float("nan")] * len(data)
        for i in range(p - 1, len(data)):
            vals[i] = sma(trs[i - p + 1 : i + 1])
        for i in range(len(data)):
            data[i][f"atr_{p}"] = vals[i]

    breakout_lookbacks = [10, 20, 30, 55]
    for lb in breakout_lookbacks:
        vals = [float("nan")] * len(data)
        for i in range(lb, len(data)):
            vals[i] = max(data[j]["high"] for j in range(i - lb, i))
        for i in range(len(data)):
            data[i][f"breakout_{lb}"] = vals[i]

    # Range/sideway avoidance proxy: ADX-lite using directional movement and ATR smoothing.
    adx_period = 14
    dm_plus = [0.0] * len(data)
    dm_minus = [0.0] * len(data)
    for i in range(1, len(data)):
        up = data[i]["high"] - data[i - 1]["high"]
        down = data[i - 1]["low"] - data[i]["low"]
        dm_plus[i] = up if up > down and up > 0 else 0.0
        dm_minus[i] = down if down > up and down > 0 else 0.0

    adx = [float("nan")] * len(data)
    for i in range(adx_period * 2 - 1, len(data)):
        tr_sum = sum(data[j]["tr"] for j in range(i - adx_period + 1, i + 1))
        dmp = sum(dm_plus[j] for j in range(i - adx_period + 1, i + 1))
        dmm = sum(dm_minus[j] for j in range(i - adx_period + 1, i + 1))
        if tr_sum <= 0:
            continue
        di_plus = 100.0 * dmp / tr_sum
        di_minus = 100.0 * dmm / tr_sum
        dx = 100.0 * abs(di_plus - di_minus) / max(di_plus + di_minus, 1e-9)

        # Smooth as average of recent DX values
        if i >= adx_period * 3 - 2:
            dxs = []
            for k in range(i - adx_period + 1, i + 1):
                tr_k = sum(data[j]["tr"] for j in range(k - adx_period + 1, k + 1))
                if tr_k <= 0:
                    continue
                dpk = sum(dm_plus[j] for j in range(k - adx_period + 1, k + 1))
                dmk = sum(dm_minus[j] for j in range(k - adx_period + 1, k + 1))
                di_p_k = 100.0 * dpk / tr_k
                di_m_k = 100.0 * dmk / tr_k
                dxs.append(100.0 * abs(di_p_k - di_m_k) / max(di_p_k + di_m_k, 1e-9))
            if dxs:
                adx[i] = sum(dxs) / len(dxs)

    for i in range(len(data)):
        data[i]["adx14"] = adx[i]


@dataclass
class ParamSet:
    breakout_lookback: int
    atr_period: int
    atr_mult: float
    risk_per_trade: float
    trend_filter: str
    regime_filter: str

    def key(self) -> str:
        return (
            f"lb{self.breakout_lookback}_atr{self.atr_period}_m{self.atr_mult}_"
            f"r{self.risk_per_trade}_tf{self.trend_filter}_rf{self.regime_filter}"
        )


def allow_entry(candle: dict, p: ParamSet) -> bool:
    if p.trend_filter == "none":
        trend_ok = True
    elif p.trend_filter == "ma100":
        ma = candle.get("ma_100", float("nan"))
        trend_ok = (not math.isnan(ma)) and candle["close"] > ma
    else:
        raise ValueError(f"Unknown trend filter: {p.trend_filter}")

    if p.regime_filter == "none":
        regime_ok = True
    elif p.regime_filter == "adx20":
        adx = candle.get("adx14", float("nan"))
        regime_ok = (not math.isnan(adx)) and adx >= 20.0
    else:
        raise ValueError(f"Unknown regime filter: {p.regime_filter}")

    return trend_ok and regime_ok


def run_backtest(data: List[dict], cfg: Config, p: ParamSet) -> Dict:
    cash = cfg.initial_cash
    qty = 0.0
    entry = 0.0
    stop = 0.0
    pos_risk = 0.0

    trades = []
    equity_curve = []

    for c in data:
        price = c["close"]
        atr = c.get(f"atr_{p.atr_period}", float("nan"))
        bh = c.get(f"breakout_{p.breakout_lookback}", float("nan"))

        if qty > 0 and not math.isnan(atr):
            trail = price - p.atr_mult * atr
            stop = max(stop, trail)
            if c["low"] <= stop:
                exit_px = stop * (1 - cfg.slippage_rate)
                gross = qty * exit_px
                exit_fee = gross * cfg.fee_rate
                cash += gross - exit_fee
                entry_fee = entry * qty * cfg.fee_rate
                pnl = (exit_px - entry) * qty - entry_fee - exit_fee
                r_mult = pnl / pos_risk if pos_risk > 0 else 0.0
                trades.append({"pnl": pnl, "r": r_mult})
                qty = 0.0
                entry = 0.0
                stop = 0.0
                pos_risk = 0.0

        if qty == 0 and not math.isnan(atr) and not math.isnan(bh):
            if price > bh and allow_entry(c, p):
                stop_candidate = price - p.atr_mult * atr
                risk_per_coin = max(price - stop_candidate, 1e-9)
                risk_budget = cash * p.risk_per_trade
                raw_qty = risk_budget / risk_per_coin

                entry_px = price * (1 + cfg.slippage_rate)
                max_qty = cash / (entry_px * (1 + cfg.fee_rate))
                buy_qty = min(raw_qty, max_qty)

                if buy_qty > 0:
                    cost = buy_qty * entry_px
                    fee = cost * cfg.fee_rate
                    cash -= cost + fee
                    qty = buy_qty
                    entry = entry_px
                    stop = stop_candidate
                    pos_risk = max((entry - stop) * qty, 1e-9)

        equity_curve.append(cash + qty * price)

    if qty > 0:
        c = data[-1]
        exit_px = c["close"] * (1 - cfg.slippage_rate)
        gross = qty * exit_px
        exit_fee = gross * cfg.fee_rate
        cash += gross - exit_fee
        entry_fee = entry * qty * cfg.fee_rate
        pnl = (exit_px - entry) * qty - entry_fee - exit_fee
        r_mult = pnl / pos_risk if pos_risk > 0 else 0.0
        trades.append({"pnl": pnl, "r": r_mult})
        equity_curve[-1] = cash

    if not equity_curve:
        return {
            "final_equity": cfg.initial_cash,
            "total_return": 0.0,
            "max_drawdown": 0.0,
            "trades": 0,
            "win_rate": 0.0,
            "profit_factor": None,
            "avg_r": 0.0,
        }

    peak = equity_curve[0]
    mdd = 0.0
    for v in equity_curve:
        peak = max(peak, v)
        dd = v / peak - 1
        mdd = min(mdd, dd)

    wins = sum(1 for t in trades if t["pnl"] > 0)
    profits = [t["pnl"] for t in trades if t["pnl"] > 0]
    losses = [t["pnl"] for t in trades if t["pnl"] < 0]

    pf = (sum(profits) / abs(sum(losses))) if losses else None
    return {
        "final_equity": equity_curve[-1],
        "total_return": equity_curve[-1] / cfg.initial_cash - 1,
        "max_drawdown": mdd,
        "trades": len(trades),
        "win_rate": wins / len(trades) if trades else 0.0,
        "profit_factor": pf,
        "avg_r": sum(t["r"] for t in trades) / len(trades) if trades else 0.0,
    }


def score_for_rank(metrics: Dict) -> float:
    pf = metrics["profit_factor"] if metrics["profit_factor"] is not None else 0.0
    return (
        metrics["total_return"] * 1.0
        + metrics["avg_r"] * 0.25
        + pf * 0.03
        + metrics["max_drawdown"] * 0.4  # negative drawdown penalizes
    )


def fmt_pct(v: float) -> str:
    return f"{v * 100:.2f}%"


def fmt_pf(v: Optional[float]) -> str:
    return "N/A" if v is None else f"{v:.2f}"


def main():
    cfg = Config()
    data = fetch_candles_60m(cfg.market, cfg.bars)
    precompute_indicators(data)

    split_idx = int(len(data) * 0.7)
    in_sample = data[:split_idx]
    out_sample = data[split_idx:]

    param_grid = [
        ParamSet(*values)
        for values in itertools.product(
            [10, 20, 30, 55],
            [10, 14, 20],
            [1.5, 2.0, 2.5, 3.0],
            [0.0025, 0.0050],
            ["none", "ma100"],
            ["none", "adx20"],
        )
    ]

    baseline_param = ParamSet(20, 14, 2.0, 0.0050, "none", "none")
    baseline_is = run_backtest(in_sample, cfg, baseline_param)
    baseline_oos = run_backtest(out_sample, cfg, baseline_param)

    rows = []
    for p in param_grid:
        ins = run_backtest(in_sample, cfg, p)
        oos = run_backtest(out_sample, cfg, p)

        row = {
            "key": p.key(),
            "breakout_lookback": p.breakout_lookback,
            "atr_period": p.atr_period,
            "atr_mult": p.atr_mult,
            "risk_per_trade": p.risk_per_trade,
            "trend_filter": p.trend_filter,
            "regime_filter": p.regime_filter,
            "is_return": ins["total_return"],
            "is_mdd": ins["max_drawdown"],
            "is_trades": ins["trades"],
            "is_win_rate": ins["win_rate"],
            "is_pf": ins["profit_factor"] if ins["profit_factor"] is not None else 0.0,
            "is_avg_r": ins["avg_r"],
            "oos_return": oos["total_return"],
            "oos_mdd": oos["max_drawdown"],
            "oos_trades": oos["trades"],
            "oos_win_rate": oos["win_rate"],
            "oos_pf": oos["profit_factor"] if oos["profit_factor"] is not None else 0.0,
            "oos_avg_r": oos["avg_r"],
        }
        row["rank_score"] = (
            0.35 * score_for_rank(ins)
            + 0.65 * score_for_rank(oos)
            - 0.10 * abs(ins["total_return"] - oos["total_return"])
        )
        rows.append(row)

    rows.sort(key=lambda r: r["rank_score"], reverse=True)
    top5 = rows[:5]

    # OOS leaderboard under drawdown constraint (robustness-first)
    oos_mdd_limit = -0.015
    robust_oos = sorted(
        [r for r in rows if r["oos_trades"] >= 5 and r["oos_mdd"] >= oos_mdd_limit],
        key=lambda r: (r["oos_return"], r["oos_pf"], r["oos_avg_r"]),
        reverse=True,
    )
    robust_top5 = robust_oos[:5]

    # Recommendations
    conservative = sorted(
        [
            r
            for r in rows
            if r["oos_mdd"] >= -0.012
            and r["oos_trades"] >= 5
            and r["risk_per_trade"] <= 0.0025
        ],
        key=lambda r: (r["oos_return"], -abs(r["is_return"] - r["oos_return"])),
        reverse=True,
    )
    aggressive = sorted(
        [r for r in rows if r["oos_trades"] >= 5 and r["risk_per_trade"] >= 0.005],
        key=lambda r: (r["oos_return"], r["oos_pf"]),
        reverse=True,
    )

    conservative_pick = conservative[0] if conservative else top5[0]
    aggressive_pick = aggressive[0] if aggressive else top5[0]

    reports_dir = Path("reports")
    reports_dir.mkdir(parents=True, exist_ok=True)

    csv_path = reports_dir / "btc_overnight_grid_results.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    report_path = reports_dir / "btc_overnight_report.md"
    with report_path.open("w", encoding="utf-8") as f:
        f.write("# BTC KRW-BTC Overnight Simulation Report\n\n")
        f.write(f"- 데이터: 업비트 60분봉 최근 {len(data)}개\n")
        f.write(f"- 기간: {data[0]['time']} ~ {data[-1]['time']}\n")
        f.write(f"- 분할: 인샘플 70%({len(in_sample)} bars) / 아웃샘플 30%({len(out_sample)} bars)\n")
        f.write("- 기준 전략: 20돌파 + ATR(14,2.0), 리스크 0.5%\n\n")

        f.write("## 실험 설정\n")
        f.write("- breakout lookback: [10, 20, 30, 55]\n")
        f.write("- ATR period: [10, 14, 20]\n")
        f.write("- ATR mult: [1.5, 2.0, 2.5, 3.0]\n")
        f.write("- risk per trade: [0.25%, 0.5%]\n")
        f.write("- trend filter: none / MA100 상방\n")
        f.write("- regime filter: none / ADX14 >= 20\n")
        f.write(f"- 총 조합 수: {len(rows)}\n\n")

        f.write("## 기준 전략 성능 (20돌파 + ATR2, risk 0.5%)\n")
        f.write(
            f"- IS: 수익률 {fmt_pct(baseline_is['total_return'])}, MDD {fmt_pct(baseline_is['max_drawdown'])}, "
            f"거래 {baseline_is['trades']}, 승률 {fmt_pct(baseline_is['win_rate'])}, PF {fmt_pf(baseline_is['profit_factor'])}, 평균R {baseline_is['avg_r']:.3f}\n"
        )
        f.write(
            f"- OOS: 수익률 {fmt_pct(baseline_oos['total_return'])}, MDD {fmt_pct(baseline_oos['max_drawdown'])}, "
            f"거래 {baseline_oos['trades']}, 승률 {fmt_pct(baseline_oos['win_rate'])}, PF {fmt_pf(baseline_oos['profit_factor'])}, 평균R {baseline_oos['avg_r']:.3f}\n\n"
        )

        f.write("## 상위 5개 조합 (IS/OOS 균형 랭킹)\n\n")
        for i, r in enumerate(top5, start=1):
            f.write(f"### {i}) {r['key']}\n")
            f.write(
                f"- 파라미터: lb={r['breakout_lookback']}, atr_p={r['atr_period']}, "
                f"atr_m={r['atr_mult']}, risk={r['risk_per_trade']*100:.2f}%, "
                f"trend={r['trend_filter']}, regime={r['regime_filter']}\n"
            )
            f.write(
                f"- IS: 수익률 {fmt_pct(r['is_return'])}, MDD {fmt_pct(r['is_mdd'])}, "
                f"거래 {r['is_trades']}, 승률 {fmt_pct(r['is_win_rate'])}, PF {r['is_pf']:.2f}, 평균R {r['is_avg_r']:.3f}\n"
            )
            f.write(
                f"- OOS: 수익률 {fmt_pct(r['oos_return'])}, MDD {fmt_pct(r['oos_mdd'])}, "
                f"거래 {r['oos_trades']}, 승률 {fmt_pct(r['oos_win_rate'])}, PF {r['oos_pf']:.2f}, 평균R {r['oos_avg_r']:.3f}\n\n"
            )

        f.write("## OOS 리더보드 (MDD 제약 기반)\n\n")
        f.write(f"- 조건: OOS 거래 >= 5, OOS MDD >= {fmt_pct(oos_mdd_limit)}\n\n")
        if robust_top5:
            for i, r in enumerate(robust_top5, start=1):
                f.write(
                    f"{i}. {r['key']} | OOS 수익률 {fmt_pct(r['oos_return'])}, "
                    f"MDD {fmt_pct(r['oos_mdd'])}, PF {r['oos_pf']:.2f}, "
                    f"거래 {r['oos_trades']}, 평균R {r['oos_avg_r']:.3f}\n"
                )
            f.write("\n")
        else:
            f.write("- 제약을 만족하는 조합이 없습니다.\n\n")

        f.write("## 추천 조합\n\n")
        f.write("### 보수형 추천 (낮은 DD 우선)\n")
        r = conservative_pick
        f.write(
            f"- {r['key']} | OOS 수익률 {fmt_pct(r['oos_return'])}, MDD {fmt_pct(r['oos_mdd'])}, "
            f"PF {r['oos_pf']:.2f}, 평균R {r['oos_avg_r']:.3f}\n\n"
        )

        f.write("### 공격형 추천 (수익률 우선)\n")
        r = aggressive_pick
        f.write(
            f"- {r['key']} | OOS 수익률 {fmt_pct(r['oos_return'])}, MDD {fmt_pct(r['oos_mdd'])}, "
            f"PF {r['oos_pf']:.2f}, 평균R {r['oos_avg_r']:.3f}\n\n"
        )

        f.write("## 실전 투입 전 체크리스트\n")
        f.write("- [ ] 수수료/슬리피지를 실계정 체결 로그 기반으로 재추정\n")
        f.write("- [ ] 시간대별 유동성(야간/주말) 구간에서 성능 저하 여부 점검\n")
        f.write("- [ ] 워크포워드(rolling) 재검증으로 구간 과최적화 재확인\n")
        f.write("- [ ] 거래소 API 장애/지연 대비 비상 청산 로직 점검\n")
        f.write("- [ ] 포지션 사이징 상한(총노출, 연속손실 제한) 적용\n")
        f.write("- [ ] 페이퍼 트레이딩 1~2주 실시간 검증 후 소액 실거래 전환\n")

    print(f"Saved: {csv_path}")
    print(f"Saved: {report_path}")
    print("Top 5:")
    for r in top5:
        print(
            r["key"],
            f"OOS ret={r['oos_return']*100:.2f}%",
            f"OOS MDD={r['oos_mdd']*100:.2f}%",
            f"trades={r['oos_trades']}",
        )


if __name__ == "__main__":
    main()
