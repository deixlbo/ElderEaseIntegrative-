"use client"

import type React from "react"
import styles from "./page.module.css"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ElderEaseLogo } from "@/components/elderease-logo"
import { QRScanner } from "@/components/qr-scanner"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { Users, QrCode } from "lucide-react"

export default function ElderLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { signIn, user, loading: authLoading } = useAuth()


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn(email, password)

      // Prevent login if email not verified
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        await signOut(auth)
        toast({
          title: "Email not verified",
          description: "Please verify your email before logging in.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      toast({
        title: "Success",
        description: "Logged in successfully",
      })
      router.push("/elder/home")
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handleQRScan = async (data: { email: string; password: string }) => {
    setLoading(true)
    try {
      await signIn(data.email, data.password)

      // Prevent login if email not verified (QR login)
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        await signOut(auth)
        toast({
          title: "Email not verified",
          description: "Please verify your email before logging in.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      toast({
        title: "Success",
        description: "Logged in with QR code",
      })
      router.push("/elder/home")
      setShowQRScanner(false)
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid QR code",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <div className={styles.loginPage}>
      <Card className={styles.card}>
        <CardHeader className={`space-y-4 ${styles.header}`}>
          <div className="flex justify-center">
            <ElderEaseLogo size="lg" />
          </div>
          <CardTitle className="text-3xl sm:text-4xl font-bold text-foreground">Sign in</CardTitle>
          <CardDescription className="text-base sm:text-lg">Sign in to your ElderEase account</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 sm:h-14 mb-6">
              <TabsTrigger value="email" className="text-sm sm:text-base gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Email & Password</span>
                <span className="sm:hidden">Email</span>
              </TabsTrigger>
              <TabsTrigger value="qr" className="text-sm sm:text-base gap-2">
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">QR Code</span>
                <span className="sm:hidden">QR</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="mt-0">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base sm:text-lg font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 sm:h-14 text-base sm:text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base sm:text-lg font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 sm:h-14 text-base sm:text-lg"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Login"}
                </Button>

                <div className="space-y-3 text-center pt-2">
                  <Link
                    href="/elder/forgot-password"
                    className="text-primary hover:underline block text-sm sm:text-base font-medium"
                  >
                    Forgot Password?
                  </Link>
                  <div className="text-sm sm:text-base">
                    Don't have an account?{" "}
                    <Link href="/elder/register" className="text-primary hover:underline font-semibold">
                      Create Account
                    </Link>
                  </div>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="qr" className="mt-0">
              {!showQRScanner ? (
                <div className="space-y-6 py-8">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 bg-secondary rounded-2xl flex items-center justify-center">
                      <QrCode className="w-16 h-16 sm:w-20 sm:h-20 text-primary" />
                    </div>
                    <p className="text-center text-base sm:text-lg font-medium">Login with your QR code</p>
                    <p className="text-center text-sm text-muted-foreground max-w-sm">
                      Scan the QR code you received during registration
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowQRScanner(true)}
                    className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold"
                  >
                    <QrCode className="w-5 h-5 mr-2" />
                    Scan QR Code
                  </Button>
                </div>
              ) : (
                <QRScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
