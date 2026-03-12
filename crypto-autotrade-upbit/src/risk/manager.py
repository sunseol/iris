from __future__ import annotations

from dataclasses import dataclass


@dataclass
class RiskState:
    equity: float
    day_start_equity: float
    open_positions: int


class RiskManager:
    def __init__(self, risk_per_trade: float, daily_max_loss: float, max_open_positions: int, min_order_krw: float):
        self.risk_per_trade = risk_per_trade
        self.daily_max_loss = daily_max_loss
        self.max_open_positions = max_open_positions
        self.min_order_krw = min_order_krw

    def can_open_new_position(self, state: RiskState) -> bool:
        if state.open_positions >= self.max_open_positions:
            return False

        drawdown = (state.day_start_equity - state.equity) / max(state.day_start_equity, 1)
        if drawdown >= self.daily_max_loss:
            return False

        return True

    def position_size_krw(self, state: RiskState, stop_loss_pct: float = 0.003) -> float:
        risk_budget = state.equity * self.risk_per_trade
        size = risk_budget / max(stop_loss_pct, 1e-6)
        return max(self.min_order_krw, size)
