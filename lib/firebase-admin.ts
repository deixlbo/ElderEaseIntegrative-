// Server-side Firebase Admin SDK for secure operations
import { initializeApp, getApps, cert, type App } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

let adminApp: App

if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
} else {
  adminApp = getApps()[0]
}

const adminAuth = getAuth(adminApp)
const adminDb = getFirestore(adminApp)

export { adminApp, adminAuth, adminDb }
