'use client'

import { useState } from 'react'
import { Bot, ChevronRight, Cpu, FlaskConical, GitCommitVertical, Truck, Users } from 'lucide-react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import type { ViewKey } from '@/components/twinam-dashboard'
import { FoundersModal } from '@/components/founders-modal'

const systems: {
  key: Exclude<ViewKey, 'home'>
  title: string
  desc: string
  icon: typeof Bot
  meta: string
  highlight?: boolean
}[] = [
  {
    key: 'arm',
    title: 'Robot Arm',
    desc: 'Predicts remaining useful life, faults, and health using a real AI model · 3 units',
    icon: Bot,
    meta: '6 axes · connected prediction model',
  },
  {
    key: 'car',
    title: 'Mobile Robot (AGV)',
    desc: 'Tracks battery, speed, route, and charging status · 2 units',
    icon: Truck,
    meta: '2 AGV vehicles · live simulation',
  },
  {
    key: 'conveyor',
    title: 'Production Line',
    desc: 'Throughput rate, conveyor speed, and defect rate',
    icon: GitCommitVertical,
    meta: '142 units/hr · active',
  },
  {
    key: 'scenario',
    title: 'Check Scenario',
    desc: 'Simulate any sensor condition and see what the AI models predict — try edge cases and what-if scenarios',
    icon: FlaskConical,
    meta: '53 features · live AI inference',
    highlight: true,
  },
]

export function HomeView({ onSelect }: { onSelect: (key: Exclude<ViewKey, 'home'>) => void }) {
  const [showFounders, setShowFounders] = useState(false)

  return (
    <div className="relative min-h-dvh overflow-hidden grid-bg">
      {showFounders && <FoundersModal onClose={() => setShowFounders(false)} />}

      {/* Founders icon — top right */}
      <button
        type="button"
        onClick={() => setShowFounders(true)}
        title="Meet the founders"
        className="absolute right-4 top-4 z-30 flex size-10 items-center justify-center rounded-xl border border-border bg-background/70 text-muted-foreground backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_16px_-4px_oklch(0.78_0.14_210/0.5)]"
      >
        <Users className="size-5" />
      </button>

      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-24 size-[520px] -translate-x-1/2 animate-pulse-glow rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, oklch(0.78 0.14 210 / 0.35), transparent 65%)' }}
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-12 sm:px-6 sm:py-16">
        {/* Logo */}
        <div className="animate-float">
          <div className="glow-ring rounded-3xl">
            <Image
              src="/images/twinam-logo.png"
              alt="Twinam digital twin and Industry 4.0 company logo"
              width={300}
              height={300}
              priority
              className="rounded-3xl"
            />
          </div>
        </div>

        <div className="animate-rise mt-8 text-center" style={{ animationDelay: '0.1s' }}>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Cpu className="size-3.5" />
            Digital Twin & Industry 4.0
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-5xl">
            Digital Factory Dashboard
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Choose a system to view live charts, graphs, and sensor readings for each unit on the production line.
          </p>
        </div>

        {/* System cards */}
        <div className="mt-12 grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
          {systems.map((s, i) => {
            const Icon = s.icon
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => onSelect(s.key)}
                className="animate-rise group text-start"
                style={{ animationDelay: `${0.2 + i * 0.1}s` }}
              >
                <Card className={`relative h-full overflow-hidden border-border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_40px_-10px_oklch(0.78_0.14_210/0.5)] ${
                  s.highlight
                    ? 'border-primary/40 bg-primary/5 hover:border-primary/70'
                    : 'hover:border-primary/50'
                }`}>
                  {/* hover sweep */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-l from-transparent via-primary/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                  {/* Highlight badge for Scenario Check */}
                  {s.highlight && (
                    <span className="absolute right-3 top-3 rounded-full border border-primary/40 bg-primary/20 px-2 py-0.5 text-[9px] font-semibold text-primary uppercase tracking-wider">
                      AI Simulator
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <span className={`flex size-14 items-center justify-center rounded-2xl ring-1 transition-colors group-hover:bg-primary/20 ${
                      s.highlight
                        ? 'bg-primary/20 text-primary ring-primary/30'
                        : 'bg-primary/10 text-primary ring-primary/20'
                    }`}>
                      <Icon className="size-7" />
                    </span>
                    <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <h2 className="mt-5 text-lg font-bold">{s.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                  <p className="mt-4 font-mono text-xs text-primary">{s.meta}</p>
                </Card>
              </button>
            )
          })}
        </div>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          © Twinam — All data shown is a live simulation for demonstration purposes.
        </p>
      </div>
    </div>
  )
}
