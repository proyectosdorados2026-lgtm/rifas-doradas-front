'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import RecordatoriosList from '@/components/RecordatoriosList'

export default function RecordatoriosPage() {
  const router = useRouter()
  const [ok, setOk] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    setOk(true)
  }, [router])

  if (!ok) {
    return (
      <div className="px-4 py-16 flex justify-center">
        <div className="border-[1.5px] border-black bg-[var(--surface-elevated)] px-5 py-3 text-sm font-semibold uppercase tracking-wide shadow-[4px_4px_0_#101010]">
          Cargando...
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <header className="mb-6 border-b-[1.5px] border-black pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Cobranza</p>
        <h1 className="text-2xl sm:text-3xl font-[800] tracking-tight mt-1" style={{ fontFamily: 'var(--font-display)' }}>
          Recordatorios
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Sigue pagos pendientes y contacta por WhatsApp.
        </p>
      </header>
      <RecordatoriosList />
    </div>
  )
}
