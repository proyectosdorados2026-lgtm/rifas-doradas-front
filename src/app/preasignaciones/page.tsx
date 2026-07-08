'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ClienteSearch from '@/components/ventas/ClienteSearch'
import { rifaApi } from '@/lib/rifaApi'
import type { Rifa } from '@/types/rifa'
import type { Cliente } from '@/types/ventas'
import {
  preasignacionesApi,
  type Preasignacion,
  type AplicarResultado,
} from '@/lib/preasignacionesApi'

type ConfirmState = {
  title: string
  message: string
  type?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
} | null

function formatNumero(n: number) {
  return String(n).padStart(4, '0')
}

function formatFecha(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
}

const ESTADO_RIFA_STYLE: Record<string, string> = {
  ACTIVA: 'bg-emerald-100 text-emerald-700',
  BORRADOR: 'bg-slate-100 text-slate-700',
  PAUSADA: 'bg-amber-100 text-amber-700',
  TERMINADA: 'bg-red-100 text-red-700',
  CANCELADA: 'bg-red-100 text-red-700',
}

export default function PreasignacionesPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; nombre: string; rol: string } | null>(null)

  const [items, setItems] = useState<Preasignacion[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmState>(null)

  // Formulario alta/edición
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Preasignacion | null>(null)
  const [formCliente, setFormCliente] = useState<Cliente | null>(null)
  const [formNumero, setFormNumero] = useState('')
  const [formNotas, setFormNotas] = useState('')

  // Modal "Asignar a la nueva rifa" (solo SUPER_ADMIN)
  const [showAplicar, setShowAplicar] = useState(false)
  const [rifas, setRifas] = useState<Rifa[]>([])
  const [rifaSeleccionada, setRifaSeleccionada] = useState('')
  const [cargandoRifas, setCargandoRifas] = useState(false)
  const [aplicando, setAplicando] = useState(false)
  const [resultadoAplicar, setResultadoAplicar] = useState<AplicarResultado | null>(null)

  const esSuperAdmin = user?.rol?.toUpperCase() === 'SUPER_ADMIN'

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (!token || !userData) { router.push('/login'); return }
    try {
      const parsed = JSON.parse(userData)
      if (!['SUPER_ADMIN', 'ADMIN', 'VENDEDOR'].includes(parsed.rol?.toUpperCase())) {
        router.push('/dashboard')
        return
      }
      setUser(parsed)
    } catch { router.push('/login') }
  }, [router])

  const cargar = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await preasignacionesApi.listar(q)
      setItems(data)
    } catch (e: any) {
      setError(e.message || 'Error al cargar las preasignaciones')
    } finally {
      setLoading(false)
    }
  }, [q])

  useEffect(() => {
    if (!user) return
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const buscar = () => cargar()

  const abrirNuevo = () => {
    setEditando(null)
    setFormCliente(null)
    setFormNumero('')
    setFormNotas('')
    setShowForm(true)
  }

  const abrirEditar = (item: Preasignacion) => {
    setEditando(item)
    setFormCliente({
      id: item.cliente_id,
      nombre: item.cliente_nombre,
      telefono: item.cliente_telefono || '',
      email: item.cliente_email || '',
      identificacion: item.cliente_identificacion || '',
      direccion: '',
    })
    setFormNumero(String(item.numero_boleta))
    setFormNotas(item.notas || '')
    setShowForm(true)
  }

  const guardar = async () => {
    setError(''); setAviso('')
    if (!formCliente) { setError('Selecciona un cliente existente.'); return }
    const numero = Number(formNumero)
    if (!Number.isInteger(numero) || numero < 0 || numero > 9999) {
      setError('El número de boleta debe estar entre 0 y 9999.')
      return
    }

    setProcesando(true)
    try {
      if (editando) {
        await preasignacionesApi.actualizar(editando.id, {
          cliente_id: formCliente.id,
          numero_boleta: numero,
          notas: formNotas,
        })
        setAviso(`Preasignación #${formatNumero(numero)} actualizada.`)
      } else {
        await preasignacionesApi.crear({
          cliente_id: formCliente.id!,
          numero_boleta: numero,
          notas: formNotas,
        })
        setAviso(`Boleta #${formatNumero(numero)} preasignada a ${formCliente.nombre}.`)
      }
      setShowForm(false)
      await cargar()
    } catch (e: any) {
      setError(e.message || 'Error al guardar la preasignación')
    } finally {
      setProcesando(false)
    }
  }

  const eliminar = (item: Preasignacion) => {
    setConfirm({
      title: 'Eliminar preasignación',
      message: `Se eliminará la preasignación del número #${formatNumero(item.numero_boleta)} para ${item.cliente_nombre}. Esto NO afecta ninguna venta o boleta ya creada anteriormente.`,
      type: 'danger',
      onConfirm: async () => {
        setProcesando(true); setError(''); setAviso('')
        try {
          await preasignacionesApi.eliminar(item.id)
          setAviso('Preasignación eliminada.')
          await cargar()
        } catch (e: any) {
          setError(e.message || 'Error al eliminar')
        } finally {
          setProcesando(false)
          setConfirm(null)
        }
      },
    })
  }

  const abrirAplicar = async () => {
    setShowAplicar(true)
    setResultadoAplicar(null)
    setRifaSeleccionada('')
    setCargandoRifas(true)
    try {
      const res = await rifaApi.getRifasOperativas()
      setRifas(res.data || [])
    } catch (e: any) {
      setError(e.message || 'Error al cargar rifas')
    } finally {
      setCargandoRifas(false)
    }
  }

  const confirmarAplicar = () => {
    if (!rifaSeleccionada) return
    const rifa = rifas.find((r) => r.id === rifaSeleccionada)
    setConfirm({
      title: 'Asignar boletas preasignadas a esta rifa',
      message: `Se intentará reservar cada número preasignado en "${rifa?.nombre}". Las boletas que ya estén vendidas, reservadas o no existan se OMITIRÁN sin tocarlas. Las que estén DISPONIBLE quedarán como una reserva formal (venta pendiente) a nombre del cliente correspondiente. ¿Continuar?`,
      type: 'warning',
      onConfirm: async () => {
        setAplicando(true); setError('')
        try {
          const resultado = await preasignacionesApi.aplicarARifa(rifaSeleccionada)
          setResultadoAplicar(resultado)
          await cargar()
        } catch (e: any) {
          setError(e.message || 'Error al aplicar las preasignaciones')
        } finally {
          setAplicando(false)
          setConfirm(null)
        }
      },
    })
  }

  if (!user) {
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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <button onClick={() => router.push('/dashboard')} className="text-sm text-slate-500 hover:text-slate-800 mb-1">
              ← Dashboard
            </button>
            <h1 className="text-xl font-bold text-slate-900">Boletas Preasignadas</h1>
            <p className="text-xs text-slate-500">
              Guarda qué número le corresponde a cada cliente fijo, y aplícalo de un clic cuando salga la próxima rifa.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {esSuperAdmin && (
              <button
                onClick={abrirAplicar}
                className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 text-sm"
              >
                Asignar a la nueva rifa
              </button>
            )}
            <button
              onClick={abrirNuevo}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 text-sm"
            >
              + Nueva asignación
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Buscar por número, nombre, cédula o teléfono
          </label>
          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscar()}
              placeholder="Ej: 0047  ó  Juan Pérez"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={buscar}
              className="px-5 py-2.5 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-800"
            >
              Buscar
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>
        )}
        {aviso && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm">{aviso}</div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center gap-3 text-slate-500 text-sm py-10 justify-center">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              Cargando...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No hay boletas preasignadas todavía. Usa &quot;+ Nueva asignación&quot; para agregar la primera.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Número</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Notas</th>
                  <th className="px-4 py-3 font-medium">Última aplicación</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-slate-800">#{formatNumero(item.numero_boleta)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{item.cliente_nombre}</div>
                      <div className="text-xs text-slate-500">
                        {item.cliente_identificacion || '—'} · {item.cliente_telefono || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[240px] truncate" title={item.notas || ''}>
                      {item.notas || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {item.ultima_aplicacion_en ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          {item.ultima_aplicacion_rifa_nombre} · {formatFecha(item.ultima_aplicacion_en)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Aún no aplicada</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => abrirEditar(item)} className="text-indigo-600 hover:text-indigo-800 font-medium mr-3">
                        Editar
                      </button>
                      <button onClick={() => eliminar(item)} className="text-red-600 hover:text-red-800 font-medium">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modal: alta / edición */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {editando ? `Editar preasignación #${formatNumero(editando.numero_boleta)}` : 'Nueva preasignación'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {formCliente ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">{formCliente.nombre}</p>
                    <p className="text-xs text-emerald-700">
                      {formCliente.identificacion || '—'} · {formCliente.telefono || '—'}
                    </p>
                  </div>
                  <button
                    onClick={() => setFormCliente(null)}
                    className="text-xs font-medium text-emerald-800 hover:text-emerald-950"
                  >
                    Cambiar cliente
                  </button>
                </div>
              ) : (
                <ClienteSearch permitirCrear={false} onClienteSelected={(c) => setFormCliente(c)} />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Número de boleta</label>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={formNumero}
                    onChange={(e) => setFormNumero(e.target.value)}
                    placeholder="Ej: 47"
                    className="w-full px-3 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Notas (opcional)</label>
                  <input
                    value={formNotas}
                    onChange={(e) => setFormNotas(e.target.value)}
                    placeholder="Ej: siempre pide el mismo número"
                    className="w-full px-3 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-black"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={procesando || !formCliente || !formNumero}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
              >
                {procesando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: aplicar a nueva rifa (SUPER_ADMIN) */}
      {showAplicar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Asignar boletas preasignadas a una rifa</h3>
              <button onClick={() => setShowAplicar(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {!resultadoAplicar ? (
                <>
                  <p className="text-sm text-slate-600">
                    Se revisará cada uno de los {items.length} número(s) preasignado(s). Las boletas que ya estén
                    vendidas o reservadas por otro motivo NO se tocarán; solo se reservan las que estén disponibles.
                  </p>
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">Rifa destino</label>
                    {cargandoRifas ? (
                      <p className="text-sm text-slate-500">Cargando rifas...</p>
                    ) : (
                      <select
                        value={rifaSeleccionada}
                        onChange={(e) => setRifaSeleccionada(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-400 rounded-lg bg-white text-black"
                      >
                        <option value="">Selecciona una rifa...</option>
                        {rifas.map((r) => (
                          <option key={r.id} value={r.id} disabled={['TERMINADA', 'CANCELADA'].includes(r.estado)}>
                            {r.nombre} ({r.estado}){['TERMINADA', 'CANCELADA'].includes(r.estado) ? ' - no disponible' : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                    Listo. {resultadoAplicar.asignadas.length} de {resultadoAplicar.total_preasignaciones} boleta(s)
                    quedaron reservadas en &quot;{resultadoAplicar.rifa_nombre}&quot;.
                  </div>

                  {resultadoAplicar.asignadas.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Asignadas</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {resultadoAplicar.asignadas.map((a) => (
                          <div key={a.venta_id} className="text-sm text-slate-700">
                            #{formatNumero(a.numero_boleta)} → {a.cliente_nombre}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {resultadoAplicar.omitidas.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-2">
                        Omitidas ({resultadoAplicar.omitidas.length})
                      </p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {resultadoAplicar.omitidas.map((o, i) => (
                          <div key={i} className="text-sm text-slate-600">
                            #{formatNumero(o.numero_boleta)} ({o.cliente_nombre}): {o.motivo}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowAplicar(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
              >
                {resultadoAplicar ? 'Cerrar' : 'Cancelar'}
              </button>
              {!resultadoAplicar && (
                <button
                  onClick={confirmarAplicar}
                  disabled={!rifaSeleccionada || aplicando}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium"
                >
                  {aplicando ? 'Aplicando...' : 'Aplicar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          isOpen={!!confirm}
          title={confirm.title}
          message={confirm.message}
          type={confirm.type}
          confirmText={procesando || aplicando ? 'Procesando...' : 'Confirmar'}
          onConfirm={confirm.onConfirm}
          onCancel={() => !(procesando || aplicando) && setConfirm(null)}
        />
      )}
    </div>
  )
}
