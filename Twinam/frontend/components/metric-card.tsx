import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Tone = 'cyan' | 'teal' | 'green' | 'amber' | 'red'

const toneMap: Record<Tone, { text: string; ring: string; bg: string }> = {
  cyan: { text: 'text-[oklch(0.78_0.14_210)]', ring: 'border-[oklch(0.78_0.14_210)]/30', bg: 'bg-[oklch(0.78_0.14_210)]/10' },
  teal: { text: 'text-[oklch(0.72_0.13_180)]', ring: 'border-[oklch(0.72_0.13_180)]/30', bg: 'bg-[oklch(0.72_0.13_180)]/10' },
  green: { text: 'text-[oklch(0.78_0.15_145)]', ring: 'border-[oklch(0.78_0.15_145)]/30', bg: 'bg-[oklch(0.78_0.15_145)]/10' },
  amber: { text: 'text-[oklch(0.8_0.15_80)]', ring: 'border-[oklch(0.8_0.15_80)]/30', bg: 'bg-[oklch(0.8_0.15_80)]/10' },
  red: { text: 'text-[oklch(0.66_0.2_25)]', ring: 'border-[oklch(0.66_0.2_25)]/30', bg: 'bg-[oklch(0.66_0.2_25)]/10' },
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  tone = 'cyan',
  hint,
}: {
  icon: LucideIcon
  label: string
  value: number | string
  unit?: string
  tone?: Tone
  hint?: string
}) {
  const t = toneMap[tone]
  return (
    <Card className={cn('relative overflow-hidden border p-4', t.ring)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
            <span className={t.text}>{value}</span>
            {unit ? <span className="ms-1 text-base font-medium text-muted-foreground">{unit}</span> : null}
          </p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', t.bg, t.text)}>
          <Icon className="size-5" />
        </span>
      </div>
    </Card>
  )
}
