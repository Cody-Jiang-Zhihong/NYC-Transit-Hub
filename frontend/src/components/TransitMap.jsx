import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from 'react-leaflet'

function getContrastText(hexColor) {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 128 ? '#fff' : '#172033'
}

function interpolateAlong(coordinates, fraction) {
  if (coordinates.length < 2) return coordinates[0]
  const maxIdx = coordinates.length - 1
  const pos = fraction * maxIdx
  const i = Math.min(Math.floor(pos), maxIdx - 1)
  const t = pos - i
  const [lat1, lng1] = coordinates[i]
  const [lat2, lng2] = coordinates[i + 1]
  return [lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t]
}

export function TransitMap({ labels, routes, stations }) {
  const [hiddenRoutes, setHiddenRoutes] = useState(new Set())
  const [showVehicles, setShowVehicles] = useState(true)
  const [vehicleFractions, setVehicleFractions] = useState({})

  // Initialise vehicle positions for newly loaded routes
  useEffect(() => {
    if (routes.length === 0) return
    setVehicleFractions(prev => {
      const next = { ...prev }
      routes.forEach(r => {
        if (!(r.route_id in next)) {
          next[r.route_id] = Math.random()
        }
      })
      return next
    })
  }, [routes])

  // Advance vehicle positions every 1.5 s
  useEffect(() => {
    if (!showVehicles || routes.length === 0) return
    const id = setInterval(() => {
      setVehicleFractions(prev => {
        const next = {}
        for (const [k, v] of Object.entries(prev)) {
          next[k] = (v + 0.004) % 1
        }
        return next
      })
    }, 1500)
    return () => clearInterval(id)
  }, [showVehicles, routes.length])

  function toggleRoute(routeId) {
    setHiddenRoutes(prev => {
      const next = new Set(prev)
      if (next.has(routeId)) next.delete(routeId)
      else next.add(routeId)
      return next
    })
  }

  const visibleRoutes = routes.filter(r => !hiddenRoutes.has(r.route_id))

  return (
    <article className="surface map-panel">
      <header>
        <p className="eyebrow">{labels.map}</p>
        <h2>{labels.mapTitle}</h2>
      </header>

      {routes.length > 0 && (
        <div className="map-controls">
          <div className="map-legend">
            {routes.map(route => (
              <button
                key={route.route_id}
                title={route.name}
                onClick={() => toggleRoute(route.route_id)}
                className={`legend-pill${hiddenRoutes.has(route.route_id) ? ' faded' : ''}`}
                style={{ background: route.color, color: getContrastText(route.color) }}
              >
                {route.route_id}
              </button>
            ))}
          </div>
          <button
            className={`outline vehicle-btn${showVehicles ? ' vehicle-btn--on' : ''}`}
            onClick={() => setShowVehicles(v => !v)}
          >
            {showVehicles ? labels.hideVehicles : labels.showVehicles}
          </button>
        </div>
      )}

      <MapContainer center={[40.7527, -73.9772]} zoom={11} scrollWheelZoom className="map-frame">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {visibleRoutes.map(route => (
          <Polyline
            key={route.route_id}
            positions={route.coordinates}
            pathOptions={{ color: route.color, weight: 5, opacity: 0.8 }}
          >
            <Popup>{route.name}</Popup>
          </Polyline>
        ))}

        {stations.map(station => (
          <CircleMarker
            key={station.station_id}
            center={station.coordinates}
            radius={7}
            pathOptions={{ color: '#172033', fillColor: '#fffaf2', fillOpacity: 0.9, weight: 2 }}
          >
            <Popup>
              <strong>{station.station_name}</strong>
              <br />
              <span style={{ color: '#58627a', fontSize: '0.85em' }}>{station.borough}</span>
              {station.lines && station.lines.length > 0 && (
                <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                  {station.lines.map(line => {
                    const route = routes.find(r => r.route_id === line)
                    const bg = route?.color ?? '#172033'
                    return (
                      <span
                        key={line}
                        style={{
                          background: bg,
                          color: getContrastText(bg),
                          borderRadius: '4px',
                          padding: '0.05rem 0.35rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {line}
                      </span>
                    )
                  })}
                </div>
              )}
            </Popup>
          </CircleMarker>
        ))}

        {showVehicles &&
          visibleRoutes.map(route => {
            const frac = vehicleFractions[route.route_id]
            if (frac === undefined || route.coordinates.length < 2) return null
            const pos = interpolateAlong(route.coordinates, frac)
            return (
              <CircleMarker
                key={`v-${route.route_id}`}
                center={pos}
                radius={7}
                pathOptions={{
                  color: '#fff',
                  fillColor: route.color,
                  fillOpacity: 1,
                  weight: 2.5,
                }}
              >
                <Popup>{route.name} — Train in service</Popup>
              </CircleMarker>
            )
          })}
      </MapContainer>
    </article>
  )
}
