from src.strategy.scalping_ema_rsi import ScalpingEmaRsiStrategy
import pandas as pd


def test_strategy_returns_signal():
    s = ScalpingEmaRsiStrategy()
    df = pd.DataFrame({
        "close": [100 + i * 0.1 for i in range(60)],
    })
    sig = s.generate("KRW-BTC", df)
    assert sig.side in {"buy", "sell", "hold"}
