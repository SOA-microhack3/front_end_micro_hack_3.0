"use client"

import { useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n"
import { getNotifications, getUnreadCount, markAllNotificationsRead } from "@/lib/api"
import type { Notification } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  Search,
  Menu,
  X,
  CalendarCheck,
  DoorOpen,
  Bot,
  AlertTriangle,
} from "lucide-react"

interface TopBarProps {
  title: string
  onToggleSidebar: () => void
}

export function TopBar({ title, onToggleSidebar }: TopBarProps) {
  const { t, lang } = useI18n()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const notifIcon = (type: string) => {
    switch (type) {
      case "PUSH":
        return <CalendarCheck className="h-4 w-4" />
      case "SOCKET":
        return <DoorOpen className="h-4 w-4" />
      case "EMAIL":
        return <Bot className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [list, unread] = await Promise.all([
          getNotifications(),
          getUnreadCount(),
        ])
        if (!mounted) return
        setNotifications(list)
        setUnreadCount(unread.count)
      } catch {
        if (!mounted) return
        setNotifications([])
        setUnreadCount(0)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!showNotifications || unreadCount === 0) return
    markAllNotificationsRead()
      .then(() => setUnreadCount(0))
      .catch(() => null)
  }, [showNotifications, unreadCount])

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1
            className={`text-lg font-bold tracking-tight ${lang === "ar" ? "font-arabic" : ""}`}
          >
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        {showSearch ? (
          <div className="flex items-center gap-2 animate-fade-in">
            <Input
              placeholder={t("search")}
              className="h-9 w-48"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setShowSearch(true)}
          >
            <Search className="h-4 w-4" />
          </Button>
        )}

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-foreground animate-pulse-dot" />
            )}
          </Button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setShowNotifications(false)
                }}
                role="button"
                tabIndex={-1}
                aria-label="Close notifications"
              />
              <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-border bg-card shadow-xl animate-slide-up">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-sm">
                    {t("notifications")}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount}
                  </Badge>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-border last:border-0 flex gap-3 transition-colors hover:bg-accent/50 ${!notif.readAt ? "bg-accent/30" : ""
                        }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent flex-shrink-0">
                        {notifIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {notif.source} {notif.type}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Live indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent">
          <span className="h-2 w-2 rounded-full bg-foreground animate-pulse-dot" />
          <span className="text-xs font-medium">{t("live")}</span>
        </div>
      </div>
    </header>
  )
}
