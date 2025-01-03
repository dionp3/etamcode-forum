// Import the functions you need from the SDKs you need
import { initializeApp, cert } from 'firebase-admin/app'
import { initializeFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { getStorage } from 'firebase-admin/storage'
import env from '#start/env'

if (process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'test') {
  process.env['FIRESTORE_EMULATOR_HOST'] = env.get('FIRESTORE_EMULATOR_HOST')
  process.env['FIREBASE_STORAGE_EMULATOR_HOST'] = env.get('FIREBASE_STORAGE_EMULATOR_HOST')
}
// Initialize Firebase
const app = initializeApp({
  credential: cert({
    projectId: env.get('PROJECT_ID'),
    clientEmail: env.get('CLIENT_EMAIL'),
    privateKey: env.get('PRIVATE_KEY'),
  }),
})
export const auth = getAuth(app)
export const firestore = initializeFirestore(app)
export const storage = getStorage(app).bucket('etamcode-forum-sandbox.appspot.com')
