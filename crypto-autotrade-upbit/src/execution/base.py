from __future__ import annotations

from dataclasses import dataclass


@dataclass
class OrderResult:
    ok: bool
    order_id: str | None
    message: str


class Executor:
    def buy_market(self, symbol: str, krw_amount: float) -> OrderResult:
        raise NotImplementedError

    def sell_market(self, symbol: str, volume: float) -> OrderResult:
        raise NotImplementedError
