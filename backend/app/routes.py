from flask import Blueprint, jsonify, request

from .auth import resolve_user
from .db import get_db
from .mta_client import TransitDataService

api = Blueprint("api", __name__)
transit_service = TransitDataService()


@api.get("/health")
def health():
    return jsonify({"ok": True})


@api.get("/dashboard")
def dashboard():
    return jsonify(transit_service.get_dashboard())


@api.get("/status")
def status():
    return jsonify(transit_service.get_service_status())


@api.get("/routes/map")
def routes_map():
    return jsonify(transit_service.get_map_data())


@api.get("/accessibility")
def accessibility():
    return jsonify(transit_service.get_accessibility())


@api.get("/stations/search")
def search_stations():
    query = request.args.get("q", "").lower()
    stations = transit_service.get_accessibility()["stations"]
    if not query:
        return jsonify({"stations": stations})

    matches = [
        station
        for station in stations
        if query in station["station_name"].lower()
        or query in station["borough"].lower()
        or query in " ".join(station["lines"]).lower()
    ]
    return jsonify({"stations": matches})


@api.route("/favorites", methods=["GET", "POST"])
def favorites():
    database = get_db()
    user_id = resolve_user()

    if request.method == "POST":
        payload = request.get_json() or {}
        database.execute(
            "INSERT INTO favorites (user_id, route_id, station_name, label) VALUES (?, ?, ?, ?)",
            (user_id, payload["route_id"], payload["station_name"], payload["label"]),
        )
        database.commit()
        return jsonify({"ok": True}), 201

    rows = database.execute(
        "SELECT id, route_id, station_name, label, created_at FROM favorites WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,),
    ).fetchall()
    return jsonify({"favorites": [dict(row) for row in rows]})


@api.route("/alerts", methods=["GET", "POST"])
def alerts():
    database = get_db()
    user_id = resolve_user()

    if request.method == "POST":
        payload = request.get_json() or {}
        database.execute(
            "INSERT INTO alerts (user_id, route_id, station_name, notification_type) VALUES (?, ?, ?, ?)",
            (user_id, payload["route_id"], payload["station_name"], payload["notification_type"]),
        )
        database.commit()
        return jsonify({"ok": True}), 201

    rows = database.execute(
        "SELECT id, route_id, station_name, notification_type, created_at FROM alerts WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,),
    ).fetchall()
    return jsonify({"alerts": [dict(row) for row in rows]})
