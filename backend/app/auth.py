from functools import lru_cache
import json

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials
from flask import current_app, request


@lru_cache(maxsize=1)
def _firebase_app():
    project_id = current_app.config.get("FIREBASE_PROJECT_ID")
    credentials_json = current_app.config.get("FIREBASE_CREDENTIALS")
    if not project_id or not credentials_json:
        return None

    if firebase_admin._apps:
        return firebase_admin.get_app()

    certificate = credentials.Certificate(json.loads(credentials_json))
    return firebase_admin.initialize_app(certificate, {"projectId": project_id})


def resolve_user():
    token = request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
    user_id = request.headers.get("X-User-Id") or request.args.get("user_id") or "demo-rider"

    firebase_app = _firebase_app()
    if firebase_app and token:
        decoded = firebase_auth.verify_id_token(token, app=firebase_app)
        return decoded["uid"]

    return user_id
