from __future__ import annotations

import requests
import pandas as pd


class UpbitPublicClient:
    BASE_URL = "https://api.upbit.com"

    def get_minute_candles(self, market: str, unit: int = 1, count: int = 200) -> pd.DataFrame:
        url = f"{self.BASE_URL}/v1/candles/minutes/{unit}"
        params = {"market": market, "count": count}
        res = requests.get(url, params=params, timeout=10)
        res.raise_for_status()
        data = res.json()

        rows = []
        for x in reversed(data):
            rows.append(
                {
                    "time": x["candle_date_time_kst"],
                    "open": x["opening_price"],
                    "high": x["high_price"],
                    "low": x["low_price"],
                    "close": x["trade_price"],
                    "volume": x["candle_acc_trade_volume"],
                }
            )
        return pd.DataFrame(rows)
