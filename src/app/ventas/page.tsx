'use client'

import { useRouter } from 'next/navigation'
import PageHeader from '@/components/admin/PageHeader'

export default function VentasHomePage() {
  const router = useRouter()

  return (
    <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <PageHeader
        eyebrow="Ventas"
        title="Operación de ventas"
        description="Elige si quieres registrar una venta nueva o cobrar abonos pendientes."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
        <button
          type="button"
          onClick={() => router.push('/ventas/nueva-venta')}
          className="text-left bg-[var(--surface-elevated)] border-[1.5px] border-black p-6 shadow-[4px_4px_0_#101010] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_#101010] transition-all"
        >
          <div className="w-11 h-11 border-[1.5px] border-black bg-[var(--primary)] text-black flex items-center justify-center mb-4 font-bold">
            +
          </div>
          <h3 className="text-lg font-bold uppercase tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Nueva venta
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Registrar boletas para un cliente (bloqueo en tiempo real).
          </p>
        </button>

        <button
          type="button"
          onClick={() => router.push('/ventas/gestionar')}
          className="text-left bg-[var(--surface-elevated)] border-[1.5px] border-black p-6 shadow-[4px_4px_0_#101010] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_#101010] transition-all"
        >
          <div className="w-11 h-11 border-[1.5px] border-black bg-black text-[var(--primary)] flex items-center justify-center mb-4 font-bold">
            $
          </div>
          <h3 className="text-lg font-bold uppercase tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Cobrar / abonar
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Buscar por número o cliente y registrar pagos pendientes.
          </p>
        </button>
      </div>
    </div>
  )
}
