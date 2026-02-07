"use client"

import { useEffect, useMemo, useState } from "react"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import { getAvailability, getTerminals, getOperatorMe } from "@/lib/api"
import type { Terminal } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Clock, AlertCircle } from "lucide-react"

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })

export function SlotsPage() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [selectedTerminal, setSelectedTerminal] = useState("")
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [slots, setSlots] = useState<any[]>([])
  const [maxCapacity, setMaxCapacity] = useState<number>(0)
  const [operatorTerminalId, setOperatorTerminalId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const loadTerminals = async () => {
      try {
        // For operators, fetch their assigned terminal
        if (user?.role === 'OPERATOR') {
          const operator = await getOperatorMe()
          if (!mounted) return
          if (operator?.terminalId) {
            setOperatorTerminalId(operator.terminalId)
            const list = await getTerminals()
            const operatorTerminal = list.filter(t => t.id === operator.terminalId)
            setTerminals(operatorTerminal)
            if (operatorTerminal.length > 0) setSelectedTerminal(operatorTerminal[0].id)
          }
        } else {
          const list = await getTerminals()
          if (!mounted) return
          setTerminals(list)
          if (list.length > 0) setSelectedTerminal(list[0].id)
        }
      } catch {
        if (!mounted) return
        setTerminals([])
      }
    }
    loadTerminals()
    return () => {
      mounted = false
    }
  }, [user])

  useEffect(() => {
    let mounted = true
    const loadAvailability = async () => {
      if (!selectedTerminal) return
      try {
        const data = await getAvailability(selectedTerminal, selectedDate)
        if (!mounted) return
        setSlots(data.slots || [])
        setMaxCapacity(data.maxCapacity || 0)
      } catch {
        if (!mounted) return
        setSlots([])
        setMaxCapacity(0)
      }
    }
    loadAvailability()
    return () => {
      mounted = false
    }
  }, [selectedTerminal, selectedDate])

  const totalBooked = useMemo(
    () => slots.reduce((sum, s) => sum + (s.bookedCount || 0), 0),
    [slots]
  )
  const totalAvailable = useMemo(
    () => slots.reduce((sum, s) => sum + (s.availableCount || 0), 0),
    [slots]
  )

  const getStatusLabel = (slot: any) => {
    const pct = maxCapacity ? (slot.bookedCount / maxCapacity) * 100 : 0
    if (pct >= 95)
      return {
        label: lang === "ar" ? "ممتلئ تقريبا" : "Presque plein",
        class: "bg-foreground text-background",
      }
    if (pct >= 70)
      return {
        label: lang === "ar" ? "مرتفع" : "Eleve",
        class: "bg-foreground/20 text-foreground",
      }
    return {
      label: lang === "ar" ? "متاح" : "Disponible",
      class: "bg-accent text-foreground",
    }
  }

  const terminal = terminals.find((t) => t.id === selectedTerminal)
  const isToday = selectedDate === new Date().toISOString().slice(0, 10)

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            className={`text-2xl font-bold tracking-tight ${lang === "ar" ? "font-arabic" : ""}`}
          >
            {t("slot_availability")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {terminal?.name}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={selectedTerminal} onValueChange={setSelectedTerminal}>
            <SelectTrigger className="h-11 w-full sm:w-56 rounded-xl">
              <SelectValue placeholder={t("select_terminal")} />
            </SelectTrigger>
            <SelectContent>
              {terminals.map((term) => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl bg-transparent"
              onClick={() => {
                const date = new Date(selectedDate)
                date.setDate(date.getDate() - 1)
                setSelectedDate(date.toISOString().slice(0, 10))
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[140px] text-center">
              <p className="text-sm font-medium">{selectedDate}</p>
            </div>
            {!isToday && (
              <Button
                variant="outline"
                className="h-10 px-4 text-sm rounded-xl bg-transparent"
                onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
              >
                {t("today")}
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl bg-transparent"
              onClick={() => {
                const date = new Date(selectedDate)
                date.setDate(date.getDate() + 1)
                setSelectedDate(date.toISOString().slice(0, 10))
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">{t("capacity")}</p>
          <p className="text-3xl font-bold mt-1">{maxCapacity}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {lang === "ar" ? "لكل فترة" : "par creneau"}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">{t("booked")}</p>
          <p className="text-3xl font-bold mt-1">{totalBooked}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {lang === "ar" ? "إجمالي اليوم" : "total aujourd'hui"}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">{t("available")}</p>
          <p className="text-3xl font-bold mt-1">{totalAvailable}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {lang === "ar" ? "أماكن متبقية" : "places restantes"}
          </p>
        </div>
      </div>

      {slots.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card p-10 text-center text-sm text-muted-foreground">
          {lang === "ar" ? "No slots available" : "No slots available"}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {slots.map((slot) => {
            const pct = maxCapacity
              ? Math.round((slot.bookedCount / maxCapacity) * 100)
              : 0
            const statusInfo = getStatusLabel(slot)

            return (
              <div
                key={slot.slotStart}
                className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">
                        {formatTime(slot.slotStart)} - {formatTime(slot.slotEnd)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lang === "ar" ? "Creneau" : "Creneau"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] font-medium ${statusInfo.class}`}
                  >
                    {statusInfo.label}
                  </Badge>
                </div>

                <div className="h-2 rounded-full bg-muted/50 overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 via-sky-400 to-blue-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {slot.bookedCount}/{maxCapacity} {t("booked")}
                  </span>
                  <span className="font-semibold text-foreground">
                    {slot.availableCount} {t("available")}
                  </span>
                </div>

                {pct >= 90 && (
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                    <AlertCircle className="h-3 w-3" />
                    {lang === "ar"
                      ? "Capacite proche du maximum"
                      : "Capacite proche du maximum"}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
