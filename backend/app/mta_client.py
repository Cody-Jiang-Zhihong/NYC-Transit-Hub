from datetime import datetime
from urllib.parse import urljoin

import requests
from flask import current_app


SAMPLE_STATUS = [
    {
        "route_id": "A",
        "name": "8 Av Express",
        "status": "Good Service",
        "message": "Northbound trains are running on schedule through Midtown.",
        "primary_station": "34 St-Penn Station",
        "updated_at": "Updated 2 min ago",
    },
    {
        "route_id": "7",
        "name": "Flushing Local/Express",
        "status": "Delay",
        "message": "Residual signal issues near Queensboro Plaza are adding 8-12 minutes.",
        "primary_station": "Queensboro Plaza",
        "updated_at": "Updated 1 min ago",
    },
    {
        "route_id": "M15",
        "name": "SBS to South Ferry",
        "status": "Planned Work",
        "message": "Temporary stop relocation near Houston Street due to street work.",
        "primary_station": "2 Av / Houston St",
        "updated_at": "Updated 5 min ago",
    },
]

SAMPLE_ALERTS = [
    {
        "id": "alert-a",
        "title": "A train weekend advisory",
        "description": "Downtown A trains skip 50 St overnight from 12:01 AM to 5:00 AM.",
    },
    {
        "id": "alert-7",
        "title": "Line 7 signal recovery",
        "description": "Expect crowding between Times Sq-42 St and Queensboro Plaza.",
    },
]

SAMPLE_MAP = {
    "routes": [
        {
            "route_id": "A",
            "name": "A Line",
            "color": "#0d4c92",
            "coordinates": [
                [40.7681, -73.9819],
                [40.7527, -73.9772],
                [40.7506, -73.9916],
                [40.7183, -74.0140],
            ],
        },
        {
            "route_id": "7",
            "name": "7 Line",
            "color": "#d8512f",
            "coordinates": [
                [40.7559, -73.9869],
                [40.7516, -73.9762],
                [40.7505, -73.94],
                [40.7492, -73.888],
            ],
        },
    ],
    "stations": [
        {
            "station_id": "A34",
            "station_name": "34 St-Penn Station",
            "borough": "Manhattan",
            "coordinates": [40.7506, -73.9916],
        },
        {
            "station_id": "QBP",
            "station_name": "Queensboro Plaza",
            "borough": "Queens",
            "coordinates": [40.7505, -73.94],
        },
        {
            "station_id": "GC",
            "station_name": "Grand Central-42 St",
            "borough": "Manhattan",
            "coordinates": [40.7527, -73.9772],
        },
    ],
}

SAMPLE_ACCESSIBILITY = {
    "stations": [
        {
            "station_id": "A34",
            "station_name": "34 St-Penn Station",
            "borough": "Manhattan",
            "lines": ["A", "C", "E"],
            "elevator_status": "Available",
            "escalator_status": "Available",
        },
        {
            "station_id": "GC",
            "station_name": "Grand Central-42 St",
            "borough": "Manhattan",
            "lines": ["4", "5", "6", "7", "S"],
            "elevator_status": "Planned maintenance",
            "escalator_status": "Available",
        },
        {
            "station_id": "JKS",
            "station_name": "Jamaica Center-Parsons/Archer",
            "borough": "Queens",
            "lines": ["E", "J", "Z"],
            "elevator_status": "Available",
            "escalator_status": "Out of service",
        },
    ]
}


class TransitDataService:
    def __init__(self):
        self.session = requests.Session()

    def _can_call_live(self, endpoint_key):
        endpoint = current_app.config.get(endpoint_key)
        api_key = current_app.config.get("MTA_API_KEY")
        return bool(endpoint and api_key)

    def _fetch_json(self, endpoint):
        url = endpoint if endpoint.startswith("http") else urljoin(current_app.config["MTA_API_BASE_URL"], endpoint)
        response = self.session.get(
            url,
            headers={"x-api-key": current_app.config["MTA_API_KEY"]},
            timeout=10,
        )
        response.raise_for_status()
        return response.json()

    def get_service_status(self):
        if self._can_call_live("MTA_STATUS_ENDPOINT") and not current_app.config["USE_SAMPLE_DATA"]:
            return self._fetch_json(current_app.config["MTA_STATUS_ENDPOINT"])
        return {"services": SAMPLE_STATUS, "alerts": SAMPLE_ALERTS, "meta": {"live": False}}

    def get_map_data(self):
        if self._can_call_live("MTA_MAP_ENDPOINT") and not current_app.config["USE_SAMPLE_DATA"]:
            return self._fetch_json(current_app.config["MTA_MAP_ENDPOINT"])
        return SAMPLE_MAP

    def get_accessibility(self):
        if self._can_call_live("MTA_ACCESSIBILITY_ENDPOINT") and not current_app.config["USE_SAMPLE_DATA"]:
            return self._fetch_json(current_app.config["MTA_ACCESSIBILITY_ENDPOINT"])
        return SAMPLE_ACCESSIBILITY

    def get_dashboard(self):
        status_payload = self.get_service_status()
        services = status_payload["services"]
        return {
            "overview": {
                "healthy_services": sum(1 for service in services if service["status"] == "Good Service"),
                "delayed_services": sum(1 for service in services if service["status"] != "Good Service"),
                "generated_at": datetime.utcnow().isoformat() + "Z",
            },
            "services": services,
            "alerts": status_payload["alerts"],
            "map_data": self.get_map_data(),
            "meta": status_payload.get("meta", {"live": False}),
        }
