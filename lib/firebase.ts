import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyAFcqA7UbvnInOI_C8tSM7-nrDlwD5hnVQ",
  authDomain: "integrative-f7fbe.firebaseapp.com",
  projectId: "integrative-f7fbe",
  storageBucket: "integrative-f7fbe.firebasestorage.app",
  messagingSenderId: "323650706864",
  appId: "1:323650706864:web:42d5129594d63e11cf8a75",
  measurementId: "G-D5ZCX527D4",
}

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

export { app, auth, db, storage }
