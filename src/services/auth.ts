import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type AuthError,
  type UserCredential,
} from 'firebase/auth'
import { auth } from './firebase'
import type { LoginCredentials } from '../types/auth'

export const signInWithGoogle = (): Promise<UserCredential> => {
  const provider = new GoogleAuthProvider()
  return signInWithPopup(auth, provider)
}

export const signUp = ({
  email,
  password,
}: LoginCredentials): Promise<UserCredential> => {
  return createUserWithEmailAndPassword(auth, email, password)
}

export const signIn = ({
  email,
  password,
}: LoginCredentials): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password)
}

export const signOut = (): Promise<void> => {
  return firebaseSignOut(auth)
}

// Helper to check if an error is an AuthError
export const isAuthError = (error: unknown): error is AuthError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  )
} 