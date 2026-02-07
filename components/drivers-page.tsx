"use client"

import { useEffect, useMemo, useState } from "react"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import {
  createDriver,
  getCarrierMe,
  getDrivers,
  registerUser,
} from "@/lib/api"
import type { Driver, DriverStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Plus,
  Search,
  User,
  CheckCircle2,
  Ban,
  Mail,
  Lock,
} from "lucide-react"

const statusConfig: Record<DriverStatus, { icon: typeof CheckCircle2; class: string }> = {
  ACTIVE: { icon: CheckCircle2, class: "bg-foreground text-background" },
  SUSPENDED: { icon: Ban, class: "bg-destructive/10 text-destructive" },
}

export function DriversPage() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showAddDriver, setShowAddDriver] = useState(false)
  const [addSuccess, setAddSuccess] = useState(false)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [carrierId, setCarrierId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!user) return
      try {
        if (user.role === "CARRIER") {
          const carrier = await getCarrierMe()
          if (!mounted) return
          setCarrierId(carrier.id)
          const list = await getDrivers(carrier.id)
          if (!mounted) return
          setDrivers(list)
        } else {
          const list = await getDrivers()
          if (!mounted) return
          setDrivers(list)
        }
      } catch (err: any) {
        if (!mounted) return
        setError(err?.message || "Unable to load drivers")
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [user])

  const filtered = useMemo(() => {
    return drivers.filter((driver) => {
      const matchesSearch = driver.user?.fullName
        ?.toLowerCase()
        ?.includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || driver.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [drivers, searchQuery, statusFilter])

  const statusCounts = {
    all: drivers.length,
    ACTIVE: drivers.filter((d) => d.status === "ACTIVE").length,
    SUSPENDED: drivers.filter((d) => d.status === "SUSPENDED").length,
  }

  const handleAddDriver = async () => {
    if (!carrierId || !fullName || !email || !password) return
    try {
      const auth = await registerUser({
        fullName,
        email,
        password,
        role: "DRIVER",
      })
      await createDriver({ userId: auth.user.id, carrierId })
      const refreshed = await getDrivers(carrierId)
      setDrivers(refreshed)
      setAddSuccess(true)
      setTimeout(() => {
        setAddSuccess(false)
        setShowAddDriver(false)
        setFullName("")
        setEmail("")
        setPassword("")
      }, 1500)
    } catch (err: any) {
      setError(err?.message || "Unable to add driver")
    }
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${lang === "ar" ? "font-arabic" : ""}`}>
            {t("drivers")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {drivers.length} {lang === "ar" ? "سائق" : "chauffeurs"}
          </p>
        </div>
        {user?.role === "CARRIER" && (
          <Button className="gap-2" onClick={() => setShowAddDriver(true)}>
            <Plus className="h-4 w-4" />
            {t("add_driver")}
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(statusCounts) as (keyof typeof statusCounts)[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 ${
                statusFilter === status
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
              }`}
            >
              {status === "all" ? t("all") : t(status.toLowerCase() as any)}
              <span className="opacity-60">({statusCounts[status]})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((driver) => {
          const cfg = statusConfig[driver.status]
          const StatusIcon = cfg.icon
          return (
            <div
              key={driver.id}
              className="rounded-xl border border-border bg-card p-5 hover:border-foreground/10 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                  <User className="h-6 w-6" />
                </div>
              </div>
              <h4 className="font-bold text-lg tracking-tight">
                {driver.user?.fullName || driver.id}
              </h4>
              <p className="text-sm text-muted-foreground mt-0.5">
                {driver.user?.email || "-"}
              </p>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <Badge variant="secondary" className={`text-xs ${cfg.class}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {t(driver.status.toLowerCase() as any)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {driver.carrierId?.slice(0, 6)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={showAddDriver} onOpenChange={setShowAddDriver}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("add_driver")}</DialogTitle>
          </DialogHeader>
          {addSuccess ? (
            <div className="flex flex-col items-center gap-4 py-8 animate-slide-up">
              <div className="h-16 w-16 rounded-full bg-foreground flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-background" />
              </div>
              <p className="font-bold">
                {lang === "ar" ? "تمت الإضافة بنجاح!" : "Chauffeur ajoute !"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label>{lang === "ar" ? "الاسم الكامل" : "Nom complet"}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Ahmed Benali"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="driver@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    type="password"
                    placeholder="******"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleAddDriver} className="w-full">
                {t("save")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
