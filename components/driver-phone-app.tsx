"use client"

import { Bell, Home, Settings } from "lucide-react"
import { PhoneShell } from "@/components/phone-shell"
import { DriverHomePage } from "@/components/driver-home-page"
import { NotificationsPage } from "@/components/notifications-page"
import { SettingsPage } from "@/components/settings-page"
import { RoleGuard } from "@/components/role-guard"

export function DriverPhoneApp() {
  return (
    <RoleGuard role="DRIVER">
      <PhoneShell
        defaultPage="home"
        titleMap={{
          home: "dashboard",
          notifications: "notifications",
          settings: "settings",
        }}
        navItems={[
          { key: "home", label: "dashboard", icon: Home },
          { key: "notifications", label: "notifications", icon: Bell },
          { key: "settings", label: "settings", icon: Settings },
        ]}
        renderPage={(key) => {
          switch (key) {
            case "home":
              return <DriverHomePage />
            case "notifications":
              return <NotificationsPage />
            case "settings":
              return <SettingsPage />
            default:
              return <DriverHomePage />
          }
        }}
      />
    </RoleGuard>
  )
}
