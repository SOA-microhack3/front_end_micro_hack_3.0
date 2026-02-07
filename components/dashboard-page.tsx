"use client"

import { useEffect, useMemo, useState } from "react"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import {
  getBookings,
  getCarrierMe,
  getCarrierOverview,
  getCarrierUpcomingBookings,
  getOperatorMe,
  getOperatorOverview,
  getOperatorTodayTraffic,
  getTerminals,
  getTrucks,
} from "@/lib/api"
import type { Booking, BookingStatus } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import {
  CalendarCheck,
  Truck,
  DoorOpen,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

const statusColor: Record<string, string> = {
  PENDING: "bg-foreground/10 text-foreground",
  CONFIRMED: "bg-foreground text-background",
  CONSUMED: "bg-foreground/20 text-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
  REJECTED: "bg-destructive/10 text-destructive",
}

const HOUR_START = 6
const HOUR_COUNT = 12

const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`

const sanitizeName = (name: string) => {
  return name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "_")
    .toLowerCase()
}

const isToday = (value: string) => {
  const date = new Date(value)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

const demoTrafficData = [
  { hour: "06:00", entries: 2, exits: 1, name: "06:00" },
  { hour: "07:00", entries: 4, exits: 2, name: "07:00" },
  { hour: "08:00", entries: 6, exits: 3, name: "08:00" },
  { hour: "09:00", entries: 5, exits: 4, name: "09:00" },
  { hour: "10:00", entries: 8, exits: 5, name: "10:00" },
  { hour: "11:00", entries: 10, exits: 6, name: "11:00" },
  { hour: "12:00", entries: 9, exits: 7, name: "12:00" },
  { hour: "13:00", entries: 7, exits: 6, name: "13:00" },
  { hour: "14:00", entries: 11, exits: 8, name: "14:00" },
  { hour: "15:00", entries: 12, exits: 9, name: "15:00" },
  { hour: "16:00", entries: 9, exits: 8, name: "16:00" },
  { hour: "17:00", entries: 6, exits: 7, name: "17:00" },
]

const buildTraffic = (bookings: Booking[]) => {
  const hours = Array.from({ length: HOUR_COUNT }, (_, i) => HOUR_START + i)
  return hours.map((hour) => {
    const entries = bookings.filter(
      (b) => new Date(b.slotStart).getHours() === hour
    ).length
    const exits = bookings.filter(
      (b) => new Date(b.slotEnd).getHours() === hour
    ).length
    return {
      hour: hourLabel(hour),
      entries,
      exits,
      name: hourLabel(hour),
    }
  })
}

export function DashboardPage() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState<
    { label: string; value: string | number; up: boolean; change: string; icon: any }[]
  >([])
  const [trafficData, setTrafficData] = useState<any[]>([])
  const [occupancyData, setOccupancyData] = useState<any[]>([])
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!user) return
      setLoading(true)
      try {
        if (user.role === "OPERATOR") {
          const operator = await getOperatorMe()
          const [overview, traffic, terminals] = await Promise.all([
            getOperatorOverview(operator.terminalId),
            getOperatorTodayTraffic(operator.terminalId),
            getTerminals(),
          ])

          const terminal = terminals.find((t) => t.id === operator.terminalId)
          const bookings = traffic.map((b: any) => ({
            id: b.id,
            bookingReference: b.bookingReference,
            slotStart: b.slotStart,
            slotEnd: b.slotEnd,
            status: b.status as BookingStatus,
            terminalId: operator.terminalId,
            truckId: "",
            carrierId: "",
            driverId: "",
            slotsCount: 1,
            terminal: terminal
              ? { id: terminal.id, name: terminal.name }
              : undefined,
          })) as Booking[]

          if (!mounted) return
          setStats([
            {
              label: t("total_bookings_today"),
              value: overview.todayBookings,
              icon: CalendarCheck,
              change: "+0%",
              up: true,
            },
            {
              label: t("pending"),
              value: overview.pendingApprovals,
              icon: Truck,
              change: "-",
              up: true,
            },
            {
              label: t("gate_entries_today"),
              value: overview.consumedToday,
              icon: DoorOpen,
              change: "+0%",
              up: true,
            },
            {
              label: t("capacity_utilization"),
              value: `${Math.round(overview.utilizationRate || 0)}%`,
              icon: Activity,
              change: "-",
              up: overview.utilizationRate >= 0,
            },
          ])
          setTrafficData(buildTraffic(bookings))
          setOccupancyData(
            terminal
              ? [
                  {
                    name: terminal.name,
                    occupancy: bookings.length,
                    used: bookings.length,
                    total: terminal.maxCapacity,
                  },
                ]
              : []
          )
          setRecentBookings(bookings.slice(0, 8))
        } else if (user.role === "CARRIER") {
          const carrier = await getCarrierMe()
          const [overview, upcoming, bookings] = await Promise.all([
            getCarrierOverview(carrier.id),
            getCarrierUpcomingBookings(carrier.id),
            getBookings({ carrierId: carrier.id }),
          ])

          if (!mounted) return
          setStats([
            {
              label: t("bookings"),
              value: overview.totalBookings,
              icon: CalendarCheck,
              change: "+0%",
              up: true,
            },
            {
              label: t("pending"),
              value: overview.pendingBookings,
              icon: Truck,
              change: "-",
              up: true,
            },
            {
              label: t("this_week"),
              value: overview.upcomingBookings,
              icon: DoorOpen,
              change: "+0%",
              up: true,
            },
            {
              label: t("active_trucks"),
              value: overview.activeTrucks,
              icon: Activity,
              change: "+0%",
              up: true,
            },
          ])
          setTrafficData(buildTraffic(bookings))
          setOccupancyData(
            upcoming.map((b: any) => ({
              name: b.terminalName || "-",
              occupancy: 1,
              used: 1,
              total: 1,
            }))
          )
          setRecentBookings(
            upcoming.map((b: any) => ({
              id: b.id,
              bookingReference: b.bookingReference,
              slotStart: b.slotStart,
              slotEnd: b.slotEnd,
              status: b.status as BookingStatus,
              terminalId: "",
              truckId: "",
              carrierId: carrier.id,
              driverId: "",
              slotsCount: 1,
              terminal: b.terminalName
                ? { id: "", name: b.terminalName }
                : undefined,
            }))
          )
        } else {
          const [bookings, trucks, terminals] = await Promise.all([
            getBookings(),
            getTrucks(),
            getTerminals(),
          ])
          if (!mounted) return

          const bookingsToday = bookings.filter((b) => isToday(b.slotStart))
          const consumedToday = bookingsToday.filter((b) => b.status === "CONSUMED")

          const capacityUtilization = bookingsToday.length
            ? Math.round((consumedToday.length / bookingsToday.length) * 100)
            : 0

          setStats([
            {
              label: t("total_bookings_today"),
              value: bookingsToday.length,
              icon: CalendarCheck,
              change: "+0%",
              up: true,
            },
            {
              label: t("active_trucks"),
              value: trucks.filter((t) => t.status === "ACTIVE").length,
              icon: Truck,
              change: "+0%",
              up: true,
            },
            {
              label: t("gate_entries_today"),
              value: consumedToday.length,
              icon: DoorOpen,
              change: "+0%",
              up: true,
            },
            {
              label: t("capacity_utilization"),
              value: `${capacityUtilization}%`,
              icon: Activity,
              change: "+0%",
              up: true,
            },
          ])

          setTrafficData(buildTraffic(bookingsToday))
          setOccupancyData(
            terminals.map((terminal) => {
              const count = bookingsToday.filter(
                (b) => b.terminal?.id === terminal.id
              ).length
              return {
                name: terminal.name,
                occupancy: count,
                used: count,
                total: terminal.maxCapacity,
              }
            })
          )
          setRecentBookings(bookings.slice(0, 8))
        }
      } catch {
        if (!mounted) return
        setStats([])
        setTrafficData([])
        setOccupancyData([])
        setRecentBookings([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [user, t])

  const trafficChartData = useMemo(() => {
    if (!trafficData.length) return demoTrafficData
    const hasNonZero = trafficData.some(
      (item) => (item.entries ?? 0) > 0 || (item.exits ?? 0) > 0
    )
    return hasNonZero ? trafficData : demoTrafficData
  }, [trafficData])
  const occupancyChartData = useMemo(() => occupancyData, [occupancyData])

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1400px] mx-auto">
      <div>
        <h2
          className={`text-2xl font-bold tracking-tight ${lang === "ar" ? "font-arabic" : ""}`}
        >
          {t("welcome_back")}, {user?.fullName?.split(" ")[0]}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {lang === "ar"
            ? "إليك ملخص نشاط الميناء اليوم"
            : "Voici le resume de l'activite portuaire aujourd'hui"}
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">{t("loading")}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const demoSparklines = [
                [6, 7, 8, 9, 11, 13, 14, 16],
                [4, 5, 7, 9, 12, 14, 15, 17],
                [8, 9, 10, 12, 14, 15, 17, 19],
                [18, 16, 15, 13, 11, 9, 8, 6],
              ]
              const demoUpFlags = [true, true, true, false]
              const demoIndex = stats.length === 4 ? stats.indexOf(stat) : 0
              const forcedUp =
                demoIndex >= 0 ? demoUpFlags[demoIndex] ?? stat.up : stat.up
              const gradientId = `stat-gradient-${sanitizeName(stat.label)}`
              const color = forcedUp
                ? "hsl(142.1 76.2% 36.3%)"
                : "hsl(0 72.2% 50.6%)"
              const sparklineData =
                stats.length === 4 && demoSparklines[demoIndex]
                  ? demoSparklines[demoIndex].map((value) => ({ value }))
                  : trafficChartData.length
                    ? trafficChartData.map((item) => ({
                        value: item.entries ?? 0,
                      }))
                    : [8, 7, 9, 6, 8, 7, 10, 9, 11, 10, 12, 11].map((v) => ({
                        value: v,
                      }))

              return (
                <div
                  key={stat.label}
                  className="rounded-xl border bg-card text-card-foreground shadow"
                >
                  <div className="p-4 pb-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {stat.label}
                      </p>
                      <div className="flex items-baseline justify-between">
                        <p
                          className={`text-lg font-semibold ${
                            forcedUp
                              ? "text-green-600 dark:text-green-500"
                              : "text-red-600 dark:text-red-500"
                          }`}
                        >
                          {stat.value}
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            forcedUp
                              ? "text-green-600 dark:text-green-500"
                              : "text-red-600 dark:text-red-500"
                          }`}
                        >
                          {stat.change}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 h-16 overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData}>
                          <defs>
                            <linearGradient
                              id={gradientId}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor={color}
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor={color}
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <Area
                            dataKey="value"
                            stroke={color}
                            fill={`url(#${gradientId})`}
                            fillOpacity={0.4}
                            strokeWidth={1.5}
                            type="monotone"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold">{t("hourly_traffic")}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("entries")} & {t("exits")}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-foreground" />
                    {t("entries")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-foreground/30" />
                    {t("exits")}
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trafficChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(0, 0%, 90%)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 11, fill: "#999" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#999" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e5e5e5",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="entries"
                    stroke="#2563EB"
                    fill="#2563EB"
                    fillOpacity={0.18}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="exits"
                    stroke="#64748B"
                    fill="#64748B"
                    fillOpacity={0.12}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-6">
                <h3 className="font-semibold">{t("terminal_occupancy")}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("capacity")}
                </p>
              </div>
              <div className="h-60 overflow-y-auto pr-1">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={occupancyChartData}>
                    <defs>
                      <linearGradient
                        id="occupancy-gradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                      <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#DDD6FE" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(0, 0%, 90%)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #e5e5e5",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="used"
                      fill="url(#occupancy-gradient)"
                      radius={[6, 6, 0, 0]}
                      isAnimationActive
                      animationDuration={900}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">{t("recent_activity")}</h3>
              <Badge variant="secondary" className="text-xs">
                {recentBookings.length} {t("entries")}
              </Badge>
            </div>
            <div className="divide-y divide-border">
              {recentBookings.length === 0 ? (
                <div className="p-5 text-sm text-muted-foreground">
                  {t("no_results")}
                </div>
              ) : (
                recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {booking.bookingReference || booking.id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking.terminal?.name || "-"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${statusColor[booking.status]}`}
                    >
                      {t(booking.status.toLowerCase() as any)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}





