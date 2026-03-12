import math
import requests
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import csv

BASE_URL = "https://api.upbit.com/v1/candles/minutes/60"
UTC = timezone.utc


@dataclass
class Config:
    market: str = "KRW-BTC"
    bars: int = 2000
    breakout_lookback: int = 20
    atr_period: int = 14
    atr_mult: float = 2.0
    risk_per_trade: float = 0.005
    fee_rate: float = 0.0005
    slippage_rate: float = 0.0005
    initial_cash: float = 10_000_000


def parse_utc(s: str) -> datetime:
    return datetime.strptime(s, "%Y-%m-%dT%H:%M:%S").replace(tzinfo=UTC)


def fetch_candles_60m(market: str, total: int):
    rows = []
    to = None
    remain = total

    while remain > 0:
        count = min(200, remain)
        params = {"market": market, "count": count}
        if to:
            params["to"] = to
        r = requests.get(BASE_URL, params=params, timeout=10)
        r.raise_for_status()
        chunk = r.json()
        if not chunk:
            break
        rows.extend(chunk)

        last = parse_utc(chunk[-1]["candle_date_time_utc"])
        to_dt = last - timedelta(hours=1)
        to = to_dt.strftime("%Y-%m-%d %H:%M:%S")
        remain -= len(chunk)

    seen = set()
    out = []
    for r in rows:
        key = r["candle_date_time_utc"]
        if key in seen:
            continue
        seen.add(key)
        out.append({
            "time": parse_utc(key),
            "open": float(r["opening_price"]),
            "high": float(r["high_price"]),
            "low": float(r["low_price"]),
            "close": float(r["trade_price"]),
            "volume": float(r["candle_acc_trade_volume"]),
        })

    out.sort(key=lambda x: x["time"])
    return out


def sma(values):
    return sum(values) / len(values) if values else float("nan")


def calc_indicators(data, cfg: Config):
    trs = []
    for i, c in enumerate(data):
        prev_close = data[i - 1]["close"] if i > 0 else c["close"]
        tr = max(c["high"] - c["low"], abs(c["high"] - prev_close), abs(c["low"] - prev_close))
        trs.append(tr)

    atr = [float("nan")] * len(data)
    for i in range(cfg.atr_period - 1, len(data)):
        atr[i] = sma(trs[i - cfg.atr_period + 1 : i + 1])

    breakout = [float("nan")] * len(data)
    for i in range(cfg.breakout_lookback, len(data)):
        window = [data[j]["high"] for j in range(i - cfg.breakout_lookback, i)]
        breakout[i] = max(window)

    for i in range(len(data)):
        data[i]["atr"] = atr[i]
        data[i]["breakout_high"] = breakout[i]


def run_backtest(data, cfg: Config):
    cash = cfg.initial_cash
    qty = 0.0
    entry = 0.0
    stop = 0.0
    entry_time = None
    pos_risk = 0.0

    eq = []
    trades = []

    for c in data:
        price = c["close"]
        atr = c["atr"]
        bh = c["breakout_high"]

        if qty > 0:
            trail = price - cfg.atr_mult * atr
            stop = max(stop, trail)
            if c["low"] <= stop:
                exit_px = stop * (1 - cfg.slippage_rate)
                gross = qty * exit_px
                exit_fee = gross * cfg.fee_rate
                cash += gross - exit_fee
                entry_fee = entry * qty * cfg.fee_rate
                pnl = (exit_px - entry) * qty - entry_fee - exit_fee
                r = pnl / pos_risk if pos_risk > 0 else 0.0
                trades.append({
                    "entry_time": entry_time.isoformat(),
                    "exit_time": c["time"].isoformat(),
                    "entry": round(entry, 2),
                    "exit": round(exit_px, 2),
                    "qty": round(qty, 8),
                    "pnl": round(pnl, 2),
                    "r": round(r, 4),
                })
                qty = 0.0
                entry = 0.0
                stop = 0.0
                pos_risk = 0.0
                entry_time = None

        if qty == 0 and not math.isnan(atr) and not math.isnan(bh) and price > bh:
            stop_candidate = price - cfg.atr_mult * atr
            risk_per_coin = max(price - stop_candidate, 1e-9)
            risk_budget = cash * cfg.risk_per_trade
            raw_qty = risk_budget / risk_per_coin

            entry_px = price * (1 + cfg.slippage_rate)
            max_qty = cash / (entry_px * (1 + cfg.fee_rate))
            buy_qty = min(raw_qty, max_qty)

            if buy_qty > 0:
                cost = buy_qty * entry_px
                fee = cost * cfg.fee_rate
                cash -= (cost + fee)
                qty = buy_qty
                entry = entry_px
                stop = stop_candidate
                entry_time = c["time"]
                pos_risk = max((entry - stop) * qty, 1e-9)

        eq.append(cash + qty * price)

    if qty > 0:
        c = data[-1]
        exit_px = c["close"] * (1 - cfg.slippage_rate)
        gross = qty * exit_px
        exit_fee = gross * cfg.fee_rate
        cash += gross - exit_fee
        entry_fee = entry * qty * cfg.fee_rate
        pnl = (exit_px - entry) * qty - entry_fee - exit_fee
        r = pnl / pos_risk if pos_risk > 0 else 0.0
        trades.append({
            "entry_time": entry_time.isoformat(),
            "exit_time": c["time"].isoformat(),
            "entry": round(entry, 2),
            "exit": round(exit_px, 2),
            "qty": round(qty, 8),
            "pnl": round(pnl, 2),
            "r": round(r, 4),
        })
        eq[-1] = cash

    final_equity = eq[-1]
    total_return = final_equity / cfg.initial_cash - 1

    peak = eq[0]
    mdd = 0.0
    for v in eq:
        if v > peak:
            peak = v
        dd = v / peak - 1
        if dd < mdd:
            mdd = dd

    wins = sum(1 for t in trades if t["pnl"] > 0)
    losses = [t["pnl"] for t in trades if t["pnl"] < 0]
    profits = [t["pnl"] for t in trades if t["pnl"] > 0]
    win_rate = wins / len(trades) if trades else 0.0
    avg_r = sum(t["r"] for t in trades) / len(trades) if trades else 0.0
    pf = (sum(profits) / abs(sum(losses))) if losses else None

    return {
        "start": data[0]["time"],
        "end": data[-1]["time"],
        "bars": len(data),
        "final_equity": final_equity,
        "total_return": total_return,
        "max_drawdown": mdd,
        "trades": len(trades),
        "win_rate": win_rate,
        "avg_r": avg_r,
        "profit_factor": pf,
        "trades_list": trades,
    }


def main():
    cfg = Config()
    data = fetch_candles_60m(cfg.market, cfg.bars)
    calc_indicators(data, cfg)
    result = run_backtest(data, cfg)

    print("=== BTC Paper Backtest (60m Breakout + ATR Stop) ===")
    print(f"Market: {cfg.market}")
    print(f"Period: {result['start']} -> {result['end']}")
    print(f"Bars: {result['bars']}")
    print(f"Initial: {cfg.initial_cash:,.0f} KRW")
    print(f"Final  : {result['final_equity']:,.0f} KRW")
    print(f"Return : {result['total_return']*100:.2f}%")
    print(f"MDD    : {result['max_drawdown']*100:.2f}%")
    print(f"Trades : {result['trades']}")
    print(f"WinRate: {result['win_rate']*100:.2f}%")
    print(f"Avg R  : {result['avg_r']:.2f}")
    if result["profit_factor"] is not None:
        print(f"PF     : {result['profit_factor']:.2f}")

    if result["trades_list"]:
        with open("btc_backtest_trades.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=result["trades_list"][0].keys())
            writer.writeheader()
            writer.writerows(result["trades_list"])
        print("Saved: btc_backtest_trades.csv")


if __name__ == "__main__":
    main()
