import { create } from 'zustand'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../services/firebase'
import { getOrCreateApiKey } from '../services/database'

interface AuthState {
  user: User | null
  isLoading: boolean
}

const useAuthStore = create<AuthState>((set) => {
  // The onAuthStateChanged listener handles all state updates.
  // It runs once on initialization and on every auth state change.
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in.
      set({ user, isLoading: false })
      // Ensure an API key exists for the user.
      getOrCreateApiKey(user.uid).catch(console.error)
    } else {
      // User is signed out.
      set({ user: null, isLoading: false })
    }
  })

  // Return the initial state. The listener above will update it shortly.
  return {
    user: null,
    isLoading: true,
  }
})

export default useAuthStore 