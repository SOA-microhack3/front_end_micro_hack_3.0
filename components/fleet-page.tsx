"use client"

import { useEffect, useMemo, useState } from "react"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import { createTruck, getCarrierMe, getTrucks } from "@/lib/api"
import type { Truck, TruckStatus } from "@/lib/types"
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
  Truck as TruckIcon,
  CheckCircle2,
  Ban,
} from "lucide-react"

const statusConfig: Record<TruckStatus, { icon: typeof CheckCircle2; class: string }> = {
  ACTIVE: { icon: CheckCircle2, class: "bg-foreground text-background" },
  SUSPENDED: { icon: Ban, class: "bg-destructive/10 text-destructive" },
}

export function FleetPage() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showAddTruck, setShowAddTruck] = useState(false)
  const [addSuccess, setAddSuccess] = useState(false)
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [carrierId, setCarrierId] = useState<string | null>(null)
  const [plateNumber, setPlateNumber] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!user) return
      try {
        if (user.role === "CARRIER") {
          const carrier = await getCarrierMe()
          if (!mounted) return
          setCarrierId(carrier.id)
          const list = await getTrucks(carrier.id)
          if (!mounted) return
          setTrucks(list)
        } else {
          const list = await getTrucks()
          if (!mounted) return
          setTrucks(list)
        }
      } catch (err: any) {
        if (!mounted) return
        setError(err?.message || "Unable to load trucks")
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [user])

  const filtered = useMemo(() => {
    return trucks.filter((truck) => {
      const matchesSearch = truck.plateNumber
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || truck.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [trucks, searchQuery, statusFilter])

  const statusCounts = {
    all: trucks.length,
    ACTIVE: trucks.filter((t) => t.status === "ACTIVE").length,
    SUSPENDED: trucks.filter((t) => t.status === "SUSPENDED").length,
  }

  const handleAddTruck = async () => {
    if (!plateNumber || !carrierId) return
    try {
      await createTruck({ plateNumber, carrierId })
      const refreshed = await getTrucks(carrierId)
      setTrucks(refreshed)
      setAddSuccess(true)
      setTimeout(() => {
        setAddSuccess(false)
        setShowAddTruck(false)
        setPlateNumber("")
      }, 1500)
    } catch (err: any) {
      setError(err?.message || "Unable to add truck")
    }
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${lang === "ar" ? "font-arabic" : ""}`}>
            {t("fleet")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {trucks.length} {lang === "ar" ? "شاحنة مسجلة" : "camions enregistres"}
          </p>
        </div>
        {user?.role === "CARRIER" && (
          <Button className="gap-2" onClick={() => setShowAddTruck(true)}>
            <Plus className="h-4 w-4" />
            {t("add_truck")}
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
        {filtered.map((truck) => {
          const cfg = statusConfig[truck.status]
          const StatusIcon = cfg.icon
          return (
            <div
              key={truck.id}
              className="rounded-xl border border-border bg-card p-5 hover:border-foreground/10 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                  <TruckIcon className="h-6 w-6" />
                </div>
              </div>
              <h4 className="font-bold text-lg tracking-tight font-mono">
                {truck.plateNumber}
              </h4>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <Badge variant="secondary" className={`text-xs ${cfg.class}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {t(truck.status.toLowerCase() as any)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {truck.carrierId?.slice(0, 6)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={showAddTruck} onOpenChange={setShowAddTruck}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("add_truck")}</DialogTitle>
          </DialogHeader>
          {addSuccess ? (
            <div className="flex flex-col items-center gap-4 py-8 animate-slide-up">
              <div className="h-16 w-16 rounded-full bg-foreground flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-background" />
              </div>
              <p className="font-bold">
                {lang === "ar" ? "تمت الإضافة بنجاح!" : "Camion ajoute !"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label>{t("truck_plate")}</Label>
                <Input
                  placeholder="A-XXXXX-MA"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                />
              </div>
              <Button onClick={handleAddTruck} className="w-full">
                {t("save")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
