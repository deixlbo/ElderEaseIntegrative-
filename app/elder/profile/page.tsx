"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "firebase/auth"
import { 
  LogOut, 
  Save, 
  Home, 
  User, 
  Calendar, 
  BookOpen, 
  Menu, 
  X,
  Trash2,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react"

interface UserProfile {
  email: string
  name: string
  age: number
  birthdate: string
  role: string
}

// Color theme
const PRIMARY_COLOR = "#10b981" // Emerald green
const SECONDARY_COLOR = "#059669" // Darker emerald
const DARK_GREEN = "#047857"

export default function ElderProfilePage() {
  const { user, loading, signOut, userProfile: authUserProfile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState<UserProfile>({
    email: "",
    name: "",
    age: 0,
    birthdate: "",
    role: "elder",
  })
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [greeting, setGreeting] = useState("Good Morning")
  const [deletePassword, setDeletePassword] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [stats, setStats] = useState({
    totalTutorials: 0,
    completedTutorials: 0,
    inProgressTutorials: 0,
    totalTimeSpent: 0
  })

  useEffect(() => {
    // Get Philippines timezone greeting
    const getGreeting = () => {
      const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
      const hour = new Date(now).getHours()
      
      if (hour < 12) return "Good Morning"
      if (hour < 18) return "Good Afternoon"
      return "Good Evening"
    }
    
    setGreeting(getGreeting())
    
    // Load stats from progress data
    const loadProgressData = () => {
      if (typeof window !== 'undefined') {
        const progressData = localStorage.getItem('elder_tutorial_progress')
        if (progressData) {
          const progress = JSON.parse(progressData)
          const completedTutorials = progress.filter((p: any) => p.status === 'completed').length
          const inProgressTutorials = progress.filter((p: any) => p.status === 'in-progress').length
          const totalTimeSpent = progress.reduce((sum: number, p: any) => sum + (p.timeSpent || 0), 0)
          
          setStats({
            totalTutorials: progress.length,
            completedTutorials,
            inProgressTutorials,
            totalTimeSpent
          })
        }
      }
    }
    
    loadProgressData()
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/elder/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) fetchUserProfile()
  }, [user])

  const fetchUserProfile = async () => {
    try {
      setLoadingProfile(true)
      if (!user?.email) throw new Error("No user email available")

      let userData = null

      // Try: email as document ID
      try {
        const userDoc = await getDoc(doc(db, "users", user.email))
        if (userDoc.exists()) userData = userDoc.data()
      } catch (_) {}

      // Try: query by email
      if (!userData) {
        const usersQuery = query(collection(db, "users"), where("email", "==", user.email))
        const querySnapshot = await getDocs(usersQuery)
        if (!querySnapshot.empty) userData = querySnapshot.docs[0].data()
      }

      // Try: UID as document ID
      if (!userData && user.uid) {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) userData = userDoc.data()
      }

      if (userData) {
        const profileData: UserProfile = {
          email: userData.email || user.email || "",
          name: userData.name || authUserProfile?.name || "",
          age: userData.age || 0,
          birthdate: userData.birthdate || "",
          role: userData.role || "elder",
        }

        setUserProfile(profileData)
        setFormData(profileData)
      } else {
        // Use auth context data if available
        if (authUserProfile) {
          const profileData: UserProfile = {
            email: user.email || "",
            name: authUserProfile.name || "",
            age: 0,
            birthdate: "",
            role: "elder",
          }
          setUserProfile(profileData)
          setFormData(profileData)
        } else {
          toast({
            title: "Error",
            description: "User profile not found. Please contact support.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast({
        title: "Error",
        description: "Could not load profile",
        variant: "destructive",
      })
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleSave = async () => {
    try {
      if (!user?.email) throw new Error("No user email available")

      const updateData = {
        name: formData.name,
        updatedAt: new Date().toISOString(),
      }

      let updateSuccessful = false

      // Try: email as doc ID
      try {
        await updateDoc(doc(db, "users", user.email), updateData)
        updateSuccessful = true
      } catch (_) {}

      // Try: query by email
      if (!updateSuccessful) {
        const usersQuery = query(collection(db, "users"), where("email", "==", user.email))
        const querySnapshot = await getDocs(usersQuery)
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0]
          await updateDoc(doc(db, "users", userDoc.id), updateData)
          updateSuccessful = true
        }
      }

      // Try: UID as doc ID
      if (!updateSuccessful && user.uid) {
        await updateDoc(doc(db, "users", user.uid), updateData)
        updateSuccessful = true
      }

      if (updateSuccessful) {
        toast({ 
          title: "Success", 
          description: "Profile updated successfully",
          className: "bg-emerald-50 border-emerald-200 text-emerald-800"
        })
        setIsEditing(false)
        fetchUserProfile()
      } else {
        throw new Error("Could not find user document to update")
      }
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter your password to confirm account deletion",
        variant: "destructive",
      })
      return
    }

    if (!user || !user.email) {
      toast({
        title: "Error",
        description: "No user found",
        variant: "destructive",
      })
      return
    }

    try {
      setIsDeleting(true)

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, deletePassword)
      await reauthenticateWithCredential(user, credential)

      // Delete Firestore user document
      let deleteSuccessful = false
      
      // Try: email as doc ID
      try {
        await deleteDoc(doc(db, "users", user.email))
        deleteSuccessful = true
      } catch (_) {}

      // Try: query by email
      if (!deleteSuccessful) {
        const usersQuery = query(collection(db, "users"), where("email", "==", user.email))
        const querySnapshot = await getDocs(usersQuery)
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0]
          await deleteDoc(doc(db, "users", userDoc.id))
          deleteSuccessful = true
        }
      }

      // Try: UID as doc ID
      if (!deleteSuccessful && user.uid) {
        await deleteDoc(doc(db, "users", user.uid))
        deleteSuccessful = true
      }

      // Delete Firebase Auth user
      await deleteUser(user)

      // Clear localStorage data
      localStorage.removeItem('elder_tutorial_progress')
      localStorage.removeItem('elder_tutorial_favorites')

      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been permanently deleted",
        className: "bg-emerald-50 border-emerald-200 text-emerald-800"
      })

      // Redirect to login page
      setTimeout(() => {
        router.push("/elder/login")
      }, 2000)

    } catch (error: any) {
      console.error("Error deleting account:", error)
      
      if (error.code === 'auth/wrong-password') {
        toast({
          title: "Incorrect Password",
          description: "The password you entered is incorrect. Please try again.",
          variant: "destructive",
        })
      } else if (error.code === 'auth/requires-recent-login') {
        toast({
          title: "Re-authentication Required",
          description: "Please sign out and sign in again, then try deleting your account.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to delete account",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(false)
      setDeletePassword("")
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/elder/login")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  const navItems = [
    { icon: Home, label: "Home", href: "/elder/home", active: false },
    { icon: BookOpen, label: "Tutorial", href: "/elder/tutorial", active: false },
    { icon: Calendar, label: "Event", href: "/elder/event", active: false },
    { icon: User, label: "Profile", href: "/elder/profile", active: true },
  ]

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50">
      {/* Mobile Header */}
      <div className="md:hidden text-white p-4 sticky top-0 z-20"
        style={{ 
          backgroundColor: PRIMARY_COLOR,
          background: `linear-gradient(135deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <img src="/ease.jpg" alt="ElderEase Logo" className="w-8 h-8 rounded-lg object-cover" />
            </div>
            <div>
              <h2 className="text-lg font-bold">ElderEase</h2>
              <p className="text-xs text-emerald-100">
                {greeting}, {userProfile?.name?.split(" ")[0] || "User"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white hover:bg-white/20 rounded-full"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Sidebar - Hidden on mobile unless menu is open */}
      <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 fixed md:sticky md:top-0 inset-y-0 left-0 z-30
        w-64 md:w-72 text-white flex flex-col transition-transform duration-300 ease-in-out
        md:flex shadow-2xl h-screen
      `}
      style={{ 
        backgroundColor: DARK_GREEN,
        background: `linear-gradient(180deg, ${DARK_GREEN}, ${SECONDARY_COLOR})`
      }}
      >
        {/* Close button for mobile */}
        <div className="flex items-center justify-between p-4 border-b border-emerald-700 md:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <img src="/ease.jpg" alt="ElderEase Logo" className="w-8 h-8 rounded-lg object-cover" />
            </div>
            <h2 className="text-lg font-bold">ElderEase</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Desktop Logo Section */}
        <div className="hidden md:flex flex-col p-6 border-b border-emerald-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm ring-2 ring-white/20">
              <img src="/ease.jpg" alt="ElderEase Logo" className="w-10 h-10 rounded-lg object-cover" />
            </div>
            <div>
              <h2 className="text-xl font-bold">ElderEase</h2>
              <p className="text-sm text-emerald-200 mt-1">
                {greeting}, {userProfile?.name?.split(" ")[0] || "User"}
              </p>
            </div>
          </div>
        </div>
        
        {/* Navigation - Only the 5 requested items */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    item.active
                      ? "bg-white text-emerald-800 shadow-lg"
                      : "text-emerald-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.active && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">👤 My Profile</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                Manage your personal information and learning progress
              </p>
            </div>

            {/* Learning Stats Card removed */}

            <Card className="border-emerald-200">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="text-xl sm:text-2xl text-gray-800">Personal Information</CardTitle>
                  {!isEditing && userProfile && (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      className="text-sm sm:text-base h-11 w-full sm:w-auto border-emerald-300 hover:border-emerald-400 text-emerald-700 hover:bg-emerald-50"
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-emerald-100 shadow-lg">
                    <AvatarFallback className="text-3xl sm:text-4xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
                      {formData.name?.charAt(0)?.toUpperCase() || "E"}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {userProfile ? (
                  <div className="space-y-4 sm:space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-base sm:text-lg text-gray-700">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!isEditing}
                        className="text-sm sm:text-base h-11 sm:h-12 border-emerald-300 focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-base sm:text-lg text-gray-700">Email Address</Label>
                      <Input 
                        id="email" 
                        value={formData.email} 
                        disabled 
                        className="text-sm sm:text-base h-11 sm:h-12 border-emerald-300 bg-emerald-50 text-gray-700" 
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="age" className="text-base sm:text-lg text-gray-700">Age</Label>
                        <Input
                          id="age"
                          type="number"
                          value={formData.age}
                          disabled={true}
                          className="text-sm sm:text-base h-11 sm:h-12 border-emerald-300 bg-emerald-50 text-gray-700"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="birthdate" className="text-base sm:text-lg text-gray-700">Birthdate</Label>
                        <Input
                          id="birthdate"
                          type="date"
                          value={formData.birthdate}
                          disabled={!isEditing}                             // allow editing only when editing profile
                          onChange={(e) => {
                            const bd = e.target.value
                            const age = calculateAge(bd)
                            setFormData({ ...formData, birthdate: bd, age })
                          }}
                          className="text-sm sm:text-base h-11 sm:h-12 border-emerald-300 bg-emerald-50 text-gray-700"
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button 
                          onClick={handleSave} 
                          className="flex-1 gap-2 text-sm sm:text-base h-11 sm:h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-sm"
                        >
                          <Save className="w-4 h-4 sm:w-5 sm:h-5" /> Save Changes
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditing(false)
                            setFormData(userProfile)
                          }}
                          variant="outline"
                          className="flex-1 text-sm sm:text-base h-11 sm:h-12 border-emerald-300 hover:border-emerald-400 text-emerald-700 hover:bg-emerald-50"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 text-base sm:text-lg">No profile data found.</p>
                    <Button 
                      onClick={fetchUserProfile} 
                      variant="outline" 
                      className="mt-4 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      Retry Loading Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Danger Zone - Delete Account */}
            <Card className="border-red-200 bg-gradient-to-r from-red-50 to-white">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-xl sm:text-2xl text-red-800">Danger Zone</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <h4 className="font-semibold text-red-800">Delete Account</h4>
                      <p className="text-sm text-red-600">
                        <span className="font-semibold">Warning:</span> This action cannot be undone. All your data including:
                      </p>
                      <ul className="text-sm text-red-600 list-disc list-inside space-y-1 ml-2">
                        <li>Profile information</li>
                        <li>Tutorial progress and history</li>
                        <li>Learning statistics</li>
                        <li>All other account data</li>
                      </ul>
                      <p className="text-sm text-red-600 font-semibold mt-2">
                        Will be permanently deleted. You will need to create a new account to use ElderEase again.
                      </p>
                    </div>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="w-full gap-2 text-sm sm:text-base h-11 sm:h-12"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /> Delete My Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-red-200">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-800 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Confirm Account Deletion
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <div className="bg-red-50 border border-red-100 rounded p-3">
                          <p className="text-red-700 font-semibold">⚠️ This action is irreversible!</p>
                          <p className="text-red-600 text-sm mt-1">
                            All your data will be permanently deleted from our servers.
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-700 mb-2">
                            To confirm, please enter your password:
                          </p>
                          <Input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Enter your password"
                            className="border-red-300 focus:border-red-500"
                          />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel 
                        onClick={() => setDeletePassword("")}
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || !deletePassword.trim()}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isDeleting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Deleting...
                          </>
                        ) : (
                          "Delete Account Permanently"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            {/* Logout Button */}
            <Card className="border-emerald-200">
              <CardContent className="pt-6">
                <Button 
                  onClick={handleLogout} 
                  variant="outline" 
                  className="w-full gap-2 text-sm sm:text-base h-11 sm:h-12 border-emerald-300 hover:border-emerald-400 text-emerald-700 hover:bg-emerald-50"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" /> Logout
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}