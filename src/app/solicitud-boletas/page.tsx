'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/admin/PageHeader'
import { rifaApi } from '@/lib/rifaApi'
import {
  inventarioApi,
  type InventarioDetalle,
  type SolicitudBoletaResponse,
} from '@/lib/inventarioApi'
import type { Rifa } from '@/types/rifa'

const formatNumero = (n: number) => String(n).padStart(4, '0')

const inputBase =
  'w-full px-4 py-3 border-[1.5px] border-black text-lg font-bold tracking-widest bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-center'
const btnPrimario =
  'w-full sm:w-auto px-6 py-3 bg-[var(--primary)] text-black border-[1.5px] border-black font-bold uppercase text-xs tracking-wider shadow-[3px_3px_0_#101010] disabled:opacity-50 disabled:shadow-none min-h-[48px]'
const labelBase =
  'block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] mb-1'

type ResultadoUi = {
  tipo: SolicitudBoletaResponse['resultado']
  mensaje: string
  detalle?: string
}

function mapResultado(data: SolicitudBoletaResponse): ResultadoUi {
  const par = data.boleta?.par
  const extra =
    data.resultado === 'OTRO_VENDEDOR' && data.vendedor?.nombre
      ? `Asignada a: ${data.vendedor.nombre}`
      : data.resultado === 'CON_CLIENTE' && data.boleta?.cliente_nombre
        ? `Cliente: ${data.boleta.cliente_nombre}`
        : par
          ? `Pacha: ${par}`
          : undefined

  return { tipo: data.resultado, mensaje: data.mensaje, detalle: extra }
}

const ESTILO_RESULTADO: Record<
  SolicitudBoletaResponse['resultado'],
  { bg: string; border: string; icon: string }
> = {
  ASIGNADA: { bg: 'bg-emerald-50', border: 'border-emerald-600', icon: '✓' },
  YA_TUYA: { bg: 'bg-sky-50', border: 'border-sky-600', icon: 'ℹ' },
  OTRO_VENDEDOR: { bg: 'bg-amber-50', border: 'border-amber-600', icon: '!' },
  CON_CLIENTE: { bg: 'bg-red-50', border: 'border-red-600', icon: '✕' },
  NO_DISPONIBLE: { bg: 'bg-red-50', border: 'border-red-600', icon: '✕' },
  NO_ENCONTRADA: { bg: 'bg-slate-50', border: 'border-slate-500', icon: '?' },
  BLOQUEADA: { bg: 'bg-amber-50', border: 'border-amber-600', icon: '⏳' },
  INVENTARIO_INACTIVO: { bg: 'bg-slate-50', border: 'border-slate-500', icon: '!' },
  NO_ASIGNABLE: { bg: 'bg-red-50', border: 'border-red-600', icon: '✕' },
}

export default function SolicitudBoletasPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; nombre: string; rol: string } | null>(null)
  const [rifas, setRifas] = useState<Rifa[]>([])
  const [rifaId, setRifaId] = useState('')
  const [inventario, setInventario] = useState<InventarioDetalle | null>(null)
  const [numeroTexto, setNumeroTexto] = useState('')
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState<ResultadoUi | null>(null)
  const [historial, setHistorial] = useState<ResultadoUi[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (!token || !userData) {
      router.push('/login')
      return
    }
    try {
      const parsed = JSON.parse(userData)
      if ((parsed.rol || '').toUpperCase() !== 'VENDEDOR') {
        router.push('/mis-reportes')
        return
      }
      setUser(parsed)
    } catch {
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    if (!user) return
    const cargar = async () => {
      try {
        const res = await rifaApi.getRifasOperativas('ACTIVA')
        const lista = res.data || []
        setRifas(lista)
        if (lista.length > 0) setRifaId(lista[0].id)
        else setLoading(false)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error al cargar proyectos'
        setError(msg)
        setLoading(false)
      }
    }
    cargar()
  }, [user])

  const cargarInventario = useCallback(async () => {
    if (!rifaId) return
    setLoading(true)
    setError('')
    try {
      const data = await inventarioApi.getMiInventario(rifaId)
      setInventario(data)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cargar tu inventario'
      setError(msg)
      setInventario(null)
    } finally {
      setLoading(false)
    }
  }, [rifaId])

  useEffect(() => {
    cargarInventario()
  }, [cargarInventario])

  const parseNumero = (): { numero: number | null; error: string | null } => {
    const limpio = numeroTexto.trim()
    if (!limpio) return { numero: null, error: 'Escribe el número de la boleta' }
    const n = Number(limpio)
    if (!Number.isInteger(n) || n < 0 || n > 9999) {
      return { numero: null, error: 'Número inválido (0 a 9999)' }
    }
    return { numero: n, error: null }
  }

  const handleSolicitar = async () => {
    const { numero, error: parseError } = parseNumero()
    if (parseError || numero == null) {
      setError(parseError || 'Número inválido')
      return
    }
    if (!rifaId) return

    setProcesando(true)
    setError('')
    setResultado(null)

    try {
      const data = await inventarioApi.solicitarBoleta(rifaId, numero)
      const ui = mapResultado(data)
      setResultado(ui)
      setHistorial((prev) => [ui, ...prev].slice(0, 8))
      if (data.resultado === 'ASIGNADA') {
        setNumeroTexto('')
        await cargarInventario()
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al solicitar la boleta'
      setError(msg)
    } finally {
      setProcesando(false)
    }
  }

  const rifaNombre = rifas.find((r) => r.id === rifaId)?.nombre || ''

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        Verificando acceso...
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 px-3 sm:px-6 lg:px-8 pb-10">
      <PageHeader
        eyebrow="Inventario"
        title="Solicitud de boletas"
        description="Escribe un número de boleta. Si está libre y sin cliente, se asignará a tu inventario al instante."
      />

      {rifas.length > 1 && (
        <div className="mb-4 max-w-md">
          <label className={labelBase}>Proyecto activo</label>
          <select
            value={rifaId}
            onChange={(e) => {
              setRifaId(e.target.value)
              setResultado(null)
            }}
            className="w-full px-3 py-2 border-[1.5px] border-black text-sm bg-white"
          >
            {rifas.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {rifaNombre && rifas.length === 1 && (
        <p className="text-xs text-[var(--text-muted)] mb-4 font-medium uppercase tracking-wide">
          Proyecto: {rifaNombre}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <section className="border-[1.5px] border-black bg-white p-4 sm:p-6 shadow-[4px_4px_0_#101010]">
          <label htmlFor="numero-boleta" className={labelBase}>
            Número de boleta
          </label>
          <input
            id="numero-boleta"
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="0000"
            value={numeroTexto}
            onChange={(e) => {
              setNumeroTexto(e.target.value.replace(/\D/g, '').slice(0, 4))
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSolicitar()
            }}
            className={inputBase}
            disabled={procesando || !rifaId}
          />
          <p className="text-[11px] text-[var(--text-muted)] mt-2">
            Puedes usar cualquiera de los dos números de la pacha (doble oportunidad).
          </p>

          {error && (
            <div className="mt-4 p-3 border-[1.5px] border-red-600 bg-red-50 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSolicitar}
            disabled={procesando || !rifaId || !numeroTexto.trim()}
            className={`${btnPrimario} mt-5`}
          >
            {procesando ? 'Consultando...' : 'Solicitar boleta'}
          </button>

          {resultado && (
            <div
              className={`mt-6 p-4 border-[1.5px] ${ESTILO_RESULTADO[resultado.tipo].border} ${ESTILO_RESULTADO[resultado.tipo].bg}`}
              role="status"
            >
              <p className="text-lg font-bold flex items-start gap-2">
                <span aria-hidden>{ESTILO_RESULTADO[resultado.tipo].icon}</span>
                {resultado.mensaje}
              </p>
              {resultado.detalle && (
                <p className="text-sm text-[var(--text-secondary)] mt-2">{resultado.detalle}</p>
              )}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="border-[1.5px] border-black bg-white p-4 shadow-[3px_3px_0_#101010]">
            <p className={labelBase}>Tu inventario</p>
            {loading ? (
              <p className="text-sm text-slate-500">Cargando...</p>
            ) : inventario ? (
              <>
                <p className="text-3xl font-[800] text-black">{inventario.total}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  boletas asignadas a {user.nombre}
                </p>
                {inventario.rangos.length > 0 && (
                  <ul className="mt-3 space-y-1 text-[11px] text-[var(--text-secondary)]">
                    {inventario.rangos.slice(0, 5).map((r) => (
                      <li key={`${r.desde}-${r.hasta}`}>
                        {formatNumero(r.desde)} – {formatNumero(r.hasta)} ({r.cantidad})
                      </li>
                    ))}
                    {inventario.rangos.length > 5 && (
                      <li>+ {inventario.rangos.length - 5} rangos más</li>
                    )}
                  </ul>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">Sin datos de inventario</p>
            )}
          </div>

          {historial.length > 0 && (
            <div className="border-[1.5px] border-black bg-white p-4 shadow-[3px_3px_0_#101010]">
              <p className={labelBase}>Últimas solicitudes</p>
              <ul className="space-y-2 mt-2">
                {historial.map((h, i) => (
                  <li
                    key={`${h.tipo}-${i}`}
                    className="text-[11px] border-b border-slate-100 pb-2 last:border-0"
                  >
                    <span className="font-bold uppercase">{h.tipo.replace(/_/g, ' ')}</span>
                    <span className="block text-[var(--text-secondary)]">{h.mensaje}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
