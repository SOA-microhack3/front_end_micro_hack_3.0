"use client"

import { useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n"
import { getNotifications, markAllNotificationsRead } from "@/lib/api"
import type { Notification } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, CheckCircle2 } from "lucide-react"

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })

export function NotificationsPage() {
  const { t, lang } = useI18n()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadNotifications = async () => {
    setLoading(true)
    setError("")
    try {
      const list = await getNotifications()
      setNotifications(list)
    } catch (err: any) {
      setError(err?.message || "Unable to load notifications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      await loadNotifications()
    } catch (err: any) {
      setError(err?.message || "Unable to mark notifications")
    }
  }

  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">
            {t("notifications")}
          </h3>
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-2">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {lang === "ar" ? "تحديد الكل كمقروء" : "Tout marquer lu"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">{t("loading")}</p>}

      {notifications.length === 0 && !loading ? (
        <p className="text-sm text-muted-foreground">
          {t("no_results")}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="p-3 rounded-lg border border-border flex items-start justify-between gap-3"
            >
              <div>
                <p className="text-sm font-medium">{notif.source}</p>
                <p className="text-xs text-muted-foreground">
                  {notif.message}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatDateTime(notif.createdAt)}
                </p>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {notif.type}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
