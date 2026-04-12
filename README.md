# NYC Transit Hub

NYC Transit Hub is a full-stack starter for a rider-facing web app focused on New York City transit operations. It includes a React frontend, a Flask backend, SQLite persistence for favorites and rider alerts, optional Firebase Authentication, multilingual UI support, and a demo-safe MTA integration layer that can be pointed at live endpoints when credentials are available.

## Stack

- Frontend: React 19, Vite, Pico CSS, React Leaflet
- Backend: Flask, SQLite, Requests
- Auth: Firebase email/password auth on the client, optional Firebase Admin token verification on the server
- Testing: Pytest

## Features

- Service status dashboard with live or seeded backend data
- Interactive map with route polylines and station markers
- Favorites and alert subscriptions persisted in SQLite
- Accessibility panel for elevator and escalator availability
- English, Spanish, and Chinese interface support
- Mobile-friendly responsive layout

## Run locally

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
python run.py
```

### Frontend

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

The frontend expects the API at `http://127.0.0.1:5000` by default.

## Environment

Copy `frontend/.env.example` to `.env` inside `frontend` and set Firebase values if you want real account creation. The backend supports these environment variables:

- `USE_SAMPLE_DATA=true`
- `MTA_API_BASE_URL=https://api.mta.info`
- `MTA_API_KEY=...`
- `MTA_STATUS_ENDPOINT=/...`
- `MTA_MAP_ENDPOINT=/...`
- `MTA_ACCESSIBILITY_ENDPOINT=/...`
- `FIREBASE_PROJECT_ID=...`
- `FIREBASE_CREDENTIALS={...json service account...}`

When MTA endpoints are not configured, the backend serves seeded NYC transit data so the app remains usable during development.

## Tests

```powershell
cd backend
pytest
```
