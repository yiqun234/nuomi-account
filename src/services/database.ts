import { ref, get, set } from 'firebase/database'
import { realtimeDb } from './firebase'
import type { AppConfig } from '../types'

/**
 * Fetches the user's configuration from the Realtime Database.
 * @param userId The user's unique ID.
 * @returns A promise that resolves to the user's configuration or null.
 */
export const getConfig = async (userId: string): Promise<AppConfig | null> => {
  try {
    const configRef = ref(realtimeDb, `configs/${userId}`)
    const snapshot = await get(configRef)
    if (snapshot.exists()) {
      return snapshot.val() as AppConfig
    }
    return null
  } catch (error) {
    console.error('Error getting config:', error)
    throw new Error('Failed to load configuration.')
  }
}

/**
 * Saves the user's configuration to the Realtime Database.
 * @param userId The user's unique ID.
 * @param config The user's configuration object.
 */
export const saveConfig = async (
  userId: string,
  config: AppConfig,
): Promise<void> => {
  try {
    const configRef = ref(realtimeDb, `configs/${userId}`)
    await set(configRef, config)
  } catch (error) {
    console.error('Error saving config:', error)
    throw new Error('Failed to save configuration.')
  }
} 