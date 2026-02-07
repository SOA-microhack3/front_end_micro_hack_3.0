"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { roleToPath } from "@/lib/role-routing"

export default function Page() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace("/signin")
      return
    }
    if (user) {
      router.replace(roleToPath(user.role))
    }
  }, [isAuthenticated, user, router, isLoading])

  return null
}
