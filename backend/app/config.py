import os
from pathlib import Path


class Config:
    BASE_DIR = Path(__file__).resolve().parent.parent
    DATABASE_PATH = os.getenv("DATABASE_PATH", str(BASE_DIR / "transit_hub.db"))
    SECRET_KEY = os.getenv("SECRET_KEY", "development-secret")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")

    MTA_API_BASE_URL = os.getenv("MTA_API_BASE_URL", "https://api.mta.info")
    MTA_API_KEY = os.getenv("MTA_API_KEY", "")
    MTA_STATUS_ENDPOINT = os.getenv("MTA_STATUS_ENDPOINT", "")
    MTA_ACCESSIBILITY_ENDPOINT = os.getenv("MTA_ACCESSIBILITY_ENDPOINT", "")
    MTA_MAP_ENDPOINT = os.getenv("MTA_MAP_ENDPOINT", "")
    USE_SAMPLE_DATA = os.getenv("USE_SAMPLE_DATA", "true").lower() == "true"

    FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "")
    FIREBASE_CREDENTIALS = os.getenv("FIREBASE_CREDENTIALS", "")
