"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Moon, Sun } from "lucide-react"
import { useTheme as useNextTheme } from "next-themes"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, error, isLoading } = useAuth()
  const { theme, setTheme } = useNextTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      return
    }
    setIsSubmitting(true)
    const result = await login(email, password)
    setIsSubmitting(false)
    if (result.success) {
      // Redirect is handled in the auth provider
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <span className="text-lg font-medium text-primary">C</span>
        </div>
        <span className="text-2xl font-medium text-primary">MngClean</span>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="text-sm">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button variant="link" className="h-auto p-0 text-xs" type="button">
                  Forgot password?
                </Button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !email || !password}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log in"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {/* <div className="text-center text-sm text-muted-foreground">
            <span>Don&apos;t have an account? </span>
            <Button variant="link" className="h-auto p-0">
              Sign up
            </Button>
          </div> */}

          {/* <div className="text-center text-xs text-muted-foreground">
            <p>For demo purposes, use:</p>
            <p>Admin: admin@example.com / admin123</p>
            <p>Staff: staff@example.com / staff123</p>
          </div> */}
        </CardFooter>
      </Card>
    </div>
  )
}

