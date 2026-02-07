"use client"

import { useState } from "react"
import { useI18n } from "@/lib/i18n"
import { scanQr } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { QRScanner } from "@/components/qr-scanner"
import {
  QrCode,
  ShieldCheck,
  ShieldX,
  Truck,
  Clock,
  Building2,
  ArrowRight,
  RotateCcw,
  Scan,
} from "lucide-react"

type GateStatus = "idle" | "scanning" | "success" | "error"

interface ValidationResult {
  booking_id: string
  truck: string
  terminal: string
  slot: string
  status: string
}

export function GatePage() {
  const { t, lang } = useI18n()
  const [qrInput, setQrInput] = useState("")
  const [gateStatus, setGateStatus] = useState<GateStatus>("idle")
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [recentEntries, setRecentEntries] = useState<ValidationResult[]>([])
  const [errorMessage, setErrorMessage] = useState("")

  const handleValidate = async (token?: string) => {
    const payload = typeof token === "string" ? token : qrInput
    if (typeof payload !== "string" || !payload.trim()) return
    setGateStatus("scanning")
    setErrorMessage("")

    try {
      const res = await scanQr(payload.trim())
      if (res.valid && res.booking) {
        const validationResult: ValidationResult = {
          booking_id: res.booking.id,
          truck: res.booking.truckPlate,
          terminal: res.booking.terminalName,
          slot: `${new Date(res.booking.slotStart).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}`,
          status: "CONSUMED",
        }
        setResult(validationResult)
        setRecentEntries((prev) => [validationResult, ...prev].slice(0, 10))
        setGateStatus("success")
      } else {
        setResult(null)
        setErrorMessage(res.message || "")
        setGateStatus("error")
      }
    } catch {
      setResult(null)
      setErrorMessage(lang === "ar" ? "تعذر التحقق من الرمز" : "Verification impossible")
      setGateStatus("error")
    }
  }

  const handleReset = () => {
    setQrInput("")
    setGateStatus("idle")
    setResult(null)
    setErrorMessage("")
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                  <QrCode className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h2
                    className={`text-xl font-bold tracking-tight ${lang === "ar" ? "font-arabic" : ""}`}
                  >
                    {t("gate_title")}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {t("gate_subtitle")}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              {gateStatus === "idle" && (
                <div className="flex flex-col items-center gap-6 animate-fade-in">
                  <div className="relative w-64 h-48">
                    <div className="absolute inset-x-0 top-0 h-4 bg-foreground rounded-t-lg" />
                    <div className="absolute left-0 top-4 bottom-0 w-4 bg-foreground" />
                    <div className="absolute right-0 top-4 bottom-0 w-4 bg-foreground" />
                    <div className="absolute inset-x-4 top-4 bottom-0 border-2 border-dashed border-foreground/20 flex items-center justify-center">
                      <Scan className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  </div>

                  <QRScanner
                    autoStart
                    onResult={(value) => {
                      setQrInput(value)
                      handleValidate(value)
                    }}
                  />

                  <div className="w-full max-w-md flex flex-col gap-3">
                    <div className="relative">
                      <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={qrInput}
                        onChange={(e) => setQrInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleValidate()}
                        placeholder={t("enter_qr")}
                        className="pl-10 h-12 text-center font-mono text-sm"
                      />
                    </div>
                    <Button
                      onClick={() => handleValidate()}
                      disabled={!qrInput.trim()}
                      className="h-12 gap-2 text-sm font-medium"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {t("validate")}
                    </Button>
                  </div>
                </div>
              )}

              {gateStatus === "scanning" && (
                <div className="flex flex-col items-center gap-6 py-8 animate-fade-in">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-foreground/20 rounded-xl" />
                    <div className="absolute inset-2 border-2 border-foreground/40 rounded-lg animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Scan className="h-8 w-8 text-foreground animate-pulse" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {lang === "ar"
                      ? "جار التحقق من الرمز..."
                      : "Verification en cours..."}
                  </p>
                </div>
              )}

              {gateStatus === "success" && result && (
                <div className="flex flex-col items-center gap-6 py-4 animate-slide-up">
                  <div className="relative w-64 h-48">
                    <div className="absolute inset-x-0 top-0 h-4 bg-foreground rounded-t-lg" />
                    <div className="absolute left-0 top-4 bottom-0 w-4 bg-foreground" />
                    <div className="absolute right-0 top-4 bottom-0 w-4 bg-foreground" />
                    <div className="absolute inset-x-4 top-4 h-[calc(100%-16px)] bg-foreground/5 animate-gate-open origin-top" />
                    <div className="absolute inset-x-4 bottom-0 flex items-center justify-center">
                      <ShieldCheck className="h-16 w-16 text-foreground" />
                    </div>
                  </div>

                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-foreground">
                      {t("gate_opened")}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("gate_success_msg")}
                    </p>
                  </div>

                  <div className="w-full max-w-sm grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-accent">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {t("booking_truck")}
                        </span>
                      </div>
                      <p className="text-sm font-bold">{result.truck}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {t("booking_terminal")}
                        </span>
                      </div>
                      <p className="text-sm font-bold">{result.terminal}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {t("booking_slot")}
                        </span>
                      </div>
                      <p className="text-sm font-bold">{result.slot}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent">
                      <div className="flex items-center gap-2 mb-1">
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {t("status")}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs bg-foreground text-background">
                        {t("consumed")}
                      </Badge>
                    </div>
                  </div>

                  <Button variant="outline" onClick={handleReset} className="gap-2 bg-transparent">
                    <RotateCcw className="h-4 w-4" />
                    {lang === "ar" ? "مسح جديد" : "Nouveau scan"}
                  </Button>
                </div>
              )}

              {gateStatus === "error" && (
                <div className="flex flex-col items-center gap-6 py-8 animate-slide-up">
                  <div className="h-20 w-20 rounded-full border-4 border-foreground/20 flex items-center justify-center">
                    <ShieldX className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-foreground">
                      {t("gate_denied")}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {errorMessage || t("gate_error_msg")}
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleReset} className="gap-2 bg-transparent">
                    <RotateCcw className="h-4 w-4" />
                    {lang === "ar" ? "إعادة المحاولة" : "Reessayer"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold">{t("recent_activity")}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {lang === "ar" ? "أحدث الدخول" : "Dernieres entrees"}
              </p>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {recentEntries.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("no_results")}
                </p>
              )}
              {recentEntries.map((entry) => (
                <div
                  key={entry.booking_id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div>
                    <p className="text-sm font-semibold">{entry.truck}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.terminal} • {entry.slot}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs bg-foreground text-background">
                    {t("consumed")}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
