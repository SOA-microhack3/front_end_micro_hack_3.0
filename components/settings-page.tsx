"use client"

import { useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  User,
  Globe,
  Shield,
  Bell,
  Database,
  Server,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react"

export function SettingsPage() {
  const { t, lang, setLang } = useI18n()
  const { user, updateProfile } = useAuth()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const isAdmin = user?.role === "ADMIN"

  useEffect(() => {
    if (!user) return
    setFullName(user.fullName || "")
    setEmail(user.email || "")
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    setSaveError("")
    setSaveSuccess(false)
    try {
      await updateProfile({ fullName, email })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 1500)
    } catch (err: any) {
      setSaveError(err?.message || "Unable to update profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[900px] mx-auto">
      {/* Header */}
      <div>
        <h2
          className={`text-2xl font-bold tracking-tight ${lang === "ar" ? "font-arabic" : ""}`}
        >
          {t("settings")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === "ar"
            ? "إدارة إعدادات حسابك والنظام"
            : "Gerez les parametres de votre compte et du systeme"}
        </p>
      </div>

      {/* Profile */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <User className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">{t("profile")}</h3>
        </div>
        <div className="p-5 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
              {user?.fullName
                ?.split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <p className="text-lg font-bold">{user?.fullName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge variant="secondary" className="mt-1 text-xs bg-foreground text-background">
                {user?.role}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>{lang === "ar" ? "الاسم الكامل" : "Nom complet"}</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("email")}</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
          </div>
          {saveError && (
            <p className="text-sm text-destructive">{saveError}</p>
          )}
          <div className="flex items-center gap-3">
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? t("loading") : t("save")}
            </Button>
            {saveSuccess && (
              <span className="text-xs text-muted-foreground">
                {lang === "ar" ? "تم الحفظ" : "Enregistre"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Language & Display */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">{t("language")}</h3>
        </div>
        <div className="p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label>{t("language")}</Label>
            <Select value={lang} onValueChange={(v) => setLang(v as "fr" | "ar")}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">{t("french")} (FR)</SelectItem>
                <SelectItem value="ar">{t("arabic")} (AR)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {lang === "ar"
                ? "سيتم تطبيق اتجاه RTL تلقائيا"
                : "La direction RTL sera appliquee automatiquement"}
            </p>
          </div>
        </div>
      </div>


      {/* Notifications */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">{t("notifications")}</h3>
        </div>
        <div className="p-5 flex flex-col gap-3">
          {[
            { label: lang === "ar" ? "تنبيهات الحجز" : "Alertes reservations", enabled: true },
            { label: lang === "ar" ? "إشعارات البوابة" : "Notifications portail", enabled: true },
            { label: lang === "ar" ? "تحذيرات السعة" : "Alertes capacite", enabled: true },
            { label: lang === "ar" ? "اقتراحات الذكاء الاصطناعي" : "Suggestions IA", enabled: false },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-foreground/10 transition-colors"
            >
              <span className="text-sm">{item.label}</span>
              <div
                className={`h-6 w-11 rounded-full relative cursor-pointer transition-colors ${item.enabled ? "bg-foreground" : "bg-muted"
                  }`}
              >
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full transition-all ${item.enabled
                      ? "left-[22px] bg-background"
                      : "left-0.5 bg-muted-foreground"
                    }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Save */}
      <div className="flex justify-end">
        <Button className="px-8">{t("save")}</Button>
      </div>
    </div>
  )
}
