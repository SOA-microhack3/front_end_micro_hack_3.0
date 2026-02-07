"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import type { UserRole } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { roleToPath } from "@/lib/role-routing"

export function RoleGuard({
  role,
  children,
}: {
  role: UserRole
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace("/signin")
      return
    }
    if (user && user.role !== role) {
      router.replace(roleToPath(user.role))
    }
  }, [isAuthenticated, user, role, router, isLoading])

  if (isLoading) {
    return null
  }

  if (!isAuthenticated || !user || user.role !== role) {
    return null
  }

  return <>{children}</>
}

