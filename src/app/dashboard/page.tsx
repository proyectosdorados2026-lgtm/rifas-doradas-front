'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { homeRouteForRole } from '@/config/adminNav'

/** Redirige al dashboard de reportes según el rol. */
export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.replace('/login')
      return
    }

    try {
      const user = JSON.parse(userData)
      router.replace(homeRouteForRole(user?.rol))
    } catch {
      router.replace('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="flex items-center gap-3 text-slate-500 text-sm">
        <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        Abriendo reportes...
      </div>
    </div>
  )
}
