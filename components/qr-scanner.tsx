"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserQRCodeReader } from "@zxing/browser"
import { Button } from "@/components/ui/button"
import { Camera, X } from "lucide-react"

interface QRScannerProps {
  onResult: (value: string) => void
  autoStart?: boolean
}

export function QRScanner({ onResult, autoStart = false }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState("")
  const streamRef = useRef<MediaStream | null>(null)
  const readerRef = useRef<BrowserQRCodeReader | null>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const didScanRef = useRef(false)

  useEffect(() => {
    if (autoStart) {
      setActive(true)
    }
  }, [autoStart])

  useEffect(() => {
    if (!active) return
    let isMounted = true

    const stop = () => {
      controlsRef.current?.stop?.()
      controlsRef.current = null
      readerRef.current = null
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    const start = async () => {
      try {
        setError("")
        if (
          typeof window !== "undefined" &&
          !window.isSecureContext &&
          location.hostname !== "localhost" &&
          location.hostname !== "127.0.0.1"
        ) {
          setError("Camera requires HTTPS or localhost")
          setActive(false)
          return
        }
        if (!navigator.mediaDevices?.getUserMedia) {
          setError("Camera not supported")
          setActive(false)
          return
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        if (!isMounted) return
        streamRef.current = mediaStream
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          await videoRef.current.play()
        }
        if (!videoRef.current) return
        const reader = new BrowserQRCodeReader()
        readerRef.current = reader
        didScanRef.current = false

        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current,
          (result) => {
            if (!result || didScanRef.current) return
            didScanRef.current = true
            onResult(result.getText())
            setActive(false)
            stop()
          }
        )
        controlsRef.current = controls
      } catch (err: any) {
        const name = err?.name || ""
        if (name === "NotAllowedError") {
          setError("Camera permission denied")
        } else if (name === "NotFoundError") {
          setError("No camera device found")
        } else {
          setError("Unable to access camera")
        }
        setActive(false)
      }
    }

    start()

    return () => {
      isMounted = false
      stop()
    }
  }, [active, onResult])

  return (
    <div className="flex flex-col items-center gap-3">
      {active ? (
        <>
          <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-border">
            <video ref={videoRef} className="w-full h-auto" muted playsInline autoPlay />
          </div>
          <Button variant="outline" onClick={() => setActive(false)} className="gap-2">
            <X className="h-4 w-4" /> Stop Scan
          </Button>
        </>
      ) : (
        <Button onClick={() => setActive(true)} className="gap-2">
          <Camera className="h-4 w-4" /> Scan QR
        </Button>
      )}
      {error && <p className="text-xs text-muted-foreground">{error}</p>}
    </div>
  )
}
