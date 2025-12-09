"use client"

import { Check, X } from "lucide-react"

interface PasswordStrengthProps {
  password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const checks = [
    { label: "At least 9 characters", test: password.length >= 9 },
    { label: "Contains number", test: /\d/.test(password) },
    { label: "Contains lowercase letter", test: /[a-z]/.test(password) },
    { label: "Contains uppercase letter", test: /[A-Z]/.test(password) },
    { label: "Contains special character", test: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ]

  const passedChecks = checks.filter((check) => check.test).length
  const strength = passedChecks === 5 ? "Strong" : passedChecks >= 3 ? "Medium" : "Weak"
  const strengthColor =
    strength === "Strong" ? "text-green-600" : strength === "Medium" ? "text-yellow-600" : "text-red-600"

  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Password Strength:</span>
        <span className={`text-sm font-bold ${strengthColor}`}>{strength}</span>
      </div>

      <div className="space-y-2">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            {check.test ? (
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <X className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
            <span className={check.test ? "text-foreground" : "text-muted-foreground"}>{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
