'use client'

import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app'
import type { Auth } from 'firebase/auth'

const config: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const configured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId)
const app = configured ? (getApps()[0] || initializeApp(config)) : null
export const auth: Auth | null = app ? getAuth(app) : null
export const googleProvider: GoogleAuthProvider | null = app ? new GoogleAuthProvider() : null
googleProvider?.setCustomParameters({ prompt: 'select_account' })
