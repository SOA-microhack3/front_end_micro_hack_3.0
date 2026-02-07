"use client"

import { useState } from "react"
import { AIInput } from "@/components/ui/ai-input"

export default function TestAIPage() {
  const [messages, setMessages] = useState<string[]>([])

  const handleSubmit = (value: string) => {
    setMessages((prev) => [...prev, value])
    console.log("Submitted:", value)
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Voice AI Input Test</h1>

      <div className="max-w-2xl mx-auto">
        <AIInput
          onSubmit={handleSubmit}
          placeholder="Try speaking in Arabic, French, or English..."
        />

        <div className="mt-8 space-y-2">
          <h2 className="font-semibold">Submitted Messages:</h2>
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages yet. Use the input above.</p>
          ) : (
            <div className="space-y-2">
              {messages.map((msg, idx) => (
                <div key={idx} className="p-3 bg-gray-100 rounded-lg">
                  {msg}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-sm text-gray-600">
          <h3 className="font-semibold mb-2">Features:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Supports Algerian Arabic (ar-DZ), French (fr-FR), and English (en-US)</li>
            <li>Click language button to cycle: DZ → FR → EN → DZ</li>
            <li>Click microphone to start voice input</li>
            <li>Press Enter or click send button to submit</li>
            <li>Text direction automatically adjusts for Arabic</li>
            <li>Textarea auto-resizes based on content</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
