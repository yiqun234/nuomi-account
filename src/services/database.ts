import { ref, get, set } from 'firebase/database'
import { realtimeDb } from './firebase'
import type { AppConfig } from '../types'

// Firebase keys cannot contain '.', '#', '$', '[', or ']'
// We will encode them using a scheme that is unlikely to be in the original key.
const replacements: { [key: string]: string } = {
  '.': '__dot__',
  '#': '__hash__',
  '$': '__dollar__',
  '[': '__obracket__',
  ']': '__cbracket__',
  '/': '__slash__' // Although / is not in the list, it's often problematic.
};

// Create reverse replacements for decoding
const reverseReplacements: { [key: string]: string } = Object.entries(replacements).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, {} as { [key: string]: string });

const sanitizeKey = (key: string): string => {
    return key.replace(/[.#$[\]/]/g, match => replacements[match]);
};

const restoreKey = (key: string): string => {
    const regex = new RegExp(Object.values(replacements).join('|'), 'g');
    return key.replace(regex, match => reverseReplacements[match]);
};

// Recursive function to sanitize object keys
const transformKeys = <T>(obj: T, transformFunc: (key: string) => string): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformKeys(item, transformFunc)) as unknown as T;
  }
  
  const newObj: { [key: string]: unknown } = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = transformFunc(key);
      newObj[newKey] = transformKeys((obj as Record<string, unknown>)[key], transformFunc);
    }
  }
  return newObj as T;
}

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
        const data = snapshot.val();
      return transformKeys(data, restoreKey) as AppConfig
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
    const sanitizedConfig = transformKeys(config, sanitizeKey);
    const configRef = ref(realtimeDb, `configs/${userId}`)
    await set(configRef, sanitizedConfig)
  } catch (error) {
    console.error('Error saving config:', error)
    throw new Error('Failed to save configuration.')
  }
} 