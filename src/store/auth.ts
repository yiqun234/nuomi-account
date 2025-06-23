import { create } from 'zustand'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { goOffline, goOnline } from 'firebase/database'
import { auth, realtimeDb } from '../services/firebase'
import { getOrCreateApiKey } from '../services/apiKey'

interface AuthState {
  user: User | null
  isLoading: boolean
  logout: () => Promise<void>
}

const useAuthStore = create<AuthState>((set) => {
  // The onAuthStateChanged listener handles all state updates.
  // It runs once on initialization and on every auth state change.
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in.
      // 1. Reconnect to the database.
      goOnline(realtimeDb)
      // 2. Set user state.
      set({ user, isLoading: false })
      // 3. Ensure an API key exists.
      getOrCreateApiKey(user.uid).catch(console.error)
    } else {
      // User is signed out.
      // 1. Disconnect from the database.
      goOffline(realtimeDb)
      // 2. Set user state to null.
      set({ user: null, isLoading: false })
    }
  })

  // Return the initial state. The listener above will update it shortly.
  return {
    user: null,
    isLoading: true,
    logout: async () => {
      try {
        await signOut(auth)
        // onAuthStateChanged will handle the state update
      } catch (error) {
        console.error('Error signing out: ', error)
      }
    },
  }
})

export default useAuthStore 