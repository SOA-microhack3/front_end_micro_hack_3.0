"use client"

import { useEffect, useMemo, useState } from "react"
import { useI18n } from "@/lib/i18n"
import { getLogs } from "@/lib/api"
import type { AuditLog } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Search,
  Download,
  Bot,
  User,
  Server,
  Clock,
} from "lucide-react"

const actorIcon: Record<string, typeof User> = {
  USER: User,
  AI: Bot,
  SYSTEM: Server,
}

const actorStyle: Record<string, string> = {
  USER: "bg-accent text-foreground",
  AI: "bg-foreground text-background",
  SYSTEM: "bg-muted text-muted-foreground",
}

const actionStyle: Record<string, string> = {
  CREATED: "bg-foreground text-background",
  UPDATED: "bg-foreground/20 text-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
  CONFIRMED: "bg-foreground text-background",
  REJECTED: "bg-destructive/10 text-destructive",
  CHECKED_IN: "bg-foreground/10 text-foreground",
  SCANNED: "bg-foreground/20 text-foreground",
  EXPIRED: "bg-muted text-muted-foreground",
  REALLOCATED: "bg-foreground/20 text-foreground",
  SUGGESTED: "bg-accent text-foreground",
}

export function AuditLogsPage() {
  const { t, lang } = useI18n()
  const [searchQuery, setSearchQuery] = useState("")
  const [actorFilter, setActorFilter] = useState<string>("all")
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data = await getLogs()
        if (!mounted) return
        setLogs(data)
      } catch (err: any) {
        if (!mounted) return
        setError(err?.message || "Unable to load logs")
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesActor = actorFilter === "all" || log.actorType === actorFilter
      return matchesSearch && matchesActor
    })
  }, [logs, searchQuery, actorFilter])

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${lang === "ar" ? "font-arabic" : ""}`}>
            {t("audit_title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "ar"
              ? "سجل كامل لجميع الإجراءات في النظام"
              : "Historique complet de toutes les actions du systeme"}
          </p>
        </div>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          {t("export")}
        </Button>
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
        <div className="flex gap-2">
          {[
            "all",
            "USER",
            "AI",
            "SYSTEM",
          ].map((actor) => (
            <button
              key={actor}
              type="button"
              onClick={() => setActorFilter(actor)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                actorFilter === actor
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
              }`}
            >
              {actor === "all" ? t("all") : actor}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {logs.filter((l) => l.actorType === "USER").length}
            </p>
            <p className="text-xs text-muted-foreground">
              {lang === "ar" ? "إجراءات المستخدمين" : "Actions utilisateurs"}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground">
            <Bot className="h-5 w-5 text-background" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {logs.filter((l) => l.actorType === "AI").length}
            </p>
            <p className="text-xs text-muted-foreground">AI</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {logs.filter((l) => l.actorType === "SYSTEM").length}
            </p>
            <p className="text-xs text-muted-foreground">Systeme</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">
              {t("no_results")}
            </div>
          ) : (
            filtered.map((log) => {
              const Icon = actorIcon[log.actorType] || User
              return (
                <div
                  key={log.id}
                  className="p-5 flex flex-col gap-3 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          actorStyle[log.actorType] || "bg-accent"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{log.actorType}</p>
                        <p className="text-xs text-muted-foreground">{log.entityType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${actionStyle[log.action] || "bg-accent"}`}
                      >
                        {log.action}
                      </Badge>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{log.description}</div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
