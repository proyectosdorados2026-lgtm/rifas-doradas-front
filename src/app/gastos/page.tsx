'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatearInputPesos, parsearInputPesos, formatoMonedaCOP } from '@/utils/formatPesos'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN']

type Gasto = {
  id: string
  usuario_id: string
  usuario_nombre: string
  usuario_rol: string
  concepto: string
  monto: number
  fecha_gasto: string
  notas: string | null
  created_at: string
}

type ResumenAdmin = {
  usuario_id: string
  usuario_nombre: string
  usuario_rol: string
  cantidad: number
  total: number
}

type Resumen = {
  total_general: number
  cantidad_total: number
  por_admin: ResumenAdmin[]
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function formatFecha(fecha: string): string {
  try {
    // fecha_gasto llega como YYYY-MM-DD o ISO; se muestra sin desfase de zona
    const soloFecha = String(fecha).slice(0, 10)
    const [y, m, d] = soloFecha.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return fecha
  }
}

export default function GastosPage() {
  const router = useRouter()
  const [accesoDenegado, setAccesoDenegado] = useState(false)
  const [userId, setUserId] = useState('')
  const [esSuperAdmin, setEsSuperAdmin] = useState(false)

  const [gastos, setGastos] = useState<Gasto[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  // Formulario
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState(0)
  const [fechaGasto, setFechaGasto] = useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState<string | null>(null)

  const cargarGastos = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/gastos`, { headers: authHeaders() })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || 'No se pudieron cargar los gastos')
      }
      const data = await res.json()
      setGastos(data.gastos || [])
      setResumen(data.resumen || null)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error cargando gastos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (!token || !userData) {
      router.push('/login')
      return
    }
    try {
      const user = JSON.parse(userData)
      const rol = String(user?.rol || '').toUpperCase()
      if (!ALLOWED_ROLES.includes(rol)) {
        setAccesoDenegado(true)
        setLoading(false)
        return
      }
      setUserId(String(user?.id || ''))
      setEsSuperAdmin(rol === 'SUPER_ADMIN')
    } catch {
      router.push('/login')
      return
    }
    void cargarGastos()
  }, [router, cargarGastos])

  const registrarGasto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (guardando) return
    if (concepto.trim().length < 3) {
      setError('Describe el gasto (mínimo 3 letras)')
      return
    }
    if (!monto || monto <= 0) {
      setError('Ingresa el valor del gasto')
      return
    }
    setGuardando(true)
    setError(null)
    setExito(null)
    try {
      const res = await fetch(`${API_BASE}/gastos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          concepto: concepto.trim(),
          monto,
          fecha_gasto: fechaGasto || undefined,
          notas: notas.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || 'No se pudo registrar el gasto')
      }
      setConcepto('')
      setMonto(0)
      setNotas('')
      setFechaGasto(new Date().toISOString().slice(0, 10))
      setExito('Gasto registrado correctamente')
      setTimeout(() => setExito(null), 4000)
      await cargarGastos()
    } catch (err: any) {
      setError(err.message || 'Error registrando gasto')
    } finally {
      setGuardando(false)
    }
  }

  const eliminarGasto = async (gasto: Gasto) => {
    if (eliminando) return
    const ok = window.confirm(
      `¿Eliminar el gasto "${gasto.concepto}" por ${formatoMonedaCOP(gasto.monto)}?`
    )
    if (!ok) return
    setEliminando(gasto.id)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/gastos/${gasto.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || 'No se pudo eliminar el gasto')
      }
      await cargarGastos()
    } catch (err: any) {
      setError(err.message || 'Error eliminando gasto')
    } finally {
      setEliminando(null)
    }
  }

  if (accesoDenegado)
    return (
      <div className="flex items-center justify-center p-8">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Acceso Restringido</h2>
          <p className="text-slate-500 mb-6">Este módulo no está disponible para tu rol.</p>
          <button
            onClick={() => router.push('/mis-reportes')}
            className="w-full py-3 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-colors"
          >
            Ir a mis reportes
          </button>
        </div>
      </div>
    )

  if (loading)
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-slate-500">Cargando gastos...</div>
      </div>
    )

  const misGastos = resumen?.por_admin.find((a) => a.usuario_id === userId)

  return (
    <div className="w-full min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gastos</h1>
        <p className="text-slate-500 text-sm">
          Registra tus gastos y consulta los de todos los administradores.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {exito && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          ✓ {exito}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total general
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {formatoMonedaCOP(resumen?.total_general || 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {resumen?.cantidad_total || 0} gasto(s) registrados
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Mis gastos
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {formatoMonedaCOP(misGastos?.total || 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {misGastos?.cantidad || 0} gasto(s) reportados por mí
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Admins con gastos
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {resumen?.por_admin.length || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">con al menos un gasto</p>
        </div>
      </div>

      {/* Registrar gasto */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Reportar un gasto</h2>
        <form onSubmit={registrarGasto} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Concepto *</span>
            <input
              type="text"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              maxLength={200}
              placeholder="Ej. Publicidad en redes"
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Valor *</span>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatearInputPesos(monto)}
                onChange={(e) => setMonto(parsearInputPesos(e.target.value))}
                placeholder="0"
                className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                required
              />
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Fecha del gasto</span>
            <input
              type="date"
              value={fechaGasto}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setFechaGasto(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Notas (opcional)</span>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              maxLength={1000}
              placeholder="Detalle adicional"
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={guardando}
              className="px-6 py-2.5 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-colors disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Registrar gasto'}
            </button>
          </div>
        </form>
      </div>

      {/* Totales por admin */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Total por administrador</h2>
        {!resumen?.por_admin.length ? (
          <p className="text-slate-500 text-sm">Aún no hay gastos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4">Administrador</th>
                  <th className="py-2 pr-4">Rol</th>
                  <th className="py-2 pr-4 text-right">Gastos</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {resumen.por_admin.map((a) => (
                  <tr key={a.usuario_id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-slate-900">
                      {a.usuario_nombre}
                      {a.usuario_id === userId && (
                        <span className="ml-2 text-[10px] font-bold uppercase text-sky-600">
                          Tú
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-500">{a.usuario_rol}</td>
                    <td className="py-2.5 pr-4 text-right text-slate-700">{a.cantidad}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">
                      {formatoMonedaCOP(a.total)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50">
                  <td className="py-2.5 pr-4 font-bold text-slate-900" colSpan={2}>
                    Total general
                  </td>
                  <td className="py-2.5 pr-4 text-right font-bold text-slate-900">
                    {resumen.cantidad_total}
                  </td>
                  <td className="py-2.5 text-right font-bold text-slate-900">
                    {formatoMonedaCOP(resumen.total_general)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lista de todos los gastos */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4">
          Todos los gastos ({gastos.length})
        </h2>
        {!gastos.length ? (
          <p className="text-slate-500 text-sm">Aún no hay gastos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Concepto</th>
                  <th className="py-2 pr-4">Administrador</th>
                  <th className="py-2 pr-4 text-right">Valor</th>
                  <th className="py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {gastos.map((g) => {
                  const puedeEliminar = esSuperAdmin || g.usuario_id === userId
                  return (
                    <tr key={g.id} className="border-b border-slate-100 last:border-0 align-top">
                      <td className="py-2.5 pr-4 whitespace-nowrap text-slate-700">
                        {formatFecha(g.fecha_gasto)}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-900">
                        <span className="font-medium">{g.concepto}</span>
                        {g.notas && (
                          <p className="text-xs text-slate-500 mt-0.5">{g.notas}</p>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-700 whitespace-nowrap">
                        {g.usuario_nombre}
                        {g.usuario_id === userId && (
                          <span className="ml-1.5 text-[10px] font-bold uppercase text-sky-600">
                            Tú
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatoMonedaCOP(g.monto)}
                      </td>
                      <td className="py-2.5 text-right">
                        {puedeEliminar ? (
                          <button
                            onClick={() => eliminarGasto(g)}
                            disabled={eliminando === g.id}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold disabled:opacity-50"
                          >
                            {eliminando === g.id ? 'Eliminando…' : 'Eliminar'}
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
