// components/protected-route.tsx
"use client"

import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) return <p>Loading...</p>

  if (!user) {
    router.push("/login")
    return null
  }

  return <>{children}</>
}
