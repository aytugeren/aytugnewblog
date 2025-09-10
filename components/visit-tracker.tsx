"use client"
import { useEffect } from 'react'

export function VisitTracker() {
  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "") as string
    // fire-and-forget; ignore errors
    fetch(`${base}/api/track/visit`, { method: 'POST' }).catch(() => {})
  }, [])
  return null
}
