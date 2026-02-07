"use client"

import { useEffect, useMemo, useState } from "react"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import {
  cancelBooking,
  createBooking,
  generateQr,
  getBookings,
  getCarrierMe,
  getDrivers,
  getTerminals,
  getTrucks,
  getAvailability,
} from "@/lib/api"
import type { Booking, BookingStatus, Driver, Terminal, Truck } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Search,
  Download,
  QrCode,
  XCircle,
  CheckCircle2,
  Calendar,
  Filter,
  SlidersHorizontal,
} from "lucide-react"

const statusConfig: Record<
  BookingStatus,
  { class: string; icon: typeof CheckCircle2 }
> = {
  PENDING: {
    class: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
    icon: CheckCircle2,
  },
  CONFIRMED: {
    class: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  CONSUMED: {
    class: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
    icon: CheckCircle2,
  },
  CANCELLED: {
    class: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
    icon: XCircle,
  },
  REJECTED: {
    class: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300",
    icon: XCircle,
  },
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("fr-FR")

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })

export function BookingsPage() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showNewBooking, setShowNewBooking] = useState(false)
  const [showQR, setShowQR] = useState<{ booking: Booking; qr: any } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [carrierId, setCarrierId] = useState<string | null>(null)
  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [availability, setAvailability] = useState<any[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])

  const [newTerminal, setNewTerminal] = useState("")
  const [newTruck, setNewTruck] = useState("")
  const [newDriver, setNewDriver] = useState("")
  const [newSlotStart, setNewSlotStart] = useState("")
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 8

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!user) return
      setLoading(true)
      try {
        const [terminalsData] = await Promise.all([getTerminals()])
        if (!mounted) return
        setTerminals(terminalsData)

        let carrier = carrierId
        if (user.role === "CARRIER") {
          const me = await getCarrierMe()
          carrier = me.id
          if (mounted) setCarrierId(me.id)
          const [trucksData, driversData, bookingsData] = await Promise.all([
            getTrucks(me.id),
            getDrivers(me.id),
            getBookings({ carrierId: me.id }),
          ])
          if (!mounted) return
          setTrucks(trucksData)
          setDrivers(driversData)
          setBookings(bookingsData)
        } else {
          const bookingsData = await getBookings()
          if (!mounted) return
          setBookings(bookingsData)
        }
      } catch (err: any) {
        if (!mounted) return
        setError(err?.message || "Failed to load bookings")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [user])

  useEffect(() => {
    let mounted = true
    const loadAvailability = async () => {
      if (!newTerminal) return
      try {
        const data = await getAvailability(newTerminal, selectedDate)
        if (!mounted) return
        setAvailability(data.slots || [])
      } catch {
        if (!mounted) return
        setAvailability([])
      }
    }
    loadAvailability()
    return () => {
      mounted = false
    }
  }, [newTerminal, selectedDate])

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        b.bookingReference?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
        b.truck?.plateNumber
          ?.toLowerCase()
          ?.includes(searchQuery.toLowerCase()) ||
        b.terminal?.name?.toLowerCase()?.includes(searchQuery.toLowerCase())
      const matchesStatus =
        statusFilter === "all" || b.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [bookings, searchQuery, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page])
  const paginationItems = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const items: Array<number | "ellipsis"> = [1]
    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)
    if (start > 2) items.push("ellipsis")
    for (let i = start; i <= end; i += 1) items.push(i)
    if (end < totalPages - 1) items.push("ellipsis")
    items.push(totalPages)
    return items
  }, [page, totalPages])

  const handleCreateBooking = async () => {
    if (!newTerminal || !newTruck || !newDriver || !newSlotStart) return
    try {
      await createBooking({
        terminalId: newTerminal,
        truckId: newTruck,
        driverId: newDriver,
        slotStart: newSlotStart,
        carrierId: carrierId || undefined,
      })
      const refreshed = carrierId
        ? await getBookings({ carrierId })
        : await getBookings()
      setBookings(refreshed)
      setBookingSuccess(true)
      setTimeout(() => {
        setBookingSuccess(false)
        setShowNewBooking(false)
        setNewTerminal("")
        setNewTruck("")
        setNewDriver("")
        setNewSlotStart("")
      }, 1500)
    } catch (err: any) {
      setError(err?.message || "Unable to create booking")
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId)
      const refreshed = carrierId
        ? await getBookings({ carrierId })
        : await getBookings()
      setBookings(refreshed)
    } catch (err: any) {
      setError(err?.message || "Unable to cancel booking")
    }
  }

  const handleShowQR = async (booking: Booking) => {
    try {
      const qr = await generateQr(booking.id)
      setShowQR({ booking, qr })
    } catch (err: any) {
      setError(err?.message || "Unable to generate QR")
    }
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2
            className={`text-2xl font-bold tracking-tight ${lang === "ar" ? "font-arabic" : ""}`}
          >
            {t("bookings")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "ar"
              ? `${filtered.length} حجوزات`
              : `${filtered.length} reservations`}
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">{t("loading")}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                lang === "ar" ? "ابحث بالمرجع أو الشاحنة..." : "Filter by booking or truck..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 w-40 rounded-xl pl-10">
                  <SelectValue
                    placeholder={lang === "ar" ? "الحالة" : "Status"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {lang === "ar" ? "الكل" : "All"}
                  </SelectItem>
                  {(
                    ["PENDING", "CONFIRMED", "CONSUMED", "CANCELLED", "REJECTED"] as const
                  ).map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(status.toLowerCase() as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl">
            <Download className="h-4 w-4" />
          </Button>
          {user?.role === "CARRIER" && (
            <Button className="h-11 gap-2 rounded-xl" onClick={() => setShowNewBooking(true)}>
              <Plus className="h-4 w-4" />
              {t("new_booking")}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="px-5 py-3 text-xs font-semibold text-muted-foreground">
                {t("booking_id")}
              </TableHead>
              <TableHead className="px-5 py-3 text-xs font-semibold text-muted-foreground">
                {t("booking_truck")}
              </TableHead>
              <TableHead className="px-5 py-3 text-xs font-semibold text-muted-foreground">
                {t("booking_terminal")}
              </TableHead>
              <TableHead className="px-5 py-3 text-xs font-semibold text-muted-foreground">
                {t("booking_slot")}
              </TableHead>
              <TableHead className="px-5 py-3 text-xs font-semibold text-muted-foreground">
                {t("booking_date")}
              </TableHead>
              <TableHead className="px-5 py-3 text-xs font-semibold text-muted-foreground">
                {t("status")}
              </TableHead>
              <TableHead className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((booking) => {
              const cfg = statusConfig[booking.status]
              const StatusIcon = cfg.icon
              return (
                <TableRow
                  key={booking.id}
                  className="hover:bg-muted/40 transition-colors"
                >
                  <TableCell className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">
                        {booking.bookingReference || booking.id}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {booking.id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm">
                    {booking.truck?.plateNumber || "-"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm">
                    {booking.terminal?.name || "-"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm">
                    {formatTime(booking.slotStart)} -{" "}
                    {formatTime(booking.slotEnd)}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm">
                    {formatDate(booking.slotStart)}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge
                      variant="secondary"
                      className={`text-xs font-medium ${cfg.class}`}
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {t(booking.status.toLowerCase() as any)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      {booking.status === "CONFIRMED" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleShowQR(booking)}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      )}
                      {booking.status === "PENDING" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <div className="flex flex-col gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>
            {filtered.length === 0
              ? t("no_results")
              : `${(page - 1) * pageSize + 1}-${Math.min(
                page * pageSize,
                filtered.length
              )} / ${filtered.length}`}
          </span>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                  onClick={(e) => {
                    e.preventDefault()
                    if (page > 1) setPage(page - 1)
                  }}
                />
              </PaginationItem>
              {paginationItems.map((item, index) =>
                item === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href="#"
                      isActive={item === page}
                      onClick={(e) => {
                        e.preventDefault()
                        setPage(item)
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  className={
                    page >= totalPages ? "pointer-events-none opacity-50" : ""
                  }
                  onClick={(e) => {
                    e.preventDefault()
                    if (page < totalPages) setPage(page + 1)
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md rounded-2xl p-0">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle className="text-lg font-semibold">
              {t("booking_id")}
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="px-6 py-5">
              <div className="flex flex-col gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("booking_id")}</span>
                  <span className="font-semibold text-foreground">
                    {selectedBooking.bookingReference}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("booking_terminal")}</span>
                  <span className="font-medium">
                    {selectedBooking.terminal?.name || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("booking_truck")}</span>
                  <span className="font-medium">
                    {selectedBooking.truck?.plateNumber || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("booking_slot")}</span>
                  <span className="font-medium">
                    {formatTime(selectedBooking.slotStart)} -{" "}
                    {formatTime(selectedBooking.slotEnd)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!showQR} onOpenChange={() => setShowQR(null)}>
        <DialogContent className="max-w-sm rounded-2xl p-0">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle className="text-lg font-semibold">
              {t("view_qr")}
            </DialogTitle>
          </DialogHeader>
          {showQR && (
            <div className="flex flex-col items-center gap-4 px-6 py-5">
              <div className="text-xs text-muted-foreground text-center">
                {showQR.booking.bookingReference}
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3 shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    showQR.qr.jwtToken
                  )}`}
                  alt="QR"
                  className="h-52 w-52 rounded-lg bg-background"
                />
              </div>
              <div className="text-xs text-muted-foreground break-all text-center">
                {showQR.qr.jwtToken}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showNewBooking} onOpenChange={setShowNewBooking}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("new_booking")}</DialogTitle>
          </DialogHeader>
          {bookingSuccess ? (
            <div className="flex flex-col items-center gap-4 py-8 animate-slide-up">
              <div className="h-16 w-16 rounded-full bg-foreground flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-background" />
              </div>
              <p className="font-bold">
                {lang === "ar" ? "تمت الإضافة بنجاح!" : "Reservation creee !"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>{t("booking_terminal")}</Label>
                <Select value={newTerminal} onValueChange={setNewTerminal}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_terminal")} />
                  </SelectTrigger>
                  <SelectContent>
                    {terminals.map((terminal) => (
                      <SelectItem key={terminal.id} value={terminal.id}>
                        {terminal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("booking_truck")}</Label>
                <Select value={newTruck} onValueChange={setNewTruck}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("booking_truck")} />
                  </SelectTrigger>
                  <SelectContent>
                    {trucks.map((truck) => (
                      <SelectItem key={truck.id} value={truck.id}>
                        {truck.plateNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("drivers")}</Label>
                <Select value={newDriver} onValueChange={setNewDriver}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("drivers")} />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.user?.fullName || driver.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("date")}</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>{t("booking_slot")}</Label>
                  <span className="text-xs text-muted-foreground">
                    {lang === "ar" ? "اختر الكرينو المتاح" : "Choose an available slot"}
                  </span>
                </div>
                <Select value={newSlotStart} onValueChange={setNewSlotStart}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder={t("booking_slot")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {availability.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        {lang === "ar" ? "لا توجد فترات متاحة" : "No available slots"}
                      </div>
                    ) : (
                      availability.map((slot: any) => (
                        <SelectItem key={slot.slotStart} value={slot.slotStart}>
                          <div className="flex w-full items-center justify-between gap-3">
                            <span className="text-sm">
                              {formatTime(slot.slotStart)} -{" "}
                              {formatTime(slot.slotEnd)}
                            </span>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                              {slot.availableCount}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateBooking} className="w-full">
                {t("save")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
