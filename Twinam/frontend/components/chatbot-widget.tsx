'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Prediction {
  unit_id?: string | null
  fault_type: string
  fault_axis: string
  health_score: number
  RUL_cycles: number
  maintenance_required: number
}

interface ChatbotWidgetProps {
  lastPrediction?: Prediction | null
}

const QUICK_QUESTIONS = [
  'What is the current machine status?',
  'Explain the latest fault detected',
  'What maintenance is needed now?',
  'How to improve the health score?',
  'Is the machine safe to operate?',
]

export function ChatbotWidget({ lastPrediction }: ChatbotWidgetProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hello! I'm Twinam's AI assistant. Ask me anything about machine status, AI predictions, or maintenance recommendations.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text?: string) {
    const msgText = (text ?? input).trim()
    if (!msgText || loading) return
    setInput('')
    setError(null)

    const userMsg: Message = { role: 'user', content: msgText }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      // Call the Next.js API route — avoids CORS issues
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          prediction: lastPrediction ?? null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? `Server error ${res.status}`)
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply },
      ])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error: ${msg}. Please check that ANTHROPIC_API_KEY is set in .env.local`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const showQuickQ = messages.length <= 1

  return (
    <>
      {/* ── Chat window ─────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-24 right-4 z-50 flex w-[360px] flex-col rounded-2xl border border-border bg-card shadow-2xl shadow-black/40 overflow-hidden"
          style={{ height: '500px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
            <div className="relative size-8 overflow-hidden rounded-full ring-1 ring-primary/40">
              <Image src="/images/twinam-logo.png" alt="Twinam" fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-none">Twinam Assistant</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground truncate">
                {lastPrediction
                  ? `Live: ${lastPrediction.unit_id ?? 'Unit'} · ${lastPrediction.fault_type}`
                  : 'AI Maintenance Expert'}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Live prediction banner */}
          {lastPrediction && (
            <div
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b border-border ${
                lastPrediction.maintenance_required === 1
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              <span className="size-1.5 rounded-full bg-current animate-pulse shrink-0" />
              <span>
                Health: {lastPrediction.health_score.toFixed(1)}/100 ·
                RUL: {lastPrediction.RUL_cycles.toFixed(0)} cycles ·
                {lastPrediction.maintenance_required === 1
                  ? ' ⚠️ Maintenance Required'
                  : ' ✅ OK'}
              </span>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {m.role === 'assistant' && (
                  <div className="relative mt-1 size-6 shrink-0 overflow-hidden rounded-full ring-1 ring-primary/30">
                    <Image src="/images/twinam-logo.png" alt="AI" fill className="object-cover" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted text-foreground rounded-tl-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-2">
                <div className="relative mt-1 size-6 shrink-0 overflow-hidden rounded-full ring-1 ring-primary/30">
                  <Image src="/images/twinam-logo.png" alt="AI" fill className="object-cover" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-muted px-3 py-2">
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Analyzing…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {showQuickQ && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  disabled={loading}
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mx-3 mb-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-[11px] text-destructive">
              {error}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border bg-background/80 px-3 py-2.5 flex gap-2 items-center backdrop-blur-sm">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about machines, faults, maintenance…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40 hover:opacity-90"
            >
              <Send className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Floating button — Twinam logo ───────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Twinam AI Assistant"
        className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full border-2 border-primary/50 bg-background shadow-lg shadow-black/30 transition-all hover:border-primary hover:shadow-[0_0_24px_-4px_oklch(0.78_0.14_210/0.7)] active:scale-95"
      >
        <div className="relative size-10 overflow-hidden rounded-full">
          <Image src="/images/twinam-logo.png" alt="Twinam Chat" fill className="object-cover" />
        </div>
        {/* Alert dot */}
        {!open && lastPrediction?.maintenance_required === 1 && (
          <span className="absolute right-1 top-1 size-3 rounded-full bg-destructive ring-2 ring-background animate-pulse" />
        )}
      </button>
    </>
  )
}
