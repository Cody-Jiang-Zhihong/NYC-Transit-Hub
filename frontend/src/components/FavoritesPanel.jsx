import { useState } from 'react'

export function FavoritesPanel({ labels, favorites, alerts, onFavoriteSave, onAlertSave, disabled }) {
  const [favoriteForm, setFavoriteForm] = useState({ route_id: 'A', station_name: '34 St-Penn Station', label: 'Commute' })
  const [alertForm, setAlertForm] = useState({ route_id: 'A', station_name: '34 St-Penn Station', notification_type: 'delay' })

  return (
    <article className="surface">
      <header>
        <p className="eyebrow">{labels.savedTrips}</p>
        <h2>{labels.favoritesTitle}</h2>
      </header>
      <div className="grid-form">
        <label>
          {labels.route}
          <input
            value={favoriteForm.route_id}
            onChange={(event) => setFavoriteForm({ ...favoriteForm, route_id: event.target.value })}
          />
        </label>
        <label>
          {labels.station}
          <input
            value={favoriteForm.station_name}
            onChange={(event) => setFavoriteForm({ ...favoriteForm, station_name: event.target.value })}
          />
        </label>
        <label>
          {labels.label}
          <input
            value={favoriteForm.label}
            onChange={(event) => setFavoriteForm({ ...favoriteForm, label: event.target.value })}
          />
        </label>
      </div>
      <button disabled={disabled} onClick={() => onFavoriteSave(favoriteForm)}>
        {labels.saveFavorite}
      </button>
      <div className="list-block">
        {(favorites.length ? favorites : [{ id: 'empty', label: labels.noFavorites, route_id: '-', station_name: '-' }]).map((favorite) => (
          <div className="mini-card" key={favorite.id}>
            <strong>{favorite.label}</strong>
            <span>{favorite.route_id} · {favorite.station_name}</span>
          </div>
        ))}
      </div>

      <h3>{labels.alertsTitle}</h3>
      <div className="grid-form">
        <label>
          {labels.route}
          <input
            value={alertForm.route_id}
            onChange={(event) => setAlertForm({ ...alertForm, route_id: event.target.value })}
          />
        </label>
        <label>
          {labels.station}
          <input
            value={alertForm.station_name}
            onChange={(event) => setAlertForm({ ...alertForm, station_name: event.target.value })}
          />
        </label>
        <label>
          {labels.alertType}
          <select
            value={alertForm.notification_type}
            onChange={(event) => setAlertForm({ ...alertForm, notification_type: event.target.value })}
          >
            <option value="delay">{labels.delayAlerts}</option>
            <option value="service_change">{labels.serviceChanges}</option>
            <option value="accessibility">{labels.accessibilityAlerts}</option>
          </select>
        </label>
      </div>
      <button className="secondary" disabled={disabled} onClick={() => onAlertSave(alertForm)}>
        {labels.saveAlert}
      </button>
      <div className="list-block">
        {(alerts.length ? alerts : [{ id: 'empty-alert', route_id: '-', station_name: labels.noAlerts, notification_type: '-' }]).map((alert) => (
          <div className="mini-card" key={alert.id}>
            <strong>{alert.notification_type}</strong>
            <span>{alert.route_id} · {alert.station_name}</span>
          </div>
        ))}
      </div>
    </article>
  )
}
