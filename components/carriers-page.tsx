"use client"

import { useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n"
import { createCarrier, getCarriers, registerUser } from "@/lib/api"
import type { Carrier } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Building,
  Mail,
  Lock,
  User,
  CheckCircle2,
} from "lucide-react"

export function CarriersPage() {
  const { t, lang } = useI18n()
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const [companyName, setCompanyName] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const list = await getCarriers()
        if (!mounted) return
        setCarriers(list)
      } catch (err: any) {
        if (!mounted) return
        setError(err?.message || "Unable to load carriers")
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const handleCreate = async () => {
    if (!companyName || !fullName || !email || !password) return
    try {
      const auth = await registerUser({
        fullName,
        email,
        password,
        role: "CARRIER",
      })
      await createCarrier({ name: companyName, userId: auth.user.id })
      const refreshed = await getCarriers()
      setCarriers(refreshed)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setShowAdd(false)
        setCompanyName("")
        setFullName("")
        setEmail("")
        setPassword("")
      }, 1500)
    } catch (err: any) {
      setError(err?.message || "Unable to create carrier")
    }
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${lang === "ar" ? "font-arabic" : ""}`}>
            {lang === "ar" ? "الناقلون" : "Carriers"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "ar" ? "إدارة شركات النقل" : "Gestion des transporteurs"}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          {lang === "ar" ? "إضافة ناقل" : "Ajouter un carrier"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {carriers.map((carrier) => (
          <div
            key={carrier.id}
            className="rounded-xl border border-border bg-card p-5 hover:border-foreground/10 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                <Building className="h-6 w-6" />
              </div>
              <Badge variant="secondary" className="text-xs">
                {carrier.id.slice(0, 6)}
              </Badge>
            </div>
            <h4 className="font-bold text-lg">{carrier.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {carrier.userId}
            </p>
          </div>
        ))}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "إضافة ناقل" : "Ajouter un carrier"}</DialogTitle>
          </DialogHeader>
          {success ? (
            <div className="flex flex-col items-center gap-4 py-8 animate-slide-up">
              <div className="h-16 w-16 rounded-full bg-foreground flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-background" />
              </div>
              <p className="font-bold">
                {lang === "ar" ? "تمت الإضافة بنجاح!" : "Carrier ajoute !"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label>{lang === "ar" ? "اسم الشركة" : "Nom de la societe"}</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="TransMag Logistics"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{lang === "ar" ? "الاسم الكامل" : "Nom complet"}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Karim Fassi"
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
                    placeholder="carrier@company.com"
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

