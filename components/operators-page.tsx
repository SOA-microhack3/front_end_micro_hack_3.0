"use client"

import { useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n"
import { createOperator, getOperators, getPorts, getTerminals, registerUser } from "@/lib/api"
import type { Operator, Port, Terminal } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  User,
  Mail,
  Lock,
  CheckCircle2,
  DoorOpen,
} from "lucide-react"

export function OperatorsPage() {
  const { t, lang } = useI18n()
  const [operators, setOperators] = useState<Operator[]>([])
  const [ports, setPorts] = useState<Port[]>([])
  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [portId, setPortId] = useState("")
  const [terminalId, setTerminalId] = useState("")

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [ops, portsData, terminalsData] = await Promise.all([
          getOperators(),
          getPorts(),
          getTerminals(),
        ])
        if (!mounted) return
        setOperators(ops)
        setPorts(portsData)
        setTerminals(terminalsData)
        if (portsData.length > 0) setPortId(portsData[0].id)
        if (terminalsData.length > 0) setTerminalId(terminalsData[0].id)
      } catch (err: any) {
        if (!mounted) return
        setError(err?.message || "Unable to load operators")
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const handleCreate = async () => {
    if (!fullName || !email || !password || !portId || !terminalId) return
    try {
      const auth = await registerUser({
        fullName,
        email,
        password,
        role: "OPERATOR",
      })
      await createOperator({ userId: auth.user.id, portId, terminalId })
      const refreshed = await getOperators()
      setOperators(refreshed)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setShowAdd(false)
        setFullName("")
        setEmail("")
        setPassword("")
      }, 1500)
    } catch (err: any) {
      setError(err?.message || "Unable to create operator")
    }
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${lang === "ar" ? "font-arabic" : ""}`}>
            {lang === "ar" ? "المشغلون" : "Operators"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "ar" ? "إدارة مشغلي البوابة" : "Gestion des operateurs"}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          {lang === "ar" ? "إضافة مشغل" : "Ajouter un operateur"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {operators.map((operator) => (
          <div
            key={operator.id}
            className="rounded-xl border border-border bg-card p-5 hover:border-foreground/10 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                <DoorOpen className="h-6 w-6" />
              </div>
              <Badge variant="secondary" className="text-xs">
                {operator.status}
              </Badge>
            </div>
            <h4 className="font-bold text-lg">{operator.id.slice(0, 6)}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {operator.terminalId.slice(0, 6)}
            </p>
          </div>
        ))}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "إضافة مشغل" : "Ajouter un operateur"}</DialogTitle>
          </DialogHeader>
          {success ? (
            <div className="flex flex-col items-center gap-4 py-8 animate-slide-up">
              <div className="h-16 w-16 rounded-full bg-foreground flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-background" />
              </div>
              <p className="font-bold">
                {lang === "ar" ? "تمت الإضافة بنجاح!" : "Operateur ajoute !"}
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
                    placeholder="Youssef Tazi"
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
                    placeholder="operator@company.com"
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
              <div className="flex flex-col gap-2">
                <Label>{t("ports")}</Label>
                <Select value={portId} onValueChange={setPortId}>
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
                <Label>{t("terminals")}</Label>
                <Select value={terminalId} onValueChange={setTerminalId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("terminals")} />
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

