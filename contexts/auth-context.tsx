"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { auth, db } from "@/lib/firebase"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"

interface UserProfile {
  email: string
  role: "clinic" | "elder" | "rider"
  name?: string
  profileData?: any
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, role: "clinic" | "elder" | "rider", additionalData?: any) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.email!)
          const userDocSnap = await getDoc(userDocRef)

          if (userDocSnap.exists()) {
            const data = userDocSnap.data()
            setUserProfile({
              email: currentUser.email!,
              role: data.role,
              name: data.name,
              profileData: data,
            })
          }
        } catch (error) {
          console.error("[v0] Error fetching user profile:", error)
        }
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log("[v0] User signed in:", result.user.email)
    } catch (error: any) {
      console.error("[v0] Sign in error:", error.message)
      throw new Error(error.message || "Failed to sign in")
    }
  }

  const signUp = async (email: string, password: string, role: "clinic" | "elder" | "rider", additionalData?: any) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      console.log("[v0] User created:", result.user.email)

      await setDoc(doc(db, "users", email), {
        email,
        role,
        name: additionalData?.fullName || additionalData?.clinicName || additionalData?.riderName || "",
        ...additionalData,
        createdAt: new Date().toISOString(),
      })

      console.log("[v0] User profile created in Firestore")
    } catch (error: any) {
      console.error("[v0] Sign up error:", error.message)
      throw new Error(error.message || "Failed to create account")
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      setUser(null)
      setUserProfile(null)
      console.log("[v0] User signed out")
    } catch (error: any) {
      console.error("[v0] Sign out error:", error.message)
      throw new Error(error.message || "Failed to sign out")
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
      console.log("[v0] Password reset email sent to:", email)
    } catch (error: any) {
      console.error("[v0] Password reset error:", error.message)
      throw new Error(error.message || "Failed to send password reset email")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
