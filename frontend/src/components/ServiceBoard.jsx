export function ServiceBoard({ title, summary, services, alerts, onFavoriteSave, onAlertSave, disabled, labels }) {
  return (
    <article className="surface">
      <header>
        <p className="eyebrow">{labels.networkOverview}</p>
        <h2>{title}</h2>
      </header>
      <div className="summary-band">
        <div>
          <strong>{summary?.healthy_services ?? 0}</strong>
          <span>{labels.goodService}</span>
        </div>
        <div>
          <strong>{summary?.delayed_services ?? 0}</strong>
          <span>{labels.delays}</span>
        </div>
        <div>
          <strong>{alerts.length}</strong>
          <span>{labels.activeAlerts}</span>
        </div>
      </div>
      <div className="service-grid">
        {services.map((service) => (
          <section className="service-card" key={service.route_id}>
            <div className="service-heading">
              <span className="route-badge">{service.route_id}</span>
              <strong>{service.name}</strong>
            </div>
            <p>{service.message}</p>
            <small>{service.updated_at}</small>
            <div className="button-row compact">
              <button className="outline" disabled={disabled} onClick={() => onFavoriteSave({
                route_id: service.route_id,
                station_name: service.primary_station,
                label: `${service.route_id} monitor`,
              })}>
                {labels.favorite}
              </button>
              <button className="secondary" disabled={disabled} onClick={() => onAlertSave({
                route_id: service.route_id,
                station_name: service.primary_station,
                notification_type: 'service_change',
              })}>
                {labels.alert}
              </button>
            </div>
          </section>
        ))}
      </div>
      <h3>{labels.currentAlerts}</h3>
      <div className="list-block">
        {alerts.map((alert) => (
          <div className="mini-card" key={alert.id}>
            <strong>{alert.title}</strong>
            <span>{alert.description}</span>
          </div>
        ))}
      </div>
    </article>
  )
}
