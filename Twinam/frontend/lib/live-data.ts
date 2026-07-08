'use client'

import { useEffect, useRef, useState } from 'react'

export type Point = { t: string; [key: string]: number | string }

type SeriesConfig = Record<string, { base: number; jitter: number; min?: number; max?: number }>

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

function timeLabel(d: Date) {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/**
 * Generates a rolling time-series that updates on an interval to simulate
 * live telemetry coming from the factory floor.
 */
export function useLiveSeries(config: SeriesConfig, length = 24, intervalMs = 1800) {
  const keys = Object.keys(config)
  const lastRef = useRef<Record<string, number>>(
    Object.fromEntries(keys.map((k) => [k, config[k].base])),
  )

  const build = (): Point[] => {
    const now = Date.now()
    return Array.from({ length }, (_, i) => {
      const d = new Date(now - (length - 1 - i) * intervalMs)
      const point: Point = { t: timeLabel(d) }
      for (const k of keys) {
        const c = config[k]
        const drift = (Math.random() - 0.5) * c.jitter
        const next = clamp(c.base + drift * (1 + i / length), c.min ?? -Infinity, c.max ?? Infinity)
        point[k] = Math.round(next * 10) / 10
      }
      return point
    })
  }

  const [data, setData] = useState<Point[]>(build)

  useEffect(() => {
    const id = setInterval(() => {
      setData((prev) => {
        const d = new Date()
        const point: Point = { t: timeLabel(d) }
        for (const k of keys) {
          const c = config[k]
          const prevVal = (prev[prev.length - 1]?.[k] as number) ?? c.base
          const drift = (Math.random() - 0.5) * c.jitter
          const next = clamp(prevVal + drift, c.min ?? -Infinity, c.max ?? Infinity)
          const val = Math.round(next * 10) / 10
          point[k] = val
          lastRef.current[k] = val
        }
        return [...prev.slice(1), point]
      })
    }, intervalMs)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const latest = data[data.length - 1] ?? {}
  return { data, latest }
}

/** A single value that nudges up and down over time. */
export function useLiveValue(base: number, jitter: number, min = 0, max = 100, intervalMs = 1800) {
  const [value, setValue] = useState(base)
  useEffect(() => {
    const id = setInterval(() => {
      setValue((v) => clamp(Math.round((v + (Math.random() - 0.5) * jitter) * 10) / 10, min, max))
    }, intervalMs)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return value
}
