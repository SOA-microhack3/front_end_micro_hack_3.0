import { useState, useEffect, useCallback, useRef } from "react"

type SpeechLang = "ar-DZ" | "fr-FR" | "en-US"

type SpeechRecognitionCtor = new () => any

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [voiceText, setVoiceText] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState("")
  const [lang, setLang] = useState<SpeechLang>("ar-DZ")

  const recognitionRef = useRef<any | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
    }
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported || typeof window === "undefined") return
    if (
      !window.isSecureContext &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      setError("Speech recognition requires HTTPS")
      return
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("No internet connection")
      return
    }
    const SpeechRecognition =
      ((window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition) as SpeechRecognitionCtor | undefined

    if (!SpeechRecognition) return

    setError("")
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = lang

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setVoiceText(transcript)
    }

    recognition.onend = () => setIsListening(false)
    recognition.onerror = (event: any) => {
      const code = event?.error
      if (code === "network") {
        setError("Speech service not reachable. Check internet and HTTPS.")
      } else if (code === "not-allowed") {
        setError("Microphone permission denied")
      } else if (code === "no-speech") {
        setError("No speech detected")
      } else {
        setError("Speech recognition error")
      }
      console.error("Speech Error:", event.error)
      setIsListening(false)
    }

    recognition.start()
  }, [isSupported, lang])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      switch (prev) {
        case "ar-DZ":
          return "fr-FR"
        case "fr-FR":
          return "en-US"
        case "en-US":
          return "ar-DZ"
        default:
          return "ar-DZ"
      }
    })
  }, [])

  return {
    isListening,
    startListening,
    stopListening,
    voiceText,
    setVoiceText,
    isSupported,
    error,
    lang,
    setLang,
    toggleLang,
  }
}
