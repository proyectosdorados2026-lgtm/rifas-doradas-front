'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  vendedoresStatsApi,
  VendedorStats,
  ResumenGlobal,
  UsuarioCreado,
} from '@/lib/vendedoresStatsApi'

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0)

const todayISO = () => new Date().toISOString().slice(0, 10)

const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'bg-emerald-100 text-emerald-700',
  VENDEDOR: 'bg-amber-100 text-amber-700',
}

type GrupoFiltro = 'TODOS' | 'ADMINS' | 'VENDEDORES'

function sumMetrics(rows: VendedorStats[]): ResumenGlobal {
  return rows.reduce(
    (acc, r) => {
      acc.total_ventas += Number(r.total_ventas) || 0
      acc.monto_total += Number(r.monto_total) || 0
      acc.abonado_total += Number(r.abonado_total) || 0
      acc.saldo_pendiente += Number(r.saldo_pendiente) || 0
      acc.clientes_unicos += Number(r.clientes_unicos) || 0
      if (r.activo) acc.vendedores_activos += 1
      return acc
    },
    {
      total_ventas: 0,
      monto_total: 0,
      abonado_total: 0,
      saldo_pendiente: 0,
      clientes_unicos: 0,
      vendedores_activos: 0,
    }
  )
}

export default function VendedoresStatsPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<VendedorStats[]>([])
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [grupo, setGrupo] = useState<GrupoFiltro>('TODOS')
  const [personaId, setPersonaId] = useState<string>('')
  const [search, setSearch] = useState('')

  const [showCrear, setShowCrear] = useState(false)
  const [creando, setCreando] = useState(false)
  const [crearError, setCrearError] = useState<string | null>(null)
  const [crearOk, setCrearOk] = useState<UsuarioCreado | null>(null)
  const [formNombre, setFormNombre] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRol, setFormRol] = useState<'ADMIN' | 'VENDEDOR'>('VENDEDOR')
  const [formEmail, setFormEmail] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (!token || !userData) {
      router.push('/login')
      return
    }
    try {
      const u = JSON.parse(userData)
      const rol = String(u.rol || '').toUpperCase()
      if (rol === 'SUPER_ADMIN') {
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
      const res = await vendedoresStatsApi.list(fechaInicio || undefined, fechaFin || undefined)
      setData(res.data)
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

  const personasDelGrupo = useMemo(() => {
    if (grupo === 'ADMINS') return data.filter((d) => d.rol === 'ADMIN')
    if (grupo === 'VENDEDORES') return data.filter((d) => d.rol === 'VENDEDOR')
    return data
  }, [data, grupo])

  useEffect(() => {
    if (personaId && !personasDelGrupo.some((p) => p.id === personaId)) {
      setPersonaId('')
    }
  }, [grupo, personasDelGrupo, personaId])

  const filtered = useMemo(() => {
    let rows = data

    if (grupo === 'ADMINS') rows = rows.filter((d) => d.rol === 'ADMIN')
    if (grupo === 'VENDEDORES') rows = rows.filter((d) => d.rol === 'VENDEDOR')

    if (personaId) rows = rows.filter((d) => d.id === personaId)

    if (search.trim()) {
      const s = search.toLowerCase()
      rows = rows.filter(
        (d) => d.nombre.toLowerCase().includes(s) || d.email.toLowerCase().includes(s)
      )
    }

    return rows
  }, [data, grupo, personaId, search])

  const resumenVista = useMemo(() => sumMetrics(filtered), [filtered])

  const abrirCrear = () => {
    setCrearError(null)
    setCrearOk(null)
    setFormNombre('')
    setFormPassword('')
    setFormEmail('')
    setFormRol(grupo === 'ADMINS' ? 'ADMIN' : 'VENDEDOR')
    setShowCrear(true)
  }

  const submitCrear = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreando(true)
    setCrearError(null)
    setCrearOk(null)
    try {
      const res = await vendedoresStatsApi.crearUsuario({
        nombre: formNombre.trim(),
        password: formPassword,
        rol: formRol,
        ...(formEmail.trim() ? { email: formEmail.trim() } : {}),
      })
      setCrearOk(res.data)
      setFormPassword('')
      await load()
    } catch (err) {
      setCrearError(err instanceof Error ? err.message : 'No se pudo crear el usuario')
    } finally {
      setCreando(false)
    }
  }

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
              <h1 className="text-base font-semibold text-slate-800">Equipo</h1>
            </div>
            <button
              type="button"
              onClick={abrirCrear}
              className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              + Crear usuario
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
            <div>
              <label className="text-xs font-medium text-slate-500">Fecha inicio</label>
              <input
                type="date"
                value={fechaInicio}
                max={fechaFin || todayISO()}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Fecha fin</label>
              <input
                type="date"
                value={fechaFin}
                min={fechaInicio || undefined}
                max={todayISO()}
                onChange={(e) => setFechaFin(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Grupo</label>
              <select
                value={grupo}
                onChange={(e) => {
                  setGrupo(e.target.value as GrupoFiltro)
                  setPersonaId('')
                }}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="TODOS">Admins + Vendedores</option>
                <option value="ADMINS">Admins (general)</option>
                <option value="VENDEDORES">Vendedores (general)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Persona</label>
              <select
                value={personaId}
                onChange={(e) => setPersonaId(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="">
                  {grupo === 'ADMINS'
                    ? 'Todos los admins'
                    : grupo === 'VENDEDORES'
                      ? 'Todos los vendedores'
                      : 'Todos'}
                </option>
                {personasDelGrupo.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.rol === 'ADMIN' ? 'Admin' : 'Vendedor'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Buscar</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre o email"
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={load}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {loading ? 'Cargando…' : 'Aplicar'}
              </button>
              <button
                onClick={() => {
                  setFechaInicio('')
                  setFechaFin('')
                  setGrupo('TODOS')
                  setPersonaId('')
                  setSearch('')
                  setTimeout(load, 0)
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => {
                const t = todayISO()
                setFechaInicio(t)
                setFechaFin(t)
                setTimeout(load, 0)
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
            >
              Hoy
            </button>
            <button
              onClick={() => {
                const end = new Date()
                const start = new Date()
                start.setDate(start.getDate() - 6)
                setFechaInicio(start.toISOString().slice(0, 10))
                setFechaFin(end.toISOString().slice(0, 10))
                setTimeout(load, 0)
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
            >
              Últimos 7 días
            </button>
            <button
              onClick={() => {
                const end = new Date()
                const start = new Date(end.getFullYear(), end.getMonth(), 1)
                setFechaInicio(start.toISOString().slice(0, 10))
                setFechaFin(end.toISOString().slice(0, 10))
                setTimeout(load, 0)
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
            >
              Mes actual
            </button>
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="Personas en vista" value={filtered.length} />
          <KpiCard label="Ventas" value={resumenVista.total_ventas} />
          <KpiCard label="Clientes (suma)" value={resumenVista.clientes_unicos} />
          <KpiCard label="Monto total" value={fmtMoney(resumenVista.monto_total)} />
          <KpiCard label="Abonado" value={fmtMoney(resumenVista.abonado_total)} highlight="emerald" />
          <KpiCard label="Saldo pendiente" value={fmtMoney(resumenVista.saldo_pendiente)} highlight="amber" />
        </section>

        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              {grupo === 'ADMINS'
                ? personaId
                  ? 'Admin individual'
                  : 'Admins (general)'
                : grupo === 'VENDEDORES'
                  ? personaId
                    ? 'Vendedor individual'
                    : 'Vendedores (general)'
                  : 'Equipo'}{' '}
              ({filtered.length})
            </h2>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200 text-sm text-red-700">{error}</div>
          )}

          {loading ? (
            <div className="p-10 flex items-center justify-center text-slate-400">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">Sin resultados</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-2 text-left">Usuario</th>
                    <th className="px-4 py-2 text-left">Rol</th>
                    <th className="px-4 py-2 text-right">Ventas</th>
                    <th className="px-4 py-2 text-right">Clientes</th>
                    <th className="px-4 py-2 text-right">Boletas vendidas</th>
                    <th className="px-4 py-2 text-right">Reservadas</th>
                    <th className="px-4 py-2 text-right">Abonadas</th>
                    <th className="px-4 py-2 text-right">Pagadas</th>
                    <th className="px-4 py-2 text-right">Monto</th>
                    <th className="px-4 py-2 text-right">Abonado</th>
                    <th className="px-4 py-2 text-right">Saldo</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v) => (
                    <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-4 py-2">
                        <div className="font-medium text-slate-800">{v.nombre}</div>
                        <div className="text-xs text-slate-400">{v.email}</div>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            ROLE_BADGE[v.rol] || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {v.rol === 'ADMIN' ? 'Admin' : 'Vendedor'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-slate-700">{v.total_ventas}</td>
                      <td className="px-4 py-2 text-right text-slate-700">{v.clientes_unicos}</td>
                      <td className="px-4 py-2 text-right text-slate-700">{v.boletas_vendidas}</td>
                      <td className="px-4 py-2 text-right text-amber-600">{v.boletas_reservadas}</td>
                      <td className="px-4 py-2 text-right text-blue-600">{v.boletas_abonadas}</td>
                      <td className="px-4 py-2 text-right text-emerald-600">{v.boletas_pagadas}</td>
                      <td className="px-4 py-2 text-right font-medium text-slate-800">
                        {fmtMoney(v.monto_total)}
                      </td>
                      <td className="px-4 py-2 text-right text-emerald-600">
                        {fmtMoney(v.abonado_total)}
                      </td>
                      <td className="px-4 py-2 text-right text-amber-600">
                        {fmtMoney(v.saldo_pendiente)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <a
                          href={`/vendedores/${v.id}${
                            fechaInicio || fechaFin
                              ? `?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`
                              : ''
                          }`}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Ver detalle →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {showCrear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Crear usuario</h3>
              <button
                type="button"
                onClick={() => setShowCrear(false)}
                className="text-slate-400 hover:text-slate-700 text-xl leading-none"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <form onSubmit={submitCrear} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Nombre</label>
                <input
                  required
                  minLength={2}
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: Admin 6 / Vendedor Sara"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Contraseña</label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Rol</label>
                <select
                  value={formRol}
                  onChange={(e) => setFormRol(e.target.value as 'ADMIN' | 'VENDEDOR')}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ADMIN">Administrador</option>
                  <option value="VENDEDOR">Vendedor</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">
                  Email (opcional — si lo dejas vacío se genera automático)
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="nombre@rifas.com"
                />
              </div>

              {crearError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {crearError}
                </div>
              )}
              {crearOk && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800">
                  Creado: <strong>{crearOk.nombre}</strong> · login{' '}
                  <strong>{crearOk.email}</strong> · rol {crearOk.rol}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCrear(false)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={creando}
                  className="flex-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold"
                >
                  {creando ? 'Creando…' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string | number
  highlight?: 'emerald' | 'amber'
}) {
  const color =
    highlight === 'emerald'
      ? 'text-emerald-600'
      : highlight === 'amber'
        ? 'text-amber-600'
        : 'text-slate-800'
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${color}`}>{value}</div>
    </div>
  )
}
