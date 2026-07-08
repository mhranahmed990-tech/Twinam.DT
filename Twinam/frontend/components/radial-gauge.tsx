'use client'

import { cn } from '@/lib/utils'

/**
 * A semicircular SVG gauge for showing a single bounded reading
 * (e.g. load %, battery %, efficiency).
 */
export function RadialGauge({
  value,
  max = 100,
  label,
  unit = '%',
  color = 'oklch(0.78 0.14 210)',
  size = 160,
}: {
  value: number
  max?: number
  label: string
  unit?: string
  color?: string
  size?: number
}) {
  const pct = Math.min(1, Math.max(0, value / max))
  const radius = size / 2 - 12
  const cx = size / 2
  const cy = size / 2
  const circumference = Math.PI * radius // semicircle
  const dash = circumference

  // start at 180deg (left) sweeping to 0deg (right)
  const startAngle = Math.PI
  const endAngle = Math.PI - pct * Math.PI
  const tip = {
    x: cx + radius * Math.cos(endAngle),
    y: cy - radius * Math.sin(endAngle),
  }

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 1.6} viewBox={`0 0 ${size} ${size / 1.6}`} role="img" aria-label={`${label}: ${value}${unit}`}>
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="oklch(0.4 0.05 230 / 0.35)"
          strokeWidth={12}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={dash}
          strokeDashoffset={circumference * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <circle cx={tip.x} cy={tip.y} r={6} fill={color} style={{ transition: 'all 0.6s ease' }} />
      </svg>
      <div className="-mt-6 text-center">
        <p className="font-mono text-2xl font-bold tabular-nums" style={{ color }}>
          {Math.round(value * 10) / 10}
          <span className="text-sm text-muted-foreground">{unit}</span>
        </p>
        <p className={cn('mt-0.5 text-xs text-muted-foreground')}>{label}</p>
      </div>
    </div>
  )
}
