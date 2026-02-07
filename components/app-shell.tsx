"use client"

import { useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n"
import { AppSidebar } from "@/components/app-sidebar"
import { TopBar } from "@/components/top-bar"
import { DashboardPage } from "@/components/dashboard-page"
import { BookingsPage } from "@/components/bookings-page"
import { SlotsPage } from "@/components/slots-page"
import { AIAssistantPage } from "@/components/ai-assistant-page"
import { GatePage } from "@/components/gate-page"
import { FleetPage } from "@/components/fleet-page"
import { DriversPage } from "@/components/drivers-page"
import { CarriersPage } from "@/components/carriers-page"
import { OperatorsPage } from "@/components/operators-page"
import { TerminalsPage } from "@/components/terminals-page"
import { AuditLogsPage } from "@/components/audit-logs-page"
import { SettingsPage } from "@/components/settings-page"
import { cn } from "@/lib/utils"

export type NavPage =
  | "dashboard"
  | "bookings"
  | "slots"
  | "ai_assistant"
  | "gate"
  | "fleet"
  | "drivers"
  | "carriers"
  | "operators"
  | "terminals"
  | "audit_logs"
  | "settings"

interface AppShellProps {
  defaultPage?: NavPage
}

export function AppShell({ defaultPage = "dashboard" }: AppShellProps) {
  const { t, lang } = useI18n()
  const [currentPage, setCurrentPage] = useState<NavPage>(defaultPage)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setSidebarOpen(false)
  }, [currentPage])

  const pageTitle = t(currentPage)

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />
      case "bookings":
        return <BookingsPage />
      case "slots":
        return <SlotsPage />
      case "ai_assistant":
        return <AIAssistantPage />
      case "gate":
        return <GatePage />
      case "fleet":
        return <FleetPage />
      case "drivers":
        return <DriversPage />
      case "carriers":
        return <CarriersPage />
      case "operators":
        return <OperatorsPage />
      case "terminals":
        return <TerminalsPage />
      case "audit_logs":
        return <AuditLogsPage />
      case "settings":
        return <SettingsPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <div className={cn("flex h-screen overflow-hidden bg-background", lang === "ar" && "font-arabic")}>
      <AppSidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden rounded-tl-3xl border-l border-border">
        <TopBar
          title={pageTitle}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto">{renderPage()}</main>
      </div>
    </div>
  )
}
