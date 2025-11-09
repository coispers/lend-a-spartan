"use client"

import SignInModal from "@/components/signin-modal"
import RegisterModal from "@/components/register-modal"
import type { AuthUser } from "@/types/auth"

interface AuthModalsProps {
  signIn: {
    isOpen: boolean
    onClose: () => void
    onLogin: (user: AuthUser) => Promise<void> | void
    onSwitchToRegister: () => void
  }
  register: {
    isOpen: boolean
    onClose: () => void
    onRegister: (user: AuthUser) => Promise<void> | void
    onSwitchToSignIn: () => void
  }
}

export function AuthModals({ signIn, register }: AuthModalsProps) {
  return (
    <>
      <SignInModal
        isOpen={signIn.isOpen}
        onClose={signIn.onClose}
        onLogin={signIn.onLogin}
        onSwitchToRegister={signIn.onSwitchToRegister}
      />
      <RegisterModal
        isOpen={register.isOpen}
        onClose={register.onClose}
        onRegister={register.onRegister}
        onSwitchToSignIn={register.onSwitchToSignIn}
      />
    </>
  )
}
