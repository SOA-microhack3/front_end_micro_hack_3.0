"use client"

import { useState, useEffect } from "react"
import { CornerRightUp, Mic } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { cn } from "@/lib/utils"

interface AIInputProps {
  id?: string
  placeholder?: string
  minHeight?: number
  maxHeight?: number
  onSubmit?: (value: string) => void
  className?: string
}

export function AIInput({
  id = "ai-input",
  placeholder = "Type your message...",
  minHeight = 52,
  maxHeight = 200,
  onSubmit,
  className,
}: AIInputProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  })
  const [inputValue, setInputValue] = useState("")

  const {
    isListening,
    startListening,
    voiceText,
    setVoiceText,
    isSupported,
    error,
    lang,
    toggleLang,
  } = useSpeechRecognition()

  useEffect(() => {
    if (!voiceText) return
    setInputValue((prev) => (prev ? `${prev} ${voiceText}` : voiceText))
    setVoiceText("")
    setTimeout(() => adjustHeight(), 0)
  }, [voiceText, setVoiceText, adjustHeight])

  const handleSubmit = () => {
    if (!inputValue.trim()) return
    onSubmit?.(inputValue)
    setInputValue("")
    adjustHeight(true)
  }

  const getPlaceholder = () => {
    if (isListening) {
      switch (lang) {
        case "ar-DZ":
          return "الاستماع..."
        case "fr-FR":
          return "Écoute en cours..."
        case "en-US":
          return "Listening..."
        default:
          return "Listening..."
      }
    }
    return placeholder
  }

  const getLangLabel = () => {
    switch (lang) {
      case "ar-DZ":
        return "DZ"
      case "fr-FR":
        return "FR"
      case "en-US":
        return "EN"
      default:
        return "DZ"
    }
  }

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative max-w-2xl w-full mx-auto">
        <div className="relative rounded-3xl border border-border/60 bg-card/90 shadow-sm backdrop-blur px-2 py-2">
          <Textarea
            id={id}
            dir={lang === "ar-DZ" ? "rtl" : "ltr"}
            placeholder={getPlaceholder()}
            className={cn(
              "w-full bg-transparent rounded-2xl pl-5 pr-28",
              "placeholder:text-muted-foreground",
              "border-none resize-none overflow-y-auto",
              "focus-visible:ring-0",
              "text-foreground leading-[1.3] py-[14px]",
              "[&::-webkit-resizer]:hidden",
              lang === "ar-DZ" && inputValue.length > 0 ? "text-right" : "text-left"
            )}
            style={{ minHeight, maxHeight }}
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              adjustHeight()
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />

          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 transition-all duration-200 flex items-center gap-1",
              inputValue ? "right-12" : "right-3"
            )}
          >
            <button
              type="button"
              onClick={toggleLang}
              className="text-[10px] font-bold h-6 w-8 rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground/70 uppercase flex items-center justify-center border border-foreground/5 transition-colors"
              title={`Current language: ${lang}. Click to switch.`}
            >
              {getLangLabel()}
            </button>

            <button
              type="button"
              onClick={startListening}
              disabled={!isSupported || isListening}
              className={cn(
                "rounded-full p-2 transition-all duration-200 flex items-center justify-center",
                isListening
                  ? "bg-destructive/10 text-destructive animate-pulse"
                  : "hover:bg-foreground/10 text-foreground/60",
                !isSupported && "opacity-50 cursor-not-allowed"
              )}
              title={
                !isSupported
                  ? "Speech recognition not supported in your browser"
                  : "Start voice input"
              }
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleSubmit}
            type="button"
            className={cn(
              "absolute top-1/2 -translate-y-1/2 right-3 rounded-xl bg-foreground text-background p-2 shadow-sm transition-all duration-200",
              inputValue
                ? "opacity-100 scale-100 animate-fade-scale"
                : "opacity-0 scale-95 pointer-events-none"
            )}
            title="Send message"
          >
            <CornerRightUp className="w-4 h-4" />
          </button>
        </div>
        {(error || !isSupported) && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            {error || "Speech recognition is not supported in this browser."}
          </p>
        )}
      </div>
    </div>
  )
}
