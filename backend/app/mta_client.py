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
            "route_id": "1",
            "name": "1 Line – Broadway Local",
            "color": "#EE352E",
            "coordinates": [
                [40.8893, -73.8987],
                [40.8648, -73.9192],
                [40.8499, -73.9336],
                [40.8155, -73.9594],
                [40.7914, -73.9723],
                [40.7781, -73.9821],
                [40.7685, -73.9819],
                [40.7559, -73.9869],
                [40.7506, -73.9916],
                [40.7370, -73.9998],
                [40.7148, -74.0083],
                [40.7014, -74.0133],
            ],
        },
        {
            "route_id": "6",
            "name": "6 Line – Lexington Local",
            "color": "#00933C",
            "coordinates": [
                [40.8553, -73.9120],
                [40.8045, -73.9375],
                [40.7798, -73.9555],
                [40.7681, -73.9641],
                [40.7527, -73.9772],
                [40.7456, -73.9826],
                [40.7343, -73.9896],
                [40.7134, -74.0043],
                [40.6945, -73.9907],
            ],
        },
        {
            "route_id": "A",
            "name": "A Line – 8 Av Express",
            "color": "#0039A6",
            "coordinates": [
                [40.8681, -73.9207],
                [40.8402, -73.9395],
                [40.8110, -73.9512],
                [40.7685, -73.9819],
                [40.7572, -74.0007],
                [40.7506, -73.9916],
                [40.7323, -74.0003],
                [40.7091, -74.0079],
                [40.6926, -73.9868],
            ],
        },
        {
            "route_id": "7",
            "name": "7 Line – Flushing Express",
            "color": "#B933AD",
            "coordinates": [
                [40.7596, -73.8300],
                [40.7475, -73.8912],
                [40.7505, -73.9180],
                [40.7505, -73.9400],
                [40.7516, -73.9660],
                [40.7559, -73.9869],
            ],
        },
        {
            "route_id": "L",
            "name": "L Line – Canarsie",
            "color": "#A7A9AC",
            "coordinates": [
                [40.7406, -74.0074],
                [40.7374, -74.0000],
                [40.7350, -73.9897],
                [40.7314, -73.9815],
                [40.7141, -73.9517],
                [40.7069, -73.9219],
                [40.6462, -73.9015],
            ],
        },
        {
            "route_id": "N",
            "name": "N/Q/R – Broadway Express",
            "color": "#FCCC0A",
            "coordinates": [
                [40.7722, -73.9302],
                [40.7635, -73.9323],
                [40.7569, -73.9497],
                [40.7554, -73.9871],
                [40.7481, -73.9879],
                [40.7389, -73.9894],
                [40.7281, -73.9956],
                [40.7026, -74.0133],
                [40.6827, -73.9805],
            ],
        },
    ],
    "stations": [
        {
            "station_id": "TSQ",
            "station_name": "Times Sq-42 St",
            "borough": "Manhattan",
            "lines": ["1", "2", "3", "7", "A", "C", "E", "N", "Q", "R"],
            "coordinates": [40.7559, -73.9869],
        },
        {
            "station_id": "GC",
            "station_name": "Grand Central-42 St",
            "borough": "Manhattan",
            "lines": ["4", "5", "6", "7", "S"],
            "coordinates": [40.7527, -73.9772],
        },
        {
            "station_id": "PEN",
            "station_name": "34 St-Penn Station",
            "borough": "Manhattan",
            "lines": ["1", "2", "3", "A", "C", "E"],
            "coordinates": [40.7506, -73.9916],
        },
        {
            "station_id": "USQ",
            "station_name": "14 St-Union Sq",
            "borough": "Manhattan",
            "lines": ["4", "5", "6", "L", "N", "Q", "R", "W"],
            "coordinates": [40.7343, -73.9896],
        },
        {
            "station_id": "COL",
            "station_name": "59 St-Columbus Circle",
            "borough": "Manhattan",
            "lines": ["1", "A", "B", "C", "D"],
            "coordinates": [40.7685, -73.9819],
        },
        {
            "station_id": "QBP",
            "station_name": "Queensboro Plaza",
            "borough": "Queens",
            "lines": ["7", "N", "W"],
            "coordinates": [40.7505, -73.9400],
        },
        {
            "station_id": "JSM",
            "station_name": "Jay St-MetroTech",
            "borough": "Brooklyn",
            "lines": ["A", "C", "F", "R"],
            "coordinates": [40.6926, -73.9868],
        },
        {
            "station_id": "ATL",
            "station_name": "Atlantic Av-Barclays Ctr",
            "borough": "Brooklyn",
            "lines": ["2", "3", "4", "5", "B", "D", "N", "Q"],
            "coordinates": [40.6827, -73.9805],
        },
        {
            "station_id": "125M",
            "station_name": "125 St",
            "borough": "Manhattan",
            "lines": ["1", "A", "B", "C", "D"],
            "coordinates": [40.8110, -73.9512],
        },
        {
            "station_id": "FLS",
            "station_name": "Main St-Flushing",
            "borough": "Queens",
            "lines": ["7"],
            "coordinates": [40.7596, -73.8300],
        },
        {
            "station_id": "FUL",
            "station_name": "Fulton St",
            "borough": "Manhattan",
            "lines": ["2", "3", "4", "5", "A", "C"],
            "coordinates": [40.7091, -74.0079],
        },
        {
            "station_id": "8AV",
            "station_name": "8 Av",
            "borough": "Manhattan",
            "lines": ["L"],
            "coordinates": [40.7406, -74.0074],
        },
        {
            "station_id": "BRH",
            "station_name": "Borough Hall",
            "borough": "Brooklyn",
            "lines": ["2", "3", "4", "5"],
            "coordinates": [40.6945, -73.9907],
        },
        {
            "station_id": "AST",
            "station_name": "Astoria-Ditmars Blvd",
            "borough": "Queens",
            "lines": ["N", "W"],
            "coordinates": [40.7722, -73.9302],
        },
        {
            "station_id": "HER",
            "station_name": "34 St-Herald Sq",
            "borough": "Manhattan",
            "lines": ["B", "D", "F", "M", "N", "Q", "R", "W"],
            "coordinates": [40.7481, -73.9879],
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
