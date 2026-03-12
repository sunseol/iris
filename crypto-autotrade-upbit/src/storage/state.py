from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Position:
    symbol: str
    volume: float
    avg_price: float


@dataclass
class BotState:
    equity: float
    day_start_equity: float
    positions: dict[str, Position] = field(default_factory=dict)

    @property
    def open_positions(self) -> int:
        return len(self.positions)
