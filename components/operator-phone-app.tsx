"use client"

import { LayoutDashboard, DoorOpen, Clock, Settings, CalendarCheck } from "lucide-react"
import { PhoneShell } from "@/components/phone-shell"
import { DashboardPage } from "@/components/dashboard-page"
import { GatePage } from "@/components/gate-page"
import { SlotsPage } from "@/components/slots-page"
import { SettingsPage } from "@/components/settings-page"
import { OperatorBookingsPage } from "@/components/operator-bookings-page"
import { RoleGuard } from "@/components/role-guard"

export function OperatorPhoneApp() {
  return (
    <RoleGuard role="OPERATOR">
      <PhoneShell
        defaultPage="dashboard"
        titleMap={{
          dashboard: "dashboard",
          gate: "gate",
          bookings: "bookings",
          slots: "slots",
          settings: "settings",
        }}
        navItems={[
          { key: "dashboard", label: "dashboard", icon: LayoutDashboard },
          { key: "gate", label: "gate", icon: DoorOpen },
          { key: "bookings", label: "bookings", icon: CalendarCheck },
          { key: "slots", label: "slots", icon: Clock },
          { key: "settings", label: "settings", icon: Settings },
        ]}
        renderPage={(key) => {
          switch (key) {
            case "dashboard":
              return <DashboardPage />
            case "gate":
              return <GatePage />
            case "bookings":
              return <OperatorBookingsPage />
            case "slots":
              return <SlotsPage />
            case "settings":
              return <SettingsPage />
            default:
              return <DashboardPage />
          }
        }}
      />
    </RoleGuard>
  )
}
