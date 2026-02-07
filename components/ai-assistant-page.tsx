"use client"

import { useState, useRef, useEffect } from "react"
import { useI18n } from "@/lib/i18n"
import { chatWithAi, getCarrierMe, getTrucks } from "@/lib/api"
import type { Truck } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { AIInput } from "@/components/ui/ai-input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Bot,
  User,
  Sparkles,
  CheckCircle2,
  Clock,
  Truck as TruckIcon,
} from "lucide-react"

interface Message {
  id: string
  role: "user" | "ai"
  content: string
  timestamp: Date
  action?: { type: "book"; terminal: string; slot: string; available: number }
}

export function AIAssistantPage() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "greeting",
      role: "ai",
      content: t("ai_greeting"),
      timestamp: new Date(),
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingAction, setBookingAction] = useState<Message["action"]>(undefined)
  const [selectedTrucks, setSelectedTrucks] = useState<string[]>([])
  const [bookingComplete, setBookingComplete] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isTyping])

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return
    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: messageText.trim(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsTyping(true)

    try {
      const res = await chatWithAi(userMsg.content)
      const aiMsg: Message = {
        id: `msg_${Date.now()}_ai`,
        role: "ai",
        content: res.response || (lang === "ar" ? "لا يوجد رد." : "Aucune reponse."),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err: any) {
      const aiMsg: Message = {
        id: `msg_${Date.now()}_ai`,
        role: "ai",
        content:
          err?.message ||
          (lang === "ar"
            ? "خدمة الذكاء الاصطناعي غير متاحة حاليا."
            : "Le service IA est indisponible pour le moment."),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSend = async (messageText: string) => {
    if (!messageText.trim()) return
    if (isTyping) return
    await sendMessage(messageText)
  }

  const handleBookAction = (action: Message["action"]) => {
    setBookingAction(action)
    setSelectedTrucks([])
    setBookingComplete(false)
    setShowBookingModal(true)
  }

  const handleConfirmBooking = () => {
    setBookingComplete(true)
    setTimeout(() => {
      setShowBookingModal(false)
      const confirmMsg: Message = {
        id: `msg_${Date.now()}_confirm`,
        role: "ai",
        content: lang === "ar"
          ? `تم بنجاح! تم حجز ${selectedTrucks.length} شاحنة في ${bookingAction?.terminal} للفترة ${bookingAction?.slot}. تم إنشاء رموز QR.`
          : `Fait ! ${selectedTrucks.length} camion(s) reserve(s) au ${bookingAction?.terminal} pour le creneau ${bookingAction?.slot}. Les codes QR ont ete generes.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, confirmMsg])
    }, 1500)
  }

  const suggestions = [t("ai_suggestion_1"), t("ai_suggestion_2"), t("ai_suggestion_3")]
  const availableTrucks = trucks.filter((t) => t.status === "ACTIVE")

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        if (user?.role === "CARRIER") {
          const carrier = await getCarrierMe()
          const list = await getTrucks(carrier.id)
          if (!mounted) return
          setTrucks(list)
          return
        }
        const list = await getTrucks()
        if (!mounted) return
        setTrucks(list)
      } catch {
        if (!mounted) return
        setTrucks([])
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [user])

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-[900px] mx-auto">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${lang === "ar" ? "font-arabic" : ""}`}>
              {t("ai_title")}
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              {lang === "ar" ? "مدعوم بالذكاء الاصطناعي" : "Propulse par l'IA"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 animate-slide-up ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${
              msg.role === "ai" ? "bg-primary text-primary-foreground" : "bg-accent"
            }`}>
              {msg.role === "ai" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className={`flex flex-col gap-2 max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-accent text-foreground rounded-tl-sm"
              }`}>
                {msg.content.split("\n").map((line, i) => (
                  <p key={`${msg.id}-line-${i}`} className={i > 0 ? "mt-1.5" : ""}>
                    {line}
                  </p>
                ))}
              </div>
              {msg.action && (
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => handleBookAction(msg.action)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("book_now")}
                </Button>
              )}
              <span className="text-[10px] text-muted-foreground">
                {msg.timestamp.toLocaleTimeString(lang === "ar" ? "ar-MA" : "fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 animate-fade-in">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-accent rounded-xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:0ms]" />
              <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:150ms]" />
              <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {/* Suggestions - only show at beginning */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  sendMessage(suggestion)
                }}
                className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 hover:bg-accent transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 pt-0">
        <AIInput
          placeholder={t("ai_placeholder")}
          onSubmit={handleSend}
          className={isTyping ? "opacity-80 pointer-events-none" : ""}
        />
      </div>

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {lang === "ar" ? "حجز الشاحنات" : "Reserver des Camions"}
            </DialogTitle>
          </DialogHeader>

          {bookingComplete ? (
            <div className="flex flex-col items-center gap-4 py-8 animate-slide-up">
              <div className="h-16 w-16 rounded-full bg-foreground flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-background" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">
                  {lang === "ar" ? "تم الحجز بنجاح!" : "Reservation confirmee !"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedTrucks.length} {lang === "ar" ? "شاحنات" : "camion(s)"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              {/* Slot info */}
              <div className="p-4 rounded-lg bg-accent flex items-center gap-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{bookingAction?.terminal}</p>
                  <p className="text-xs text-muted-foreground">{bookingAction?.slot} &middot; {bookingAction?.available} {t("available")}</p>
                </div>
              </div>

              {/* Truck selection */}
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                {availableTrucks.map((truck) => (
                  <button
                    key={truck.id}
                    type="button"
                    onClick={() =>
                      setSelectedTrucks((prev) =>
                        prev.includes(truck.id) ? prev.filter((id) => id !== truck.id) : [...prev, truck.id]
                      )
                    }
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      selectedTrucks.includes(truck.id)
                        ? "border-foreground bg-accent"
                        : "border-border hover:border-foreground/20"
                    }`}
                  >
                    <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selectedTrucks.includes(truck.id) ? "border-foreground bg-foreground" : "border-muted-foreground/30"
                    }`}>
                      {selectedTrucks.includes(truck.id) && <CheckCircle2 className="h-3 w-3 text-background" />}
                    </div>
                    <TruckIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{truck.plateNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {truck.id.slice(0, 6)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <Button onClick={handleConfirmBooking} disabled={selectedTrucks.length === 0} className="w-full">
                {lang === "ar"
                  ? `تأكيد حجز ${selectedTrucks.length} شاحنة`
                  : `Confirmer ${selectedTrucks.length} reservation(s)`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
