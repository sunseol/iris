from __future__ import annotations

import os
from dataclasses import dataclass
from dotenv import load_dotenv


@dataclass
class Settings:
    mode: str
    symbols: list[str]
    start_capital_krw: float
    risk_per_trade: float
    daily_max_loss: float
    max_open_positions: int
    min_order_krw: float
    upbit_access_key: str
    upbit_secret_key: str
    telegram_bot_token: str | None
    telegram_chat_id: str | None


def load_settings() -> Settings:
    load_dotenv()
    return Settings(
        mode=os.getenv("MODE", "paper").lower(),
        symbols=[s.strip() for s in os.getenv("SYMBOLS", "KRW-BTC").split(",") if s.strip()],
        start_capital_krw=float(os.getenv("START_CAPITAL_KRW", "1000000")),
        risk_per_trade=float(os.getenv("RISK_PER_TRADE", "0.005")),
        daily_max_loss=float(os.getenv("DAILY_MAX_LOSS", "0.03")),
        max_open_positions=int(os.getenv("MAX_OPEN_POSITIONS", "3")),
        min_order_krw=float(os.getenv("MIN_ORDER_KRW", "10000")),
        upbit_access_key=os.getenv("UPBIT_ACCESS_KEY", ""),
        upbit_secret_key=os.getenv("UPBIT_SECRET_KEY", ""),
        telegram_bot_token=os.getenv("TELEGRAM_BOT_TOKEN") or None,
        telegram_chat_id=os.getenv("TELEGRAM_CHAT_ID") or None,
    )
