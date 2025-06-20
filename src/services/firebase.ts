import { initializeApp, getApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
// This check prevents re-initialization during hot-reloads in development.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Realtime Database and get a reference to the service
export const realtimeDb = getDatabase(app)

// Add and export the Firestore database instance
export const firestoreDb = getFirestore(app) 