import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  limit,
} from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { firestoreDb } from './firebase'

/**
 * Retrieves the API key for a user from Firestore.
 * If it doesn't exist, creates a new one.
 * The API key itself is the document ID.
 * @param uid The user's unique ID.
 * @returns A promise that resolves to the user's API key.
 */
export const getOrCreateApiKey = async (uid: string): Promise<string> => {
  // Query for an existing key where the userId field matches the user's uid.
  const apiKeysRef = collection(firestoreDb, 'api_keys')
  const q = query(apiKeysRef, where('userId', '==', uid), limit(1))
  const querySnapshot = await getDocs(q)

  if (!querySnapshot.empty) {
    // If a key exists, its ID is the API key.
    const existingDoc = querySnapshot.docs[0]
    return existingDoc.id
  } else {
    // If no key exists, create a new one.
    // The new API key becomes the document ID.
    const newApiKey = `ea_${uuidv4().replace(/-/g, '')}`
    const newApiKeyRef = doc(firestoreDb, 'api_keys', newApiKey)

    await setDoc(newApiKeyRef, {
      userId: uid,
      status: 'active',
      createdAt: new Date(),
    })
    return newApiKey
  }
} 