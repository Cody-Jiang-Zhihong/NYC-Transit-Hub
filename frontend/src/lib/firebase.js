import { initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export function createAuthClient() {
  const enabled = Object.values(config).every(Boolean)
  if (!enabled) {
    return {
      enabled: false,
      signIn: async (email) => ({ user: { uid: email, email, getIdToken: async () => '' } }),
      signUp: async (email) => ({ user: { uid: email, email, getIdToken: async () => '' } }),
      signOut: async () => {},
    }
  }

  const app = initializeApp(config)
  const auth = getAuth(app)

  return {
    enabled: true,
    signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
    signUp: (email, password) => createUserWithEmailAndPassword(auth, email, password),
    signOut: () => signOut(auth),
  }
}
