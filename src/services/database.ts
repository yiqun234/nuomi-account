import { get, ref, set } from 'firebase/database'
import { realtimeDb } from './firebase'
import type { UserConfig } from '../types/config'

/**
 * Fetches the user's configuration from the Realtime Database.
 * @param uid The user's unique ID.
 * @returns A promise that resolves to the user's configuration.
 */
export const getUserConfig = async (uid: string): Promise<UserConfig> => {
  const configRef = ref(realtimeDb, `configs/${uid}`)
  const snapshot = await get(configRef)
  if (snapshot.exists()) {
    return snapshot.val()
  }
  // Return a default or empty config if nothing is found
  return {} as UserConfig
}

/**
 * Saves the user's configuration to the Realtime Database.
 * @param uid The user's unique ID.
 * @param config The user's configuration object.
 */
export const saveUserConfig = async (
  uid: string,
  config: UserConfig,
): Promise<void> => {
  const configRef = ref(realtimeDb, `configs/${uid}`)
  await set(configRef, config)
} 