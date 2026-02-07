"use client"

import { useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n"
import { generateQr, getBookings } from "@/lib/api"
import type { Booking } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { QrCode, Calendar } from "lucide-react"

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("fr-FR")

export function DriverHomePage() {
  const { t, lang } = useI18n()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedQR, setSelectedQR] = useState<{ booking: Booking; qr: any } | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [list] = await Promise.all([getBookings()])
        if (!mounted) return
        setBookings(list)
      } catch {
        if (!mounted) return
        setBookings([])
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED")
  const pendingBookings = bookings.filter((b) => b.status === "PENDING")

  const handleShowQR = async (booking: Booking) => {
    try {
      const qr = await generateQr(booking.id)
      setSelectedQR({ booking, qr })
    } catch {
      // ignore
    }
  }

  return (
    <div className="p-5 flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">
            {lang === "ar" ? "الحجوزات" : "Mes reservations"}
          </h3>
        </div>
        <div className="flex flex-col gap-3">
          {pendingBookings.length === 0 && confirmedBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("no_results")}
            </p>
          ) : (
            [...pendingBookings, ...confirmedBookings].map((booking) => (
              <div
                key={booking.id}
                className="p-3 rounded-lg border border-border flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {booking.terminal?.name || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {booking.truck?.plateNumber || "-"} • {formatDate(booking.slotStart)} • {formatTime(booking.slotStart)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-foreground/10 text-foreground"
                  >
                    {t(booking.status.toLowerCase() as any)}
                  </Badge>
                  {booking.status === "CONFIRMED" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleShowQR(booking)}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={!!selectedQR} onOpenChange={() => setSelectedQR(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("view_qr")}</DialogTitle>
          </DialogHeader>
          {selectedQR && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-xs text-muted-foreground text-center">
                {selectedQR.booking.bookingReference}
              </div>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  selectedQR.qr.jwtToken
                )}`}
                alt="QR"
                className="h-56 w-56 rounded-lg border border-border"
              />
              <div className="text-xs text-muted-foreground break-all">
                {selectedQR.qr.jwtToken}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
