from __future__ import annotations

from dataclasses import dataclass
import pandas as pd


@dataclass
class Signal:
    symbol: str
    side: str  # buy / sell / hold
    confidence: float
    reason: str


class Strategy:
    name: str = "base"

    def generate(self, symbol: str, candles: pd.DataFrame) -> Signal:
        raise NotImplementedError
