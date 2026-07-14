'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { homeRouteForRole } from '@/config/adminNav'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        router.push(homeRouteForRole(user?.rol))
        return
      } catch {
        /* fallthrough */
      }
    }
    router.push('/login')
  }, [router])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-slate-500">Redirigiendo...</div>
    </div>
  )
}
