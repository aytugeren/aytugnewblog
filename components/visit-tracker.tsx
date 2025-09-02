"use client"
import { useEffect } from 'react'
import { apiFetch } from '@/services/api'

export function VisitTracker() {
  useEffect(() => {
    // fire-and-forget; ignore errors
    apiFetch('/api/track/visit', { method: 'POST' }).catch(() => {})
  }, [])
  return null
}

