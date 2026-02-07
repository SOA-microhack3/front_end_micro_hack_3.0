"use client"

import React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import { roleToPath } from "@/lib/role-routing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Anchor,
  ArrowRight,
  Eye,
  EyeOff,
  Globe,
  Shield,
} from "lucide-react"

export function LoginPage() {
  const { t, lang, setLang } = useI18n()
  const { login, user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("admin@portflow.ma")
  const [password, setPassword] = useState("demo123")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (authLoading) return
    if (isAuthenticated && user) {
      router.replace(roleToPath(user.role))
    }
  }, [isAuthenticated, user, router, authLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    try {
      await new Promise((r) => setTimeout(r, 800))
      const loggedInUser = await login(email, password)
      if (!loggedInUser) {
        setError("Invalid credentials")
        return
      }
      router.replace(roleToPath(loggedInUser.role))
    } catch (err: any) {
      setError(err?.message || "Connection error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden flex-col justify-between p-12">
        <div className="bg-grid-pattern absolute inset-0 opacity-[0.03]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10 backdrop-blur-sm">
              <Anchor className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary-foreground tracking-tight">
              PortFlow Elite
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-bold text-primary-foreground leading-tight tracking-tight text-balance">
            {lang === "ar"
              ? "نظام ذكي لإدارة الوصول إلى الموانئ"
              : "Controle d'Acces Portuaire Intelligent"}
          </h1>
          <p className="mt-6 text-lg text-primary-foreground/60 leading-relaxed">
            {lang === "ar"
              ? "إدارة الحجوزات، التحقق من البوابات، وتحسين حركة المرور في الموانئ باستخدام الذكاء الاصطناعي"
              : "Gerez les reservations, validez les acces portail, et optimisez le trafic portuaire avec l'intelligence artificielle."}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-primary-foreground">
              99.9%
            </span>
            <span className="text-sm text-primary-foreground/50">Uptime</span>
          </div>
          <div className="h-10 w-px bg-primary-foreground/10" />
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-primary-foreground">
              {"<"}2s
            </span>
            <span className="text-sm text-primary-foreground/50">
              {lang === "ar" ? "التحقق" : "Validation"}
            </span>
          </div>
          <div className="h-10 w-px bg-primary-foreground/10" />
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-primary-foreground">
              0
            </span>
            <span className="text-sm text-primary-foreground/50">
              {lang === "ar" ? "حجوزات مزدوجة" : "Overbooking"}
            </span>
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Language switcher */}
          <div className="flex justify-end mb-12">
            <button
              type="button"
              onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all"
            >
              <Globe className="h-4 w-4" />
              {lang === "fr" ? "العربية" : "Francais"}
            </button>
          </div>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Anchor className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              PortFlow Elite
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">
              {t("login_title")}
            </h2>
            <p className="mt-2 text-muted-foreground">{t("login_subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t("email")}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@portflow.ma"
                className="h-11"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t("password")}
                </Label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("forgot_password")}
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive animate-fade-in">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="h-11 w-full font-medium gap-2"
              disabled={isSubmitting || authLoading}
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {t("sign_in")}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium">
              {lang === "ar" ? "حسابات تجريبية" : "Comptes Demo"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: "Admin", email: "admin@portflow.ma" },
                { role: "Operator", email: "operator@portflow.ma" },
                { role: "Carrier", email: "carrier@portflow.ma" },
                { role: "Driver", email: "driver@portflow.ma" },
              ].map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => setEmail(account.email)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent hover:border-foreground/10 transition-all text-left"
                >
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{account.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
