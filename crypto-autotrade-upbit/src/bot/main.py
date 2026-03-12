from __future__ import annotations

import time

from src.config.settings import load_settings
from src.data.upbit_public import UpbitPublicClient
from src.execution.paper import PaperExecutor
from src.execution.upbit_live import UpbitLiveExecutor
from src.risk.manager import RiskManager, RiskState
from src.storage.state import BotState, Position
from src.strategy.scalping_ema_rsi import ScalpingEmaRsiStrategy
from src.utils.notifier import Notifier


def create_executor(settings):
    if settings.mode == "live":
        return UpbitLiveExecutor(settings.upbit_access_key, settings.upbit_secret_key)
    return PaperExecutor()


def run() -> None:
    settings = load_settings()
    data_client = UpbitPublicClient()
    strategy = ScalpingEmaRsiStrategy()
    risk = RiskManager(
        risk_per_trade=settings.risk_per_trade,
        daily_max_loss=settings.daily_max_loss,
        max_open_positions=settings.max_open_positions,
        min_order_krw=settings.min_order_krw,
    )
    executor = create_executor(settings)
    notifier = Notifier(settings.telegram_bot_token, settings.telegram_chat_id)

    state = BotState(
        equity=settings.start_capital_krw,
        day_start_equity=settings.start_capital_krw,
    )

    notifier.send(f"🚀 Bot started | mode={settings.mode} | symbols={settings.symbols}")

    while True:
        try:
            for symbol in settings.symbols:
                candles = data_client.get_minute_candles(symbol, unit=1, count=120)
                signal = strategy.generate(symbol, candles)

                risk_state = RiskState(
                    equity=state.equity,
                    day_start_equity=state.day_start_equity,
                    open_positions=state.open_positions,
                )

                if signal.side == "buy" and symbol not in state.positions:
                    if risk.can_open_new_position(risk_state):
                        krw_amount = risk.position_size_krw(risk_state, stop_loss_pct=0.003)
                        result = executor.buy_market(symbol, krw_amount)
                        notifier.send(f"[{symbol}] BUY signal={signal.reason} result={result.message}")
                        if result.ok:
                            last_price = float(candles.iloc[-1]["close"])
                            volume = krw_amount / max(last_price, 1)
                            state.positions[symbol] = Position(symbol=symbol, volume=volume, avg_price=last_price)

                elif signal.side == "sell" and symbol in state.positions:
                    pos = state.positions[symbol]
                    result = executor.sell_market(symbol, pos.volume)
                    notifier.send(f"[{symbol}] SELL signal={signal.reason} result={result.message}")
                    if result.ok:
                        del state.positions[symbol]

            time.sleep(20)
        except KeyboardInterrupt:
            notifier.send("🛑 Bot stopped by user")
            break
        except Exception as e:
            notifier.send(f"⚠️ loop error: {e}")
            time.sleep(5)


if __name__ == "__main__":
    run()
