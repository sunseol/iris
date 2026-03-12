from __future__ import annotations

from .base import Executor, OrderResult


class UpbitLiveExecutor(Executor):
    def __init__(self, access_key: str, secret_key: str):
        if not access_key or not secret_key:
            raise ValueError("Upbit API keys are required for live mode")
        self.access_key = access_key
        self.secret_key = secret_key

    def buy_market(self, symbol: str, krw_amount: float) -> OrderResult:
        # Live trading is intentionally disabled in this workspace (paper/simulation only).
        return OrderResult(ok=False, order_id=None, message="Live buy is disabled (paper mode only)")

    def sell_market(self, symbol: str, volume: float) -> OrderResult:
        # Live trading is intentionally disabled in this workspace (paper/simulation only).
        return OrderResult(ok=False, order_id=None, message="Live sell is disabled (paper mode only)")
