'use client'

import { useEffect, useState, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { vendedoresStatsApi, VendedorDetalleResponse } from '@/lib/vendedoresStatsApi'

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0)

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—'

const todayISO = () => new Date().toISOString().slice(0, 10)

const ESTADO_BADGE: Record<string, string> = {
  PAGADA: 'bg-emerald-100 text-emerald-700',
  ABONADA: 'bg-blue-100 text-blue-700',
  PENDIENTE: 'bg-amber-100 text-amber-700',
  CANCELADA: 'bg-red-100 text-red-700',
  EXPIRADA: 'bg-slate-200 text-slate-600'
}

export default function VendedorDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const sp = useSearchParams()

  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<VendedorDetalleResponse | null>(null)
  const [fechaInicio, setFechaInicio] = useState(sp.get('fechaInicio') || '')
  const [fechaFin, setFechaFin] = useState(sp.get('fechaFin') || '')
  const [tab, setTab] = useState<'ventas' | 'clientes'>('ventas')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (!token || !userData) {
      router.push('/login')
      return
    }
    try {
      const u = JSON.parse(userData)
      if (String(u.rol || '').toUpperCase() === 'SUPER_ADMIN') {
        setAuthorized(true)
      } else {
        router.push('/dashboard')
      }
    } catch {
      router.push('/login')
    }
  }, [router])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await vendedoresStatsApi.detalle(id, fechaInicio || undefined, fechaFin || undefined)
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authorized) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized])

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 text-sm">Cargando...</span>
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
              <a href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Dashboard
              </a>
              <span className="text-slate-300">/</span>
              <a href="/vendedores" className="text-slate-500 hover:text-slate-800 text-sm font-medium">Vendedores</a>
              <span className="text-slate-300">/</span>
              <h1 className="text-base font-semibold text-slate-800 truncate">{data?.vendedor?.nombre || 'Detalle'}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Vendedor info */}
        {data?.vendedor && (
          <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-lg font-semibold text-slate-800">{data.vendedor.nombre}</div>
                <div className="text-sm text-slate-500">{data.vendedor.email}</div>
                <div className="mt-1 text-xs text-slate-400">
                  Rol: <span className="font-medium text-slate-600">{data.vendedor.rol}</span>
                  {' · '}Último login: {fmtDate(data.vendedor.ultimo_login)}
                </div>
              </div>
              <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${data.vendedor.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                {data.vendedor.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </section>
        )}

        {/* Filtros fecha */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-xs font-medium text-slate-500">Fecha inicio</label>
              <input
                type="date"
                value={fechaInicio}
                max={fechaFin || todayISO()}
                onChange={e => setFechaInicio(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Fecha fin</label>
              <input
                type="date"
                value={fechaFin}
                min={fechaInicio || undefined}
                max={todayISO()}
                onChange={e => setFechaFin(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2 md:col-span-2">
              <button
                onClick={load}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
              >
                {loading ? 'Cargando…' : 'Aplicar'}
              </button>
              <button
                onClick={() => {
                  setFechaInicio('')
                  setFechaFin('')
                  setTimeout(load, 0)
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg"
              >
                Limpiar
              </button>
              <button
                onClick={() => {
                  const t = todayISO()
                  setFechaInicio(t)
                  setFechaFin(t)
                  setTimeout(load, 0)
                }}
                className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
              >
                Hoy
              </button>
            </div>
          </div>
        </section>

        {/* KPIs */}
        {data?.resumen && (
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="Ventas" value={data.resumen.total_ventas} />
            <KpiCard label="Clientes únicos" value={data.resumen.clientes_unicos} />
            <KpiCard label="Boletas vendidas" value={data.resumen.boletas_vendidas} />
            <KpiCard label="Reservadas" value={data.resumen.boletas_reservadas} highlight="amber" />
            <KpiCard label="Abonadas" value={data.resumen.boletas_abonadas} highlight="blue" />
            <KpiCard label="Pagadas" value={data.resumen.boletas_pagadas} highlight="emerald" />
            <KpiCard label="Monto total" value={fmtMoney(data.resumen.monto_total)} />
            <KpiCard label="Abonado" value={fmtMoney(data.resumen.abonado_total)} highlight="emerald" />
            <KpiCard label="Saldo pendiente" value={fmtMoney(data.resumen.saldo_pendiente)} highlight="amber" />
            <KpiCard label="Abonos registrados" value={data.resumen.abonos_registrados} />
            <KpiCard label="Monto abonos" value={fmtMoney(data.resumen.abonos_monto)} highlight="emerald" />
          </section>
        )}

        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

        {/* Tabs */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 flex">
            <button
              onClick={() => setTab('ventas')}
              className={`px-4 py-3 text-sm font-medium ${tab === 'ventas' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Ventas ({data?.ventas.length ?? 0})
            </button>
            <button
              onClick={() => setTab('clientes')}
              className={`px-4 py-3 text-sm font-medium ${tab === 'clientes' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Clientes ({data?.clientes.length ?? 0})
            </button>
          </div>

          {loading ? (
            <div className="p-10 flex items-center justify-center text-slate-400">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tab === 'ventas' ? (
            !data?.ventas.length ? (
              <div className="p-10 text-center text-sm text-slate-400">Sin ventas en el rango</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-2 text-left">Fecha</th>
                      <th className="px-4 py-2 text-left">Cliente</th>
                      <th className="px-4 py-2 text-left">Proyecto</th>
                      <th className="px-4 py-2 text-right">Boletas</th>
                      <th className="px-4 py-2 text-right">Monto</th>
                      <th className="px-4 py-2 text-right">Abonado</th>
                      <th className="px-4 py-2 text-right">Saldo</th>
                      <th className="px-4 py-2 text-left">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ventas.map(v => (
                      <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="px-4 py-2 whitespace-nowrap text-slate-600">{fmtDate(v.created_at)}</td>
                        <td className="px-4 py-2">
                          <div className="font-medium text-slate-800">{v.cliente_nombre}</div>
                          {v.cliente_telefono && <div className="text-xs text-slate-400">{v.cliente_telefono}</div>}
                        </td>
                        <td className="px-4 py-2 text-slate-600">{v.rifa_nombre}</td>
                        <td className="px-4 py-2 text-right text-slate-700">{v.total_boletas}</td>
                        <td className="px-4 py-2 text-right font-medium text-slate-800">{fmtMoney(v.monto_total)}</td>
                        <td className="px-4 py-2 text-right text-emerald-600">{fmtMoney(v.abono_total)}</td>
                        <td className="px-4 py-2 text-right text-amber-600">{fmtMoney(v.saldo_pendiente)}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${ESTADO_BADGE[v.estado_venta] || 'bg-slate-100 text-slate-600'}`}>
                            {v.estado_venta}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : !data?.clientes.length ? (
            <div className="p-10 text-center text-sm text-slate-400">Sin clientes en el rango</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-2 text-left">Cliente</th>
                    <th className="px-4 py-2 text-left">Contacto</th>
                    <th className="px-4 py-2 text-right">Ventas</th>
                    <th className="px-4 py-2 text-right">Monto</th>
                    <th className="px-4 py-2 text-right">Abonado</th>
                    <th className="px-4 py-2 text-right">Saldo</th>
                    <th className="px-4 py-2 text-left">Última venta</th>
                  </tr>
                </thead>
                <tbody>
                  {data.clientes.map(c => (
                    <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-4 py-2 font-medium text-slate-800">{c.nombre}</td>
                      <td className="px-4 py-2 text-slate-600">
                        <div>{c.telefono || '—'}</div>
                        {c.email && <div className="text-xs text-slate-400">{c.email}</div>}
                      </td>
                      <td className="px-4 py-2 text-right text-slate-700">{c.total_ventas}</td>
                      <td className="px-4 py-2 text-right font-medium text-slate-800">{fmtMoney(c.monto_total)}</td>
                      <td className="px-4 py-2 text-right text-emerald-600">{fmtMoney(c.abonado_total)}</td>
                      <td className="px-4 py-2 text-right text-amber-600">{fmtMoney(c.saldo_pendiente)}</td>
                      <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{fmtDate(c.ultima_venta)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function KpiCard({ label, value, highlight }: { label: string; value: string | number; highlight?: 'emerald' | 'amber' | 'blue' }) {
  const color =
    highlight === 'emerald' ? 'text-emerald-600' :
    highlight === 'amber' ? 'text-amber-600' :
    highlight === 'blue' ? 'text-blue-600' :
    'text-slate-800'
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${color}`}>{value}</div>
    </div>
  )
}
