export function StationAccessibility({ labels, stations, query, onQueryChange }) {
  return (
    <article className="surface">
      <header className="split-header">
        <div>
          <p className="eyebrow">{labels.accessibility}</p>
          <h2>{labels.accessibilityTitle}</h2>
        </div>
        <label className="search-input">
          {labels.searchStations}
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={labels.searchPlaceholder} />
        </label>
      </header>
      <div className="station-table">
        {stations.map((station) => (
          <div className="station-row" key={station.station_id}>
            <div>
              <strong>{station.station_name}</strong>
              <p>{station.borough} · {station.lines.join(', ')}</p>
            </div>
            <div className="station-flags">
              <span className={`flag ${station.elevator_status === 'Available' ? 'ok' : 'warn'}`}>{labels.elevator}: {station.elevator_status}</span>
              <span className={`flag ${station.escalator_status === 'Available' ? 'ok' : 'warn'}`}>{labels.escalator}: {station.escalator_status}</span>
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}
