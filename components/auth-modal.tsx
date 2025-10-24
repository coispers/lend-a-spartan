"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (email: string) => void
}

export default function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
  const [email, setEmail] = useState("")
  const [step, setStep] = useState<"email" | "verify">("email")
  const [verificationCode, setVerificationCode] = useState("")

  if (!isOpen) return null

  const handleEmailSubmit = () => {
    if (email.endsWith("@g.batstate-u.edu.ph")) {
      if (email === "admin@g.batstate-u.edu.ph") {
        onLogin(email)
      } else {
        setStep("verify")
      }
    } else {
      alert("Please use your BatStateU email (@g.batstate-u.edu.ph)")
    }
  }

  const handleVerify = () => {
    if (verificationCode.length === 6) {
      onLogin(email)
    } else {
      alert("Please enter a valid 6-digit code")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 relative border border-border">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-foreground">Sign In to Lend-A-Spartan</h2>

        {step === "email" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">BatStateU Email</label>
              <Input
                type="email"
                placeholder="your.name@g.batstate-u.edu.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-border"
              />
              <p className="text-xs text-muted-foreground mt-2">Must be a valid BatStateU email address</p>
              <p className="text-xs text-accent mt-1">Tip: Use admin@g.batstate-u.edu.ph for demo access</p>
            </div>
            <Button
              onClick={handleEmailSubmit}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Continue
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">We've sent a verification code to {email}</p>
            <div>
              <label className="block text-sm font-medium mb-2">Verification Code</label>
              <Input
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.slice(0, 6))}
                maxLength={6}
                className="border border-border text-center text-2xl tracking-widest"
              />
            </div>
            <Button onClick={handleVerify} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Verify & Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStep("email")
                setVerificationCode("")
              }}
              className="w-full"
            >
              Back
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
