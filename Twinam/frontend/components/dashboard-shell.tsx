'use client'

import type { LucideIcon } from 'lucide-react'
import { ArrowLeft, Home } from 'lucide-react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function DashboardShell({
  icon: Icon,
  title,
  subtitle,
  status,
  onHome,
  children,
}: {
  icon: LucideIcon
  title: string
  subtitle: string
  status: { label: string; tone: 'ok' | 'warn' | 'err' }
  onHome: () => void
  children: React.ReactNode
}) {
  const toneClass =
    status.tone === 'ok'
      ? 'bg-[oklch(0.78_0.15_145)]/15 text-[oklch(0.82_0.15_145)] border-[oklch(0.78_0.15_145)]/40'
      : status.tone === 'warn'
        ? 'bg-[oklch(0.8_0.15_80)]/15 text-[oklch(0.84_0.15_80)] border-[oklch(0.8_0.15_80)]/40'
        : 'bg-[oklch(0.66_0.2_25)]/15 text-[oklch(0.72_0.2_25)] border-[oklch(0.66_0.2_25)]/40'

  return (
    <div className="min-h-dvh grid-bg">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Image src="/images/twinam-logo.png" alt="Twinam logo" width={40} height={40} className="rounded-md" />
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold leading-tight sm:text-lg">{title}</h1>
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <Badge variant="outline" className={`gap-1.5 ${toneClass}`}>
              <span className="size-1.5 animate-pulse rounded-full bg-current" />
              {status.label}
            </Badge>
            <Button onClick={onHome} variant="secondary" size="sm" className="gap-1.5">
              <Home className="size-4" />
              <span className="hidden sm:inline">Home</span>
              <ArrowLeft className="size-4 sm:hidden" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}
