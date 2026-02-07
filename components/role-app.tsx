import type { UserRole } from "@/lib/types"
import { AppShell, type NavPage } from "@/components/app-shell"
import { RoleGuard } from "@/components/role-guard"

interface RoleAppProps {
  role: UserRole
  defaultPage?: NavPage
}

export function RoleApp({ role, defaultPage }: RoleAppProps) {
  return (
    <RoleGuard role={role}>
      <AppShell defaultPage={defaultPage} />
    </RoleGuard>
  )
}
