"use client"

import { useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n"
import { createTerminal, getPorts, getTerminals } from "@/lib/api"
import type { Port, Terminal } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, MapPin, Plus, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function TerminalsPage() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const [ports, setPorts] = useState<Port[]>([])
  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [showAddTerminal, setShowAddTerminal] = useState(false)
  const [terminalName, setTerminalName] = useState("")
  const [terminalPort, setTerminalPort] = useState("")
  const [terminalCapacity, setTerminalCapacity] = useState("50")
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [portsData, terminalsData] = await Promise.all([
          getPorts(),
          getTerminals(),
        ])
        if (!mounted) return
        setPorts(portsData)
        setTerminals(terminalsData)
        if (portsData.length > 0) setTerminalPort(portsData[0].id)
      } catch (err: any) {
        if (!mounted) return
        setError(err?.message || "Unable to load terminals")
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const handleCreate = async () => {
    if (!terminalName || !terminalPort) return
    try {
      await createTerminal({
        name: terminalName,
        portId: terminalPort,
        maxCapacity: Number(terminalCapacity),
      })
      const refreshed = await getTerminals()
      setTerminals(refreshed)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setShowAddTerminal(false)
        setTerminalName("")
      }, 1500)
    } catch (err: any) {
      setError(err?.message || "Unable to create terminal")
    }
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${lang === "ar" ? "font-arabic" : ""}`}>
            {t("terminals")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "ar"
              ? "إدارة ومراقبة محطات الميناء"
              : "Gestion et surveillance des terminaux portuaires"}
          </p>
        </div>
        {user?.role === "ADMIN" && (
          <Button className="gap-2" onClick={() => setShowAddTerminal(true)}>
            <Plus className="h-4 w-4" />
            {lang === "ar" ? "إضافة محطة" : "Ajouter un terminal"}
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {ports.map((port) => {
        const portTerminals = terminals.filter((t) => t.portId === port.id)
        return (
          <div key={port.id} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <MapPin className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold">{port.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {port.countryCode || ""} &middot; {port.slotDuration || 60}min/{
                    lang === "ar" ? "فترة" : "creneau"
                  }
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portTerminals.map((terminal) => (
                <div
                  key={terminal.id}
                  className="rounded-xl border border-border bg-card p-5 hover:border-foreground/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold">{terminal.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {terminal.id.slice(0, 6)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-foreground text-background">
                      {terminal.maxCapacity}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t("capacity")}</span>
                    <span className="font-medium text-foreground">
                      {terminal.maxCapacity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <Dialog open={showAddTerminal} onOpenChange={setShowAddTerminal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "إضافة محطة" : "Ajouter un terminal"}</DialogTitle>
          </DialogHeader>
          {success ? (
            <div className="flex flex-col items-center gap-4 py-8 animate-slide-up">
              <div className="h-16 w-16 rounded-full bg-foreground flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-background" />
              </div>
              <p className="font-bold">
                {lang === "ar" ? "تمت الإضافة بنجاح!" : "Terminal ajoute !"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label>{lang === "ar" ? "اسم المحطة" : "Nom du terminal"}</Label>
                <Input
                  placeholder="Terminal A"
                  value={terminalName}
                  onChange={(e) => setTerminalName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("ports")}</Label>
                <Select value={terminalPort} onValueChange={setTerminalPort}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("ports")} />
                  </SelectTrigger>
                  <SelectContent>
                    {ports.map((port) => (
                      <SelectItem key={port.id} value={port.id}>
                        {port.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("capacity")}</Label>
                <Input
                  type="number"
                  min={1}
                  value={terminalCapacity}
                  onChange={(e) => setTerminalCapacity(e.target.value)}
                />
              </div>
              <Button onClick={handleCreate} className="w-full">
                {t("save")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
