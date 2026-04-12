import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from 'react-leaflet'

export function TransitMap({ labels, routes, stations }) {
  return (
    <article className="surface map-panel">
      <header>
        <p className="eyebrow">{labels.map}</p>
        <h2>{labels.mapTitle}</h2>
      </header>
      <MapContainer center={[40.7527, -73.9772]} zoom={11} scrollWheelZoom className="map-frame">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {routes.map((route) => (
          <Polyline key={route.route_id} positions={route.coordinates} pathOptions={{ color: route.color, weight: 5, opacity: 0.75 }}>
            <Popup>{route.name}</Popup>
          </Polyline>
        ))}
        {stations.map((station) => (
          <CircleMarker key={station.station_id} center={station.coordinates} radius={7} pathOptions={{ color: '#172033', fillColor: '#fffaf2', fillOpacity: 0.9 }}>
            <Popup>
              <strong>{station.station_name}</strong>
              <p>{station.borough}</p>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </article>
  )
}
