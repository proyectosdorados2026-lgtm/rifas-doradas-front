'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import HistorialMovimientos from '@/components/HistorialMovimientos'

export default function HistorialPage() {
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    try {
      const user = JSON.parse(userData)
      const rol = (user.rol || '').toUpperCase()
      if (rol === 'SUPER_ADMIN') {
        setAuthorized(true)
      } else {
        router.push('/dashboard')
      }
    } catch {
      router.push('/login')
    }
  }, [router])

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 text-sm">Verificando acceso…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50/30">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-3">
              <a
                href="/dashboard"
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Dashboard
              </a>
              <span className="text-slate-300">/</span>
              <div className="flex items-center gap-2">
                <span className="text-lg">📜</span>
                <span className="font-semibold text-slate-800 text-sm">Historial</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
              Super Admin
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Historial de movimientos</h1>
          <p className="text-slate-500 text-sm mt-1">
            Auditoría de cambios en boletas, clientes, abonos y ventas. Cada fila es un evento registrado automáticamente.
          </p>
        </div>

        <HistorialMovimientos />
      </main>
    </div>
  )
}
