import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'

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

// Zooms the map to fit a selected route's coordinates
function MapFocus({ selectedRoute, routes }) {
  const map = useMap()
  useEffect(() => {
    if (!selectedRoute) return
    const route = routes.find(r => r.route_id === selectedRoute)
    if (route && route.coordinates.length > 1) {
      map.fitBounds(route.coordinates, { padding: [48, 48], maxZoom: 13, animate: true })
    }
  }, [selectedRoute, routes, map])
  return null
}

export function TransitMap({ labels, routes, stations, accessibilityStations = [], services = [], selectedRoute, onRouteSelect }) {
  const [hiddenRoutes, setHiddenRoutes] = useState(new Set())
  const [showVehicles, setShowVehicles] = useState(true)
  const [vehicleFractions, setVehicleFractions] = useState({})

  // Build a lookup: route_id → service status
  const statusByRoute = Object.fromEntries(
    services.map(s => [s.route_id, s.status])
  )

  // Build a lookup: station_id → accessibility info
  const accessByStation = Object.fromEntries(
    accessibilityStations.map(s => [s.station_id, s])
  )

  // Initialise vehicle positions for newly loaded routes
  useEffect(() => {
    if (routes.length === 0) return
    setVehicleFractions(prev => {
      const next = { ...prev }
      routes.forEach(r => {
        if (!(r.route_id in next)) next[r.route_id] = Math.random()
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
        for (const [k, v] of Object.entries(prev)) next[k] = (v + 0.004) % 1
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

  function handleRouteClick(routeId) {
    onRouteSelect?.(routeId === selectedRoute ? null : routeId)
  }

  const hasSelection = selectedRoute !== null
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
            {routes.map(route => {
              const status = statusByRoute[route.route_id]
              const hasIssue = status && status !== 'Good Service'
              return (
                <button
                  key={route.route_id}
                  title={`${route.name}${status ? ` — ${status}` : ''}`}
                  onClick={() => toggleRoute(route.route_id)}
                  className={`legend-pill${hiddenRoutes.has(route.route_id) ? ' faded' : ''}${hasIssue ? ' has-issue' : ''}`}
                  style={{ background: route.color, color: getContrastText(route.color) }}
                >
                  {route.route_id}
                </button>
              )
            })}
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

        <MapFocus selectedRoute={selectedRoute} routes={routes} />

        {/* Base route polylines */}
        {visibleRoutes.map(route => {
          const isSelected = route.route_id === selectedRoute
          const status = statusByRoute[route.route_id]
          const isDelayed = status === 'Delay'
          const isPlanned = status === 'Planned Work'

          return (
            <Polyline
              key={route.route_id}
              positions={route.coordinates}
              pathOptions={{
                color: route.color,
                weight: isSelected ? 9 : 5,
                opacity: hasSelection && !isSelected ? 0.25 : 0.85,
              }}
              eventHandlers={{ click: () => handleRouteClick(route.route_id) }}
            >
              <Popup>
                <strong>{route.name}</strong>
                {status && (
                  <div style={{ marginTop: '0.25rem', fontSize: '0.82rem', color: isDelayed ? '#ef4444' : isPlanned ? '#b96a08' : '#0d9467' }}>
                    {status}
                  </div>
                )}
                <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: '#64748b' }}>
                  Click to {isSelected ? 'deselect' : 'focus'}
                </div>
              </Popup>
            </Polyline>
          )
        })}

        {/* Service disruption overlay — dashed stripe on delayed/planned routes */}
        {visibleRoutes.map(route => {
          const status = statusByRoute[route.route_id]
          if (!status || status === 'Good Service') return null
          const isDelayed = status === 'Delay'
          return (
            <Polyline
              key={`disruption-${route.route_id}`}
              positions={route.coordinates}
              pathOptions={{
                color: isDelayed ? '#ef4444' : '#f59e0b',
                weight: 3,
                opacity: hasSelection && route.route_id !== selectedRoute ? 0.1 : 0.6,
                dashArray: isDelayed ? '6 8' : '2 10',
              }}
              interactive={false}
            />
          )
        })}

        {/* Station markers */}
        {stations.map(station => {
          const access = accessByStation[station.station_id]
          const elevatorOk = !access || access.elevator_status === 'Available'
          const escalatorOk = !access || access.escalator_status === 'Available'

          return (
            <CircleMarker
              key={station.station_id}
              center={station.coordinates}
              radius={6}
              pathOptions={{ color: '#0d1526', fillColor: '#ffffff', fillOpacity: 0.95, weight: 2 }}
            >
              <Popup>
                <strong style={{ fontSize: '0.9rem' }}>{station.station_name}</strong>
                <br />
                <span style={{ color: '#64748b', fontSize: '0.82rem' }}>{station.borough}</span>

                {station.lines && station.lines.length > 0 && (
                  <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {station.lines.map(line => {
                      const route = routes.find(r => r.route_id === line)
                      const bg = route?.color ?? '#172033'
                      return (
                        <span key={line} style={{ background: bg, color: getContrastText(bg), borderRadius: '4px', padding: '0.05rem 0.35rem', fontSize: '0.72rem', fontWeight: 700 }}>
                          {line}
                        </span>
                      )
                    })}
                  </div>
                )}

                {access && (
                  <div style={{ marginTop: '0.5rem', display: 'grid', gap: '0.2rem', fontSize: '0.78rem' }}>
                    <span style={{ color: elevatorOk ? '#0d9467' : '#ef4444' }}>
                      {elevatorOk ? '✓' : '✗'} Elevator: {access.elevator_status}
                    </span>
                    <span style={{ color: escalatorOk ? '#0d9467' : '#ef4444' }}>
                      {escalatorOk ? '✓' : '✗'} Escalator: {access.escalator_status}
                    </span>
                  </div>
                )}
              </Popup>
            </CircleMarker>
          )
        })}

        {/* Animated vehicle markers */}
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
                pathOptions={{ color: '#fff', fillColor: route.color, fillOpacity: 1, weight: 2.5 }}
              >
                <Popup>{route.name} — Train in service</Popup>
              </CircleMarker>
            )
          })}
      </MapContainer>
    </article>
  )
}
