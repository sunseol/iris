from __future__ import annotations

import uuid
from .base import Executor, OrderResult


class PaperExecutor(Executor):
    def buy_market(self, symbol: str, krw_amount: float) -> OrderResult:
        return OrderResult(ok=True, order_id=str(uuid.uuid4()), message=f"PAPER BUY {symbol} {krw_amount:,.0f} KRW")

    def sell_market(self, symbol: str, volume: float) -> OrderResult:
        return OrderResult(ok=True, order_id=str(uuid.uuid4()), message=f"PAPER SELL {symbol} {volume}")
