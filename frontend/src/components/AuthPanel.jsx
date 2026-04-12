import { useState } from 'react'

export function AuthPanel({ labels, authState, onAuthenticate, onSignOut, firebaseEnabled, busy }) {
  const [form, setForm] = useState({ email: '', password: '' })

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  return (
    <article className="surface auth-panel">
      <header>
        <p className="eyebrow">{labels.accounts}</p>
        <h2>{labels.authTitle}</h2>
      </header>
      <p className="muted">
        {firebaseEnabled ? labels.firebaseReady : labels.demoAuth}
      </p>
      <label>
        {labels.email}
        <input name="email" type="email" value={form.email} onChange={updateField} placeholder="rider@example.com" />
      </label>
      <label>
        {labels.password}
        <input name="password" type="password" value={form.password} onChange={updateField} placeholder="********" />
      </label>
      <div className="button-row">
        <button disabled={busy} onClick={() => onAuthenticate('signin', form)}>
          {labels.signIn}
        </button>
        <button className="secondary" disabled={busy} onClick={() => onAuthenticate('signup', form)}>
          {labels.signUp}
        </button>
      </div>
      <div className="account-card">
        <strong>{labels.activeUser}</strong>
        <span>{authState.email}</span>
      </div>
      <button className="outline" disabled={busy} onClick={onSignOut}>
        {labels.signOut}
      </button>
    </article>
  )
}
