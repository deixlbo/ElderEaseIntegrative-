"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ElderEaseLogo } from "@/components/elderease-logo"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function ElderForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()
  const { toast } = useToast()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await resetPassword(email)
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-primary/10 p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <ElderEaseLogo size="lg" />
          </div>
          <CardTitle className="text-4xl font-bold">Forgot Password</CardTitle>
          <CardDescription className="text-lg">Enter your email to reset your password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-lg">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 text-lg"
              />
            </div>

            <Button type="submit" className="w-full h-14 text-lg" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>

            <div className="text-center text-base">
              <Link href="/elder/login" className="text-primary hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
