"use client"

import { useEffect, useState, useCallback } from "react"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import {
    getBookings,
    confirmBooking,
    rejectBooking,
    bulkConfirmBookings,
    bulkRejectBookings,
    getOperatorMe,
    getOperatorExceptions,
    getExceptionSummary,
    getRealTimeTerminalStatus,
    reassignBookingSlot,
    modifyBooking,
    manualOverride,
} from "@/lib/api"
import type { Booking } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    CheckCircle2,
    XCircle,
    Clock,
    Truck,
    User,
    Search,
    AlertTriangle,
    Activity,
    Calendar,
    Edit,
    RefreshCw,
    Shield,
} from "lucide-react"

type BookingWithDetails = Booking & {
    truck?: { id: string; plateNumber: string }
    driver?: { id: string; user?: { fullName: string } }
    terminal?: { id: string; name: string }
}

type Exception = {
    type: string
    severity: string
    message: string
    bookingId?: string
    bookingReference?: string
    slotStart?: string
    excessCount?: number
    bookings?: { id: string; reference: string; truck?: string }[]
}

type TerminalStatus = {
    terminalId: string
    timestamp: string
    currentSlot: {
        start: string
        end: string
        trucksInSlot: number
        bookings: { id: string; reference: string; status: string; truck?: string; driver?: string }[]
    }
    upcomingArrivals: number
    todaySummary: {
        total: number
        pending: number
        confirmed: number
        consumed: number
        cancelled: number
    }
    utilizationRate: number
}

type ExceptionSummary = {
    total: number
    byType: Record<string, number>
    bySeverity: Record<string, number>
}

export function OperatorBookingsPage() {
    const { t, lang } = useI18n()
    const { user } = useAuth()
    const [bookings, setBookings] = useState<BookingWithDetails[]>([])
    const [filteredBookings, setFilteredBookings] = useState<BookingWithDetails[]>([])
    const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set())
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(true)
    const [operatorTerminalId, setOperatorTerminalId] = useState<string | null>(null)

    // Exception & Dashboard state
    const [exceptions, setExceptions] = useState<Exception[]>([])
    const [exceptionSummary, setExceptionSummary] = useState<ExceptionSummary | null>(null)
    const [terminalStatus, setTerminalStatus] = useState<TerminalStatus | null>(null)
    const [showExceptions, setShowExceptions] = useState(false)

    // Dialog state
    const [reassignDialog, setReassignDialog] = useState<{ open: boolean; bookingId: string; bookingRef: string }>({ open: false, bookingId: "", bookingRef: "" })
    const [modifyDialog, setModifyDialog] = useState<{ open: boolean; booking: BookingWithDetails | null }>({ open: false, booking: null })
    const [overrideDialog, setOverrideDialog] = useState<{ open: boolean; bookingId: string; bookingRef: string }>({ open: false, bookingId: "", bookingRef: "" })
    const [newSlotTime, setNewSlotTime] = useState("")
    const [overrideReason, setOverrideReason] = useState("")
    const [actionLoading, setActionLoading] = useState(false)

    const loadDashboardData = useCallback(async (terminalId: string) => {
        try {
            const [exceptionsData, summaryData, statusData] = await Promise.all([
                getOperatorExceptions(terminalId).catch(() => []),
                getExceptionSummary(terminalId).catch(() => null),
                getRealTimeTerminalStatus(terminalId).catch(() => null),
            ])
            setExceptions(exceptionsData)
            setExceptionSummary(summaryData)
            setTerminalStatus(statusData)
        } catch (error) {
            console.error("Failed to load dashboard data:", error)
        }
    }, [])

    const reloadBookings = useCallback(async () => {
        if (!operatorTerminalId) return
        try {
            const data = await getBookings({ terminalId: operatorTerminalId })
            setBookings(data as BookingWithDetails[])
            await loadDashboardData(operatorTerminalId)
        } catch (error) {
            console.error("Failed to reload bookings:", error)
        }
    }, [operatorTerminalId, loadDashboardData])

    useEffect(() => {
        let mounted = true
        const loadOperatorData = async () => {
            try {
                if (user?.role === "OPERATOR") {
                    const operator = await getOperatorMe()
                    if (!mounted) return
                    if (operator?.terminalId) {
                        setOperatorTerminalId(operator.terminalId)
                        const [bookingsData] = await Promise.all([
                            getBookings({ terminalId: operator.terminalId }),
                        ])
                        if (!mounted) return
                        setBookings(bookingsData as BookingWithDetails[])
                        setFilteredBookings(bookingsData as BookingWithDetails[])
                        await loadDashboardData(operator.terminalId)
                    }
                }
            } catch (error) {
                console.error("Failed to load bookings:", error)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        loadOperatorData()

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            if (operatorTerminalId) {
                loadDashboardData(operatorTerminalId)
            }
        }, 30000)

        return () => {
            mounted = false
            clearInterval(interval)
        }
    }, [user, loadDashboardData, operatorTerminalId])

    useEffect(() => {
        let filtered = bookings
        if (statusFilter !== "all") {
            filtered = filtered.filter((b) => b.status === statusFilter)
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(
                (b) =>
                    b.bookingReference?.toLowerCase().includes(query) ||
                    b.truck?.plateNumber?.toLowerCase().includes(query) ||
                    b.driver?.user?.fullName?.toLowerCase().includes(query)
            )
        }
        setFilteredBookings(filtered)
    }, [bookings, statusFilter, searchQuery])

    const handleSelectBooking = (bookingId: string) => {
        const newSelected = new Set(selectedBookings)
        if (newSelected.has(bookingId)) {
            newSelected.delete(bookingId)
        } else {
            newSelected.add(bookingId)
        }
        setSelectedBookings(newSelected)
    }

    const handleSelectAll = () => {
        if (selectedBookings.size === filteredBookings.length) {
            setSelectedBookings(new Set())
        } else {
            setSelectedBookings(new Set(filteredBookings.map((b) => b.id)))
        }
    }

    const handleBulkConfirm = async () => {
        if (selectedBookings.size === 0) return
        try {
            await bulkConfirmBookings(Array.from(selectedBookings))
            await reloadBookings()
            setSelectedBookings(new Set())
        } catch (error) {
            console.error("Bulk confirm failed:", error)
        }
    }

    const handleBulkReject = async () => {
        if (selectedBookings.size === 0) return
        try {
            await bulkRejectBookings(Array.from(selectedBookings))
            await reloadBookings()
            setSelectedBookings(new Set())
        } catch (error) {
            console.error("Bulk reject failed:", error)
        }
    }

    const handleConfirm = async (bookingId: string) => {
        try {
            await confirmBooking(bookingId)
            await reloadBookings()
        } catch (error) {
            console.error("Confirm failed:", error)
        }
    }

    const handleReject = async (bookingId: string) => {
        try {
            await rejectBooking(bookingId)
            await reloadBookings()
        } catch (error) {
            console.error("Reject failed:", error)
        }
    }

    const handleReassignSlot = async () => {
        if (!newSlotTime || !reassignDialog.bookingId) return
        setActionLoading(true)
        try {
            await reassignBookingSlot(reassignDialog.bookingId, new Date(newSlotTime).toISOString())
            await reloadBookings()
            setReassignDialog({ open: false, bookingId: "", bookingRef: "" })
            setNewSlotTime("")
        } catch (error) {
            console.error("Reassign failed:", error)
        } finally {
            setActionLoading(false)
        }
    }

    const handleManualOverride = async () => {
        if (!overrideReason || !overrideDialog.bookingId) return
        setActionLoading(true)
        try {
            await manualOverride(overrideDialog.bookingId, overrideReason)
            await reloadBookings()
            setOverrideDialog({ open: false, bookingId: "", bookingRef: "" })
            setOverrideReason("")
        } catch (error) {
            console.error("Override failed:", error)
        } finally {
            setActionLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            PENDING: { label: lang === "ar" ? "قيد الانتظار" : "En attente", class: "bg-yellow-500/20 text-yellow-700" },
            CONFIRMED: { label: lang === "ar" ? "مؤكد" : "Confirmé", class: "bg-green-500/20 text-green-700" },
            REJECTED: { label: lang === "ar" ? "مرفوض" : "Rejeté", class: "bg-red-500/20 text-red-700" },
            CANCELLED: { label: lang === "ar" ? "ملغى" : "Annulé", class: "bg-gray-500/20 text-gray-700" },
            CONSUMED: { label: lang === "ar" ? "مستهلك" : "Consommé", class: "bg-blue-500/20 text-blue-700" },
        }
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
        return <Badge className={`${config.class} text-xs`}>{config.label}</Badge>
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "HIGH": return "text-red-600 bg-red-50"
            case "MEDIUM": return "text-orange-600 bg-orange-50"
            case "WARNING": return "text-yellow-600 bg-yellow-50"
            default: return "text-gray-600 bg-gray-50"
        }
    }

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center">
                <p className="text-muted-foreground">{t("loading")}</p>
            </div>
        )
    }

    return (
        <div className="p-6 flex flex-col gap-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className={`text-2xl font-bold tracking-tight ${lang === "ar" ? "font-arabic" : ""}`}>
                        {lang === "ar" ? "إدارة الحجوزات" : "Gestion des Réservations"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {lang === "ar" ? "عرض وإدارة جميع الحجوزات" : "Voir et gérer toutes les réservations"}
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={reloadBookings} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    {lang === "ar" ? "تحديث" : "Actualiser"}
                </Button>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Real-time Status */}
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">{lang === "ar" ? "الحالة الآنية" : "Statut en temps réel"}</span>
                    </div>
                    {terminalStatus ? (
                        <div className="space-y-1">
                            <p className="text-2xl font-bold">{terminalStatus.currentSlot.trucksInSlot}</p>
                            <p className="text-xs text-muted-foreground">{lang === "ar" ? "شاحنات في الفترة الحالية" : "Camions dans le créneau actuel"}</p>
                            <p className="text-xs text-muted-foreground">
                                {lang === "ar" ? "قادمون:" : "À venir:"} {terminalStatus.upcomingArrivals}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">-</p>
                    )}
                </div>

                {/* Today's Summary */}
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">{lang === "ar" ? "ملخص اليوم" : "Résumé du jour"}</span>
                    </div>
                    {terminalStatus?.todaySummary ? (
                        <div className="space-y-1">
                            <p className="text-2xl font-bold">{terminalStatus.todaySummary.total}</p>
                            <div className="flex gap-2 text-xs">
                                <span className="text-green-600">✓ {terminalStatus.todaySummary.confirmed}</span>
                                <span className="text-yellow-600">⏳ {terminalStatus.todaySummary.pending}</span>
                                <span className="text-blue-600">✔ {terminalStatus.todaySummary.consumed}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">-</p>
                    )}
                </div>

                {/* Utilization Rate */}
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Truck className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">{lang === "ar" ? "معدل الاستخدام" : "Taux d'utilisation"}</span>
                    </div>
                    <p className="text-2xl font-bold">{terminalStatus?.utilizationRate || 0}%</p>
                    <div className="w-full h-2 bg-muted rounded-full mt-2">
                        <div
                            className="h-full bg-purple-500 rounded-full transition-all"
                            style={{ width: `${terminalStatus?.utilizationRate || 0}%` }}
                        />
                    </div>
                </div>

                {/* Exceptions */}
                <div
                    className={`rounded-xl border bg-card p-4 cursor-pointer transition-colors ${exceptions.length > 0 ? 'hover:border-red-300' : ''}`}
                    onClick={() => exceptions.length > 0 && setShowExceptions(!showExceptions)}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className={`h-4 w-4 ${exceptions.length > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium">{lang === "ar" ? "الاستثناءات" : "Exceptions"}</span>
                    </div>
                    <p className={`text-2xl font-bold ${exceptions.length > 0 ? 'text-red-600' : ''}`}>
                        {exceptionSummary?.total || 0}
                    </p>
                    {exceptionSummary && exceptionSummary.total > 0 && (
                        <div className="flex gap-2 text-xs mt-1">
                            <span className="text-red-600">HIGH: {exceptionSummary.bySeverity.HIGH || 0}</span>
                            <span className="text-orange-600">MED: {exceptionSummary.bySeverity.MEDIUM || 0}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Exceptions Panel */}
            {showExceptions && exceptions.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
                    <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        {lang === "ar" ? "الاستثناءات النشطة" : "Exceptions actives"}
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {exceptions.map((exc, idx) => (
                            <div key={idx} className={`p-3 rounded-lg ${getSeverityColor(exc.severity)} flex items-center justify-between`}>
                                <div>
                                    <p className="text-sm font-medium">{exc.message}</p>
                                    <p className="text-xs opacity-75">{exc.type}</p>
                                </div>
                                {exc.bookingId && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setOverrideDialog({ open: true, bookingId: exc.bookingId!, bookingRef: exc.bookingReference || "" })}
                                        className="gap-1"
                                    >
                                        <Shield className="h-3 w-3" />
                                        Override
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters and Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={lang === "ar" ? "بحث..." : "Rechercher..."}
                            className="pl-10"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder={t("status")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{lang === "ar" ? "الكل" : "Tous"}</SelectItem>
                            <SelectItem value="PENDING">{lang === "ar" ? "قيد الانتظار" : "En attente"}</SelectItem>
                            <SelectItem value="CONFIRMED">{lang === "ar" ? "مؤكد" : "Confirmé"}</SelectItem>
                            <SelectItem value="REJECTED">{lang === "ar" ? "مرفوض" : "Rejeté"}</SelectItem>
                            <SelectItem value="CANCELLED">{lang === "ar" ? "ملغى" : "Annulé"}</SelectItem>
                            <SelectItem value="CONSUMED">{lang === "ar" ? "مستهلك" : "Consommé"}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {selectedBookings.size > 0 && (
                    <div className="flex gap-2">
                        <Button onClick={handleBulkConfirm} size="sm" className="gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            {lang === "ar" ? "تأكيد المحدد" : "Confirmer"} ({selectedBookings.size})
                        </Button>
                        <Button onClick={handleBulkReject} size="sm" variant="destructive" className="gap-2">
                            <XCircle className="h-4 w-4" />
                            {lang === "ar" ? "رفض المحدد" : "Rejeter"} ({selectedBookings.size})
                        </Button>
                    </div>
                )}
            </div>

            {/* Bookings Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-border bg-muted/50">
                            <tr>
                                <th className="p-4 text-left">
                                    <Checkbox
                                        checked={selectedBookings.size === filteredBookings.length && filteredBookings.length > 0}
                                        onCheckedChange={handleSelectAll}
                                    />
                                </th>
                                <th className="p-4 text-left text-sm font-semibold">{lang === "ar" ? "المرجع" : "Référence"}</th>
                                <th className="p-4 text-left text-sm font-semibold">{lang === "ar" ? "الشاحنة" : "Camion"}</th>
                                <th className="p-4 text-left text-sm font-semibold">{lang === "ar" ? "السائق" : "Chauffeur"}</th>
                                <th className="p-4 text-left text-sm font-semibold">{lang === "ar" ? "الحاوية" : "Conteneur"}</th>
                                <th className="p-4 text-left text-sm font-semibold">{lang === "ar" ? "الوقت" : "Horaire"}</th>
                                <th className="p-4 text-left text-sm font-semibold">{t("status")}</th>
                                <th className="p-4 text-left text-sm font-semibold">{lang === "ar" ? "إجراءات" : "Actions"}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                        {lang === "ar" ? "لا توجد حجوزات" : "Aucune réservation"}
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <tr key={booking.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                        <td className="p-4">
                                            <Checkbox
                                                checked={selectedBookings.has(booking.id)}
                                                onCheckedChange={() => handleSelectBooking(booking.id)}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-mono font-semibold">{booking.bookingReference}</p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Truck className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{booking.truck?.plateNumber || "-"}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{booking.driver?.user?.fullName || "-"}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm font-mono">{booking.containerMatricule || "-"}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {new Date(booking.slotStart).toLocaleTimeString("fr-FR", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">{getStatusBadge(booking.status)}</td>
                                        <td className="p-4">
                                            <div className="flex gap-1 flex-wrap">
                                                {booking.status === "PENDING" && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleConfirm(booking.id)}
                                                            className="gap-1 h-8"
                                                        >
                                                            <CheckCircle2 className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleReject(booking.id)}
                                                            className="gap-1 h-8 text-destructive hover:text-destructive"
                                                        >
                                                            <XCircle className="h-3 w-3" />
                                                        </Button>
                                                    </>
                                                )}
                                                {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setReassignDialog({ open: true, bookingId: booking.id, bookingRef: booking.bookingReference })}
                                                            className="gap-1 h-8"
                                                            title={lang === "ar" ? "إعادة تعيين" : "Réassigner"}
                                                        >
                                                            <Calendar className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setModifyDialog({ open: true, booking })}
                                                            className="gap-1 h-8"
                                                            title={lang === "ar" ? "تعديل" : "Modifier"}
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <p>
                    {lang === "ar" ? "إجمالي الحجوزات:" : "Total:"} {filteredBookings.length}
                </p>
                <p>
                    {lang === "ar" ? "قيد الانتظار:" : "En attente:"}{" "}
                    {filteredBookings.filter((b) => b.status === "PENDING").length}
                </p>
            </div>

            {/* Reassign Slot Dialog */}
            <Dialog open={reassignDialog.open} onOpenChange={(open) => !open && setReassignDialog({ open: false, bookingId: "", bookingRef: "" })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{lang === "ar" ? "إعادة تعيين الفترة" : "Réassigner le créneau"}</DialogTitle>
                        <DialogDescription>
                            {lang === "ar" ? `حجز: ${reassignDialog.bookingRef}` : `Réservation: ${reassignDialog.bookingRef}`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{lang === "ar" ? "فترة جديدة" : "Nouveau créneau"}</Label>
                            <Input
                                type="datetime-local"
                                value={newSlotTime}
                                onChange={(e) => setNewSlotTime(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReassignDialog({ open: false, bookingId: "", bookingRef: "" })}>
                            {lang === "ar" ? "إلغاء" : "Annuler"}
                        </Button>
                        <Button onClick={handleReassignSlot} disabled={!newSlotTime || actionLoading}>
                            {actionLoading ? "..." : (lang === "ar" ? "تأكيد" : "Confirmer")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manual Override Dialog */}
            <Dialog open={overrideDialog.open} onOpenChange={(open) => !open && setOverrideDialog({ open: false, bookingId: "", bookingRef: "" })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{lang === "ar" ? "تجاوز يدوي" : "Override manuel"}</DialogTitle>
                        <DialogDescription>
                            {lang === "ar" ? `الموافقة على استثناء الحجز: ${overrideDialog.bookingRef}` : `Approuver l'exception pour: ${overrideDialog.bookingRef}`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{lang === "ar" ? "سبب التجاوز" : "Raison de l'override"}</Label>
                            <Textarea
                                value={overrideReason}
                                onChange={(e) => setOverrideReason(e.target.value)}
                                placeholder={lang === "ar" ? "أدخل سبب التجاوز..." : "Entrez la raison..."}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOverrideDialog({ open: false, bookingId: "", bookingRef: "" })}>
                            {lang === "ar" ? "إلغاء" : "Annuler"}
                        </Button>
                        <Button onClick={handleManualOverride} disabled={!overrideReason || actionLoading}>
                            {actionLoading ? "..." : (lang === "ar" ? "موافقة" : "Approuver")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modify Booking Dialog */}
            <Dialog open={modifyDialog.open} onOpenChange={(open) => !open && setModifyDialog({ open: false, booking: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{lang === "ar" ? "تعديل الحجز" : "Modifier la réservation"}</DialogTitle>
                        <DialogDescription>
                            {modifyDialog.booking?.bookingReference}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            {lang === "ar"
                                ? "استخدم أزرار الإجراء الأخرى لتعديل الحجز (إعادة تعيين الفترة، التجاوز اليدوي)"
                                : "Utilisez les autres boutons d'action pour modifier la réservation (réassigner le créneau, override manuel)"
                            }
                        </p>
                        <div className="space-y-2">
                            <p><strong>{lang === "ar" ? "الشاحنة:" : "Camion:"}</strong> {modifyDialog.booking?.truck?.plateNumber || "-"}</p>
                            <p><strong>{lang === "ar" ? "السائق:" : "Chauffeur:"}</strong> {modifyDialog.booking?.driver?.user?.fullName || "-"}</p>
                            <p><strong>{lang === "ar" ? "الفترة:" : "Créneau:"}</strong> {modifyDialog.booking?.slotStart ? new Date(modifyDialog.booking.slotStart).toLocaleString("fr-FR") : "-"}</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModifyDialog({ open: false, booking: null })}>
                            {lang === "ar" ? "إغلاق" : "Fermer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
