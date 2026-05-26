"""
Geocoding via Nominatim (OpenStreetMap) — completely free, no API key.
Policy: max 1 req/second, must send a User-Agent.
We call this only once per restaurant (at registration or address update),
so rate limits are never an issue.
"""
import json
import logging
import time
import urllib.parse
import urllib.request
from typing import Optional

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "FoodCamp/1.0 (food redistribution app)"

# Simple in-process cache so the same address is never geocoded twice per run
_cache: dict[str, tuple[float, float]] = {}


def geocode(address: str) -> Optional[tuple[float, float]]:
    """
    Convert a free-text address to (latitude, longitude).
    Returns None if the address can't be resolved.
    """
    if not address or not address.strip():
        return None

    key = address.strip().lower()
    if key in _cache:
        return _cache[key]

    params = urllib.parse.urlencode({"q": address, "format": "json", "limit": "1"})
    url = f"{NOMINATIM_URL}?{params}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=6) as resp:
            results = json.loads(resp.read().decode())
        if results:
            lat = float(results[0]["lat"])
            lon = float(results[0]["lon"])
            _cache[key] = (lat, lon)
            logger.info("Geocoded '%s' → (%.5f, %.5f)", address, lat, lon)
            return lat, lon
        logger.warning("Nominatim returned no results for '%s'", address)
    except Exception as exc:
        logger.warning("Geocoding failed for '%s': %s", address, exc)

    time.sleep(1)   # be polite to OSM even on failure
    return None
