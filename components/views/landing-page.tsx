import { Button } from "@/components/ui/button"

interface LandingPageProps {
  onSignInClick: () => void
  onRegisterClick: () => void
}

export function LandingPage({ onSignInClick, onRegisterClick }: LandingPageProps) {
  return (
    <div className="text-center py-16">
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-primary mb-4">Lend-A-Spartan</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Share and borrow items with your BatStateU community
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          size="lg"
          onClick={onSignInClick}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Sign In
        </Button>
        <Button size="lg" variant="outline" onClick={onRegisterClick}>
          Register
        </Button>
      </div>
    </div>
  )
}
