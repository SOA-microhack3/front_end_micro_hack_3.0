import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Cairo } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const _inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const _cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
})

export const metadata: Metadata = {
  title: "PortFlow Elite | Intelligent Port Access Control",
  description:
    "Enterprise-grade intelligent port access control system with AI orchestration, slot booking, QR validation, and full auditability.",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" dir="ltr" suppressHydrationWarning>
      <body className={`${_inter.variable} ${_cairo.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
