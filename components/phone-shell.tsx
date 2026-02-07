"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

export interface PhoneNavItem {
  key: string
  label: string
  icon: LucideIcon
}

interface PhoneShellProps {
  defaultPage: string
  navItems: PhoneNavItem[]
  titleMap: Record<string, string>
  renderPage: (key: string) => React.ReactNode
}

export function PhoneShell({
  defaultPage,
  navItems,
  titleMap,
  renderPage,
}: PhoneShellProps) {
  const { t, lang } = useI18n()
  const { logout } = useAuth()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(defaultPage)

  return (
    <div className={cn("min-h-screen bg-background flex flex-col", lang === "ar" && "font-arabic")}>
      <header className="h-14 px-4 border-b border-border bg-card/90 backdrop-blur-sm flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight">
            {t(titleMap[currentPage] || currentPage)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            logout()
            router.replace("/signin")
          }}
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>{t("sign_out")}</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {renderPage(currentPage)}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-card/95 backdrop-blur-sm flex items-center justify-around z-50">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = item.key === currentPage
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setCurrentPage(item.key)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-foreground")} />
              <span>{t(item.label)}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
