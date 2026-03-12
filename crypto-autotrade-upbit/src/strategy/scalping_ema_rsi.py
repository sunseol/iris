from __future__ import annotations

import pandas as pd

from .base import Signal, Strategy


class ScalpingEmaRsiStrategy(Strategy):
    name = "scalping_ema_rsi"

    def generate(self, symbol: str, candles: pd.DataFrame) -> Signal:
        if candles is None or len(candles) < 30:
            return Signal(symbol=symbol, side="hold", confidence=0.0, reason="not_enough_data")

        close = candles["close"].astype(float)
        ema_fast = close.ewm(span=9).mean().iloc[-1]
        ema_slow = close.ewm(span=21).mean().iloc[-1]

        delta = close.diff()
        gain = delta.where(delta > 0, 0.0).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0.0)).rolling(14).mean()
        rs = gain / (loss.replace(0, 1e-9))
        rsi = 100 - (100 / (1 + rs))
        current_rsi = float(rsi.iloc[-1])

        last_price = close.iloc[-1]
        prev_price = close.iloc[-2]
        momentum_up = last_price > prev_price

        if ema_fast > ema_slow and current_rsi < 42 and momentum_up:
            return Signal(symbol=symbol, side="buy", confidence=0.65, reason="ema_up_rsi_pullback")

        if ema_fast < ema_slow and current_rsi > 60:
            return Signal(symbol=symbol, side="sell", confidence=0.6, reason="ema_down_or_overbought")

        return Signal(symbol=symbol, side="hold", confidence=0.2, reason="no_setup")
