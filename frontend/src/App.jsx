import { startTransition, useEffect, useEffectEvent, useDeferredValue, useState } from 'react'
import './index.css'
import { AuthPanel } from './components/AuthPanel'
import { FavoritesPanel } from './components/FavoritesPanel'
import { ServiceBoard } from './components/ServiceBoard'
import { StationAccessibility } from './components/StationAccessibility'
import { TransitMap } from './components/TransitMap'
import { createAuthClient } from './lib/firebase'
import {
  createAlert,
  createFavorite,
  fetchAccessibility,
  fetchAlerts,
  fetchDashboard,
  fetchFavorites,
} from './lib/api'
import { translations } from './lib/translations'

const authClient = createAuthClient()

function App() {
  const [locale, setLocale] = useState('en')
  const [dashboard, setDashboard] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [alerts, setAlerts] = useState([])
  const [stations, setStations] = useState([])
  const [statusMessage, setStatusMessage] = useState('Loading dashboard...')
  const [isBusy, setIsBusy] = useState(false)
  const [stationQuery, setStationQuery] = useState('')
  const [authState, setAuthState] = useState({
    mode: authClient.enabled ? 'firebase' : 'demo',
    userId: 'demo-rider',
    email: 'demo@nyctransithub.local',
    token: '',
  })
  const deferredStationQuery = useDeferredValue(stationQuery)
  const t = translations[locale]

  const loadDashboard = useEffectEvent(async () => {
    try {
      const [dashboardResponse, accessibilityResponse] = await Promise.all([
        fetchDashboard(),
        fetchAccessibility(),
      ])
      setDashboard(dashboardResponse)
      setStations(accessibilityResponse.stations ?? [])
      setStatusMessage(
        dashboardResponse.meta?.live
          ? t.connectedLive
          : t.connectedDemo,
      )
    } catch (error) {
      setStatusMessage(error.message)
    }
  })

  const loadUserData = useEffectEvent(async () => {
    try {
      const [favoritesResponse, alertsResponse] = await Promise.all([
        fetchFavorites(authState),
        fetchAlerts(authState),
      ])
      setFavorites(favoritesResponse.favorites ?? [])
      setAlerts(alertsResponse.alerts ?? [])
    } catch (error) {
      setStatusMessage(error.message)
    }
  })

  useEffect(() => {
    loadDashboard()
    const intervalId = window.setInterval(() => {
      loadDashboard()
    }, 60000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    loadUserData()
  }, [authState.userId, authState.token])

  const filteredStations = stations.filter((station) => {
    const query = deferredStationQuery.trim().toLowerCase()
    if (!query) return true
    return `${station.station_name} ${station.borough} ${station.lines.join(' ')}`.toLowerCase().includes(query)
  })

  async function handleFavoriteSave(payload) {
    setIsBusy(true)
    try {
      await createFavorite(authState, payload)
      const [favoritesResponse, alertsResponse] = await Promise.all([
        fetchFavorites(authState),
        fetchAlerts(authState),
      ])
      setFavorites(favoritesResponse.favorites ?? [])
      setAlerts(alertsResponse.alerts ?? [])
    } finally {
      setIsBusy(false)
    }
  }

  async function handleAlertSave(payload) {
    setIsBusy(true)
    try {
      await createAlert(authState, payload)
      const [favoritesResponse, alertsResponse] = await Promise.all([
        fetchFavorites(authState),
        fetchAlerts(authState),
      ])
      setFavorites(favoritesResponse.favorites ?? [])
      setAlerts(alertsResponse.alerts ?? [])
    } finally {
      setIsBusy(false)
    }
  }

  async function handleAuth(action, credentials) {
    if (!authClient.enabled) {
      setAuthState({
        mode: 'demo',
        userId: credentials.email || 'demo-rider',
        email: credentials.email || 'demo@nyctransithub.local',
        token: '',
      })
      return
    }

    setIsBusy(true)
    try {
      const result =
        action === 'signup'
          ? await authClient.signUp(credentials.email, credentials.password)
          : await authClient.signIn(credentials.email, credentials.password)
      setAuthState({
        mode: 'firebase',
        userId: result.user.uid,
        email: result.user.email,
        token: await result.user.getIdToken(),
      })
    } finally {
      setIsBusy(false)
    }
  }

  async function handleSignOut() {
    if (authClient.enabled) {
      await authClient.signOut()
    }
    setAuthState({
      mode: authClient.enabled ? 'firebase' : 'demo',
      userId: 'demo-rider',
      email: 'demo@nyctransithub.local',
      token: '',
    })
  }

  function changeLocale(nextLocale) {
    startTransition(() => {
      setLocale(nextLocale)
    })
  }

  return (
    <main className="app-shell">
      <section className="hero-panel surface">
        <div>
          <p className="eyebrow">NYC Transit Hub</p>
          <h1>{t.headline}</h1>
          <p className="hero-copy">{t.subhead}</p>
        </div>
        <div className="hero-meta">
          <span className={`pill ${dashboard?.meta?.live ? 'is-live' : 'is-demo'}`}>
            {statusMessage}
          </span>
          <label className="locale-picker">
            <span>{t.language}</span>
            <select value={locale} onChange={(event) => changeLocale(event.target.value)}>
              <option value="en">English</option>
              <option value="es">Espanol</option>
              <option value="zh">中文</option>
            </select>
          </label>
        </div>
      </section>

      <section className="grid-two">
        <ServiceBoard
          title={t.serviceStatus}
          summary={dashboard?.overview}
          services={dashboard?.services ?? []}
          alerts={dashboard?.alerts ?? []}
          onFavoriteSave={handleFavoriteSave}
          onAlertSave={handleAlertSave}
          disabled={isBusy}
          labels={t}
        />
        <AuthPanel
          labels={t}
          authState={authState}
          onAuthenticate={handleAuth}
          onSignOut={handleSignOut}
          firebaseEnabled={authClient.enabled}
          busy={isBusy}
        />
      </section>

      <section className="grid-two stacked-mobile">
        <TransitMap
          labels={t}
          routes={dashboard?.map_data?.routes ?? []}
          stations={dashboard?.map_data?.stations ?? []}
        />
        <FavoritesPanel
          labels={t}
          favorites={favorites}
          alerts={alerts}
          onFavoriteSave={handleFavoriteSave}
          onAlertSave={handleAlertSave}
          disabled={isBusy}
        />
      </section>

      <StationAccessibility
        labels={t}
        stations={filteredStations}
        query={stationQuery}
        onQueryChange={setStationQuery}
      />
    </main>
  )
}

export default App
