"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ElderEaseLogo } from "@/components/elderease-logo"
import { PasswordStrength } from "@/components/password-strength"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Download, QrCode, Mail, CheckCircle, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react"
import QRCode from "qrcode"
import { sendEmailVerification } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

export default function ElderRegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    age: "",
    birthdate: "",
    gender: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [showVerificationDialog, setShowVerificationDialog] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState("")
  const [ageError, setAgeError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (formData.birthdate) {
      const birthDate = new Date(formData.birthdate)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      
      setFormData((prev) => ({ ...prev, age: age.toString() }))
      
      // Validate age
      if (age < 60) {
        setAgeError("You must be 60 years or older to register")
      } else {
        setAgeError("")
      }
    } else {
      setAgeError("")
    }
  }, [formData.birthdate])

  const isPasswordValid = () => {
    const { password } = formData
    return (
      password.length >= 9 &&
      /\d/.test(password) &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    )
  }

  const generateQRCode = async (email: string, password: string) => {
    try {
      const qrData = `email:${email},password:${password}`
      const url = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: "#EC5D10",
          light: "#FFFFFF",
        },
      })
      setQrCodeUrl(url)
      return url
    } catch (error) {
      console.error("Error generating QR code:", error)
      return null
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate age first
    const age = parseInt(formData.age)
    if (isNaN(age) || age < 60) {
      toast({
        title: "Age requirement not met",
        description: "You must be 60 years or older to register",
        variant: "destructive",
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (!isPasswordValid()) {
      toast({
        title: "Weak password",
        description: "Please meet all password requirements",
        variant: "destructive",
      })
      return
    }

    if (!agreeTerms) {
      toast({
        title: "Terms not accepted",
        description: "You must agree to the Terms & Conditions and Data Privacy Policy",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Sign up the user
      await signUp(formData.email, formData.password, "elder", {
        fullName: formData.fullName,
        age: Number.parseInt(formData.age),
        birthdate: formData.birthdate,
        gender: formData.gender,
      })

      // Ensure the created user is available from the auth state before sending verification
      // signUp may not immediately populate auth.currentUser, so wait for the auth state change.
      const user = auth.currentUser ?? await new Promise<any>((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
          unsubscribe()
          if (u) resolve(u)
          else reject(new Error("No authenticated user found"))
        })
        // timeout to avoid waiting forever
        setTimeout(() => {
          unsubscribe()
          reject(new Error("Timed out waiting for authenticated user"))
        }, 10000)
      })

      // Send verification email to the authenticated user
      await sendEmailVerification(user)

      setLoading(false)

      // Generate QR code
      await generateQRCode(formData.email, formData.password)

      // Store email for verification dialog
      setRegisteredEmail(formData.email)
      
      // Show verification dialog
      setShowVerificationDialog(true)

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account",
      })
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handleDownloadQR = () => {
    const link = document.createElement("a")
    link.download = "elderease-qr-code.png"
    link.href = qrCodeUrl
    link.click()
  }

  const handleContinueToLogin = () => {
    setShowVerificationDialog(false)
    setShowQRDialog(false)
    router.push("/elder/login")
  }

  const handleShowQRCode = () => {
    setShowVerificationDialog(false)
    setShowQRDialog(true)
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-white p-4 sm:p-6 md:p-8">
        <Card className="w-full max-w-2xl shadow-2xl border-2 my-8">
          <CardHeader className="space-y-4 text-center pb-6">
            <div className="flex justify-center">
              <ElderEaseLogo size="lg" />
            </div>
            <CardTitle className="text-3xl sm:text-4xl font-bold text-foreground">Create Account</CardTitle>
            <CardDescription className="text-base sm:text-lg">Join the ElderEase community today</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-base sm:text-lg font-medium">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="h-12 sm:h-14 text-base sm:text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base sm:text-lg font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-12 sm:h-14 text-base sm:text-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthdate" className="text-base sm:text-lg font-medium">
                    Birthdate
                  </Label>
                  <Input
                    id="birthdate"
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                    required
                    className="h-12 sm:h-14 text-base sm:text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age" className="text-base sm:text-lg font-medium">
                    Age 
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Auto-filled"
                    value={formData.age}
                    readOnly
                    className={`h-12 sm:h-14 text-base sm:text-lg ${
                      formData.age && parseInt(formData.age) >= 60 ? "bg-green-50 border-green-500 text-green-700" : 
                      formData.age && parseInt(formData.age) < 60 ? "bg-red-50 border-red-500 text-red-700" : 
                      "bg-muted"
                    }`}
                  />
                  {ageError && (
                    <p className="text-sm text-red-600 font-medium">{ageError}</p>
                  )}
                  {formData.age && !ageError && parseInt(formData.age) >= 60 && (
                    <p className="text-sm text-green-600 font-medium">✓ Eligible for registration (60+)</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base sm:text-lg font-medium">Gender</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="male"
                      name="gender"
                      value="male"
                      checked={formData.gender === "male"}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <Label htmlFor="male" className="text-base cursor-pointer">
                      Male
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="female"
                      name="gender"
                      value="female"
                      checked={formData.gender === "female"}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <Label htmlFor="female" className="text-base cursor-pointer">
                      Female
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-base sm:text-lg font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password (min. 9 characters)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="h-12 sm:h-14 text-base sm:text-lg pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {formData.password && <PasswordStrength password={formData.password} />}

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-base sm:text-lg font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    className="h-12 sm:h-14 text-base sm:text-lg pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="terms" 
                    checked={agreeTerms}
                    onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                    className="mt-1"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={() => setShowTerms(!showTerms)}
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Terms & Conditions and Data Privacy Policy
                        {showTerms ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </Label>
                  </div>
                </div>

                {showTerms && (
                  <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                    <h3 className="font-semibold text-lg">Terms & Conditions and Data Privacy Policy</h3>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-primary">Data Privacy Commitment</h4>
                      <p className="text-sm">
                        ElderEase strictly complies with <strong>The Data Privacy Act of 2012 (Republic Act No. 10173)</strong> 
                        of the Philippines. We are committed to protecting your personal information and ensuring 
                        your privacy rights are respected.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Your Rights Under Data Privacy Act:</h4>
                      <ul className="text-sm list-disc pl-5 space-y-1">
                        <li><strong>Right to be Informed:</strong> You have the right to know how your personal data is being collected, processed, and stored.</li>
                        <li><strong>Right to Access:</strong> You can request access to your personal data that we hold.</li>
                        <li><strong>Right to Correction:</strong> You can request correction of any inaccurate or incomplete data.</li>
                        <li><strong>Right to Erasure:</strong> You can request deletion of your personal data when it is no longer necessary or when you withdraw consent.</li>
                        <li><strong>Right to Data Portability:</strong> You can obtain a copy of your data in a structured format.</li>
                        <li><strong>Right to Object:</strong> You can object to the processing of your personal data.</li>
                        <li><strong>Right to Lodge Complaints:</strong> You can file complaints with the National Privacy Commission.</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Data Security Measures:</h4>
                      <p className="text-sm">
                        We implement appropriate security measures including encryption, access controls, and regular 
                        security audits to protect your personal information from unauthorized access, alteration, 
                        or disclosure.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Data Deletion Requests:</h4>
                      <p className="text-sm">
                        You may request deletion of your data at any time by contacting our Data Protection Officer at 
                        <strong> easeelder86@gmail.com</strong>. 
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Consent to Terms:</h4>
                      <p className="text-sm">
                        By creating an account, you acknowledge that you have read, understood, and agreed to these 
                        Terms & Conditions and our Data Privacy Policy. You consent to the collection, processing, 
                        and storage of your personal data for the purpose of providing ElderEase services.
                      </p>
                    </div>

                    <div className="pt-2">
                      <p className="text-xs text-gray-600">
                        For more information about your rights under the Data Privacy Act, visit the 
                        <a 
                          href="https://www.privacy.gov.ph" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline ml-1"
                        >
                          National Privacy Commission website
                        </a>.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold"
                disabled={loading || !!ageError || !agreeTerms}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>

              <div className="text-center text-sm sm:text-base pt-2">
                Already have an account?{" "}
                <Link href="/elder/login" className="text-primary hover:underline font-semibold">
                  Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Email Verification Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Mail className="w-6 h-6 text-primary" />
              Verify Your Email
            </DialogTitle>
            <DialogDescription className="text-base">
              We've sent a verification link to your email
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-primary" />
            </div>
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800">
                A verification email has been sent to <strong>{registeredEmail}</strong>
              </AlertDescription>
            </Alert>
            <div className="text-sm text-muted-foreground text-center space-y-2">
              <p>Please check your email and click the verification link to activate your account.</p>
              <p className="text-xs">You won't be able to log in until your email is verified.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={handleShowQRCode} variant="outline" className="w-full h-12 text-base gap-2">
              <QrCode className="w-5 h-5" />
              View QR Code
            </Button>
            <Button onClick={handleContinueToLogin} className="w-full h-12 text-base font-semibold">
              Continue to Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <QrCode className="w-6 h-6 text-primary" />
              Your Login QR Code
            </DialogTitle>
            <DialogDescription className="text-base">Save this QR code for quick and easy login</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {qrCodeUrl && (
              <div className="p-4 bg-white rounded-lg border-2 border-primary">
                <img src={qrCodeUrl} alt="Login QR Code" className="w-64 h-64" />
              </div>
            )}
            <Alert className="bg-amber-50 border-amber-200">
              <Mail className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800">
                Remember to verify your email before logging in!
              </AlertDescription>
            </Alert>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleDownloadQR} variant="outline" className="flex-1 h-12 text-base gap-2">
              <Download className="w-5 h-5" />
              Download QR Code
            </Button>
            <Button onClick={handleContinueToLogin} className="flex-1 h-12 text-base font-semibold">
              Continue to Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}