'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/admin/PageHeader'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { rifaApi } from '@/lib/rifaApi'
import type { Rifa } from '@/types/rifa'
import {
  inventarioApi,
  type InventarioDetalle,
  type InventarioResumen,
  type InventarioVendedorResumen,
} from '@/lib/inventarioApi'

const formatNumero = (n: number) => String(n).padStart(4, '0')

/** La serie es la milésima del número: serie 0 = 0000-0999, serie 1 = 1000-1999, etc. */
const SERIES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

function parseNumeros(texto: string): { numeros: number[]; error: string | null } {
  const partes = texto
    .split(/[\s,;]+/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (partes.length === 0) return { numeros: [], error: 'Escribe al menos un número' }

  const numeros: number[] = []
  for (const parte of partes) {
    const n = Number(parte)
    if (!Number.isInteger(n) || n < 0 || n > 9999) {
      return { numeros: [], error: `"${parte}" no es un número de boleta válido (0 a 9999)` }
    }
    numeros.push(n)
  }
  return { numeros: [...new Set(numeros)], error: null }
}

type ConfirmState = {
  title: string
  message: string
  type: 'danger' | 'warning' | 'info'
  confirmText?: string
  onConfirm: () => void
} | null

const btnPrimario =
  'px-4 py-2.5 bg-[var(--primary)] text-black border-[1.5px] border-black font-bold uppercase text-xs tracking-wider shadow-[3px_3px_0_#101010] disabled:opacity-50 disabled:shadow-none'
const btnSecundario =
  'px-3 py-2 bg-white text-black border-[1.5px] border-black font-bold uppercase text-[11px] tracking-wider disabled:opacity-50'
const btnPeligro =
  'px-3 py-2 bg-red-600 text-white border-[1.5px] border-black font-bold uppercase text-[11px] tracking-wider disabled:opacity-50'
const inputBase =
  'w-full px-3 py-2 border-[1.5px] border-black text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]'
const labelBase =
  'block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] mb-1'

export default function InventarioVendedoresPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; nombre: string; rol: string } | null>(null)

  const [rifas, setRifas] = useState<Rifa[]>([])
  const [rifaId, setRifaId] = useState('')
  const [resumen, setResumen] = useState<InventarioResumen | null>(null)
  const [detalle, setDetalle] = useState<InventarioDetalle | null>(null)
  const [vendedorAbierto, setVendedorAbierto] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [confirm, setConfirm] = useState<ConfirmState>(null)

  const [modoAsignar, setModoAsignar] = useState<'serie' | 'numeros'>('serie')
  const [asignarVendedor, setAsignarVendedor] = useState('')
  const [asignarSerie, setAsignarSerie] = useState('0')
  const [asignarCantidad, setAsignarCantidad] = useState('500')
  const [asignarNumeros, setAsignarNumeros] = useState('')
  const [quitarNumeros, setQuitarNumeros] = useState('')

  const esSuperAdmin = (user?.rol || '').toUpperCase() === 'SUPER_ADMIN'

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (!token || !userData) {
      router.push('/login')
      return
    }
    try {
      const parsed = JSON.parse(userData)
      if (!['SUPER_ADMIN', 'ADMIN'].includes((parsed.rol || '').toUpperCase())) {
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
    const cargarRifas = async () => {
      try {
        const res = await rifaApi.getRifasOperativas()
        const lista = res.data || []
        setRifas(lista)
        if (lista.length > 0) setRifaId(lista[0].id)
        else setLoading(false)
      } catch (e: any) {
        setError(e.message || 'Error al cargar los proyectos')
        setLoading(false)
      }
    }
    cargarRifas()
  }, [user])

  const cargarResumen = useCallback(async () => {
    if (!rifaId) return
    setLoading(true)
    setError('')
    try {
      const data = await inventarioApi.getResumen(rifaId)
      setResumen(data)
    } catch (e: any) {
      setError(e.message || 'Error al cargar el inventario')
      setResumen(null)
    } finally {
      setLoading(false)
    }
  }, [rifaId])

  useEffect(() => {
    setDetalle(null)
    setVendedorAbierto(null)
    cargarResumen()
  }, [cargarResumen])

  const vendedores = useMemo(() => resumen?.vendedores || [], [resumen])
  const soloVendedores = useMemo(
    () => vendedores.filter((v) => v.rol.toUpperCase() === 'VENDEDOR'),
    [vendedores]
  )

  const librosPorSerie = useMemo(() => {
    const mapa = new Map<number, number>()
    for (const s of resumen?.series_libres || []) mapa.set(s.serie, s.libres)
    return mapa
  }, [resumen])

  const abrirDetalle = async (vendedorId: string) => {
    if (vendedorAbierto === vendedorId) {
      setVendedorAbierto(null)
      setDetalle(null)
      return
    }
    setVendedorAbierto(vendedorId)
    setDetalle(null)
    try {
      const data = await inventarioApi.getDetalleVendedor(rifaId, vendedorId)
      setDetalle(data)
    } catch (e: any) {
      setError(e.message || 'Error al cargar el detalle del vendedor')
    }
  }

  const ejecutarAsignar = async () => {
    setProcesando(true)
    setError('')
    setAviso('')
    try {
      const payload =
        modoAsignar === 'serie'
          ? {
              vendedor_id: asignarVendedor,
              serie: Number(asignarSerie),
              cantidad: Number(asignarCantidad),
            }
          : {
              vendedor_id: asignarVendedor,
              numeros: parseNumeros(asignarNumeros).numeros,
            }

      const resultado = await inventarioApi.asignar(rifaId, payload)
      const pedidas = modoAsignar === 'serie' ? Number(asignarCantidad) : payload.numeros!.length

      if (resultado.asignadas === 0) {
        setError(
          'No se asignó ninguna boleta. Puede que ya tengan dueño, estén vendidas o tengan un bloqueo temporal activo.'
        )
      } else if (resultado.asignadas < pedidas) {
        setAviso(
          `Se asignaron ${resultado.asignadas} de ${pedidas} boletas a ${resultado.vendedor.nombre}. Las demás ya no estaban libres.`
        )
      } else {
        setAviso(`Se asignaron ${resultado.asignadas} boletas a ${resultado.vendedor.nombre}.`)
      }

      setAsignarNumeros('')
      await cargarResumen()
      if (vendedorAbierto) {
        setDetalle(await inventarioApi.getDetalleVendedor(rifaId, vendedorAbierto))
      }
    } catch (e: any) {
      setError(e.message || 'Error al asignar las boletas')
    } finally {
      setProcesando(false)
      setConfirm(null)
    }
  }

  const confirmarAsignar = () => {
    setError('')
    setAviso('')
    if (!asignarVendedor) {
      setError('Elige a qué vendedor le vas a asignar las boletas.')
      return
    }
    const vendedor = vendedores.find((v) => v.id === asignarVendedor)

    if (modoAsignar === 'serie') {
      const cantidad = Number(asignarCantidad)
      if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 5000) {
        setError('La cantidad debe ser un número entre 1 y 5000.')
        return
      }
      const serie = Number(asignarSerie)
      const libres = librosPorSerie.get(serie) || 0
      setConfirm({
        title: 'Asignar boletas por serie',
        message: `Se asignarán ${cantidad} boletas aleatorias de la serie ${serie} (${formatNumero(
          serie * 1000
        )}-${formatNumero(serie * 1000 + 999)}) a ${vendedor?.nombre}. Hay ${libres} libres en esa serie. ${
          cantidad > libres ? 'Se asignarán solo las que estén disponibles. ' : ''
        }Solo se toman boletas DISPONIBLES: nada de lo ya vendido, reservado o abonado se toca.`,
        type: 'info',
        confirmText: 'Asignar',
        onConfirm: ejecutarAsignar,
      })
      return
    }

    const { numeros, error: errorNumeros } = parseNumeros(asignarNumeros)
    if (errorNumeros) {
      setError(errorNumeros)
      return
    }
    setConfirm({
      title: 'Asignar números específicos',
      message: `Se intentará asignar ${numeros.length} boleta(s) a ${vendedor?.nombre}: ${numeros
        .slice(0, 20)
        .map(formatNumero)
        .join(', ')}${numeros.length > 20 ? '…' : ''}. Las que no estén DISPONIBLES se omitirán.`,
      type: 'info',
      confirmText: 'Asignar',
      onConfirm: ejecutarAsignar,
    })
  }

  const ejecutarQuitarNumeros = async (vendedorId: string | null, numeros: number[]) => {
    setProcesando(true)
    setError('')
    setAviso('')
    try {
      const resultado = await inventarioApi.quitar(rifaId, {
        vendedor_id: vendedorId,
        numeros,
      })
      if (resultado.liberadas === 0) {
        setError(
          'No se liberó ninguna boleta. Solo se pueden quitar boletas DISPONIBLES sin bloqueo activo.'
        )
      } else {
        setAviso(`${resultado.liberadas} boleta(s) volvieron al pool sin asignar.`)
      }
      setQuitarNumeros('')
      await cargarResumen()
      if (vendedorAbierto) {
        setDetalle(await inventarioApi.getDetalleVendedor(rifaId, vendedorAbierto))
      }
    } catch (e: any) {
      setError(e.message || 'Error al liberar las boletas')
    } finally {
      setProcesando(false)
      setConfirm(null)
    }
  }

  const confirmarQuitarNumeros = () => {
    setError('')
    setAviso('')
    const { numeros, error: errorNumeros } = parseNumeros(quitarNumeros)
    if (errorNumeros) {
      setError(errorNumeros)
      return
    }
    setConfirm({
      title: 'Quitar boletas del inventario',
      message: `Se quitarán ${numeros.length} boleta(s) del vendedor que las tenga y volverán al pool común: ${numeros
        .slice(0, 20)
        .map(formatNumero)
        .join(', ')}${numeros.length > 20 ? '…' : ''}. Las que estén vendidas, abonadas o reservadas se omiten.`,
      type: 'danger',
      confirmText: 'Quitar',
      onConfirm: () => ejecutarQuitarNumeros(null, numeros),
    })
  }

  const confirmarVaciarVendedor = (vendedor: InventarioVendedorResumen) => {
    setConfirm({
      title: `Vaciar inventario de ${vendedor.nombre}`,
      message: `Se liberarán las ${vendedor.asignadas_libres} boletas DISPONIBLES asignadas a ${vendedor.nombre} y volverán al pool común. Sus ventas en curso (${vendedor.reservadas} reservadas, ${vendedor.abonadas} abonadas, ${vendedor.pagadas} pagadas) no se tocan.`,
      type: 'danger',
      confirmText: 'Vaciar',
      onConfirm: async () => {
        setProcesando(true)
        setError('')
        setAviso('')
        try {
          const resultado = await inventarioApi.quitar(rifaId, { vendedor_id: vendedor.id })
          setAviso(`${resultado.liberadas} boleta(s) liberadas de ${vendedor.nombre}.`)
          await cargarResumen()
          if (vendedorAbierto === vendedor.id) {
            setDetalle(await inventarioApi.getDetalleVendedor(rifaId, vendedor.id))
          }
        } catch (e: any) {
          setError(e.message || 'Error al vaciar el inventario')
        } finally {
          setProcesando(false)
          setConfirm(null)
        }
      },
    })
  }

  const confirmarFlag = (activar: boolean) => {
    const sinStock = soloVendedores.filter((v) => v.asignadas_libres === 0)
    setConfirm({
      title: activar ? 'Activar inventario por vendedor' : 'Desactivar inventario por vendedor',
      message: activar
        ? `A partir de ahora, en "${resumen?.rifa.nombre}" cada vendedor solo podrá vender las boletas que tenga asignadas. Los administradores venderán del pool sin asignar y la web tampoco ofrecerá las asignadas. Las ventas ya en curso siguen igual.${
            sinStock.length > 0
              ? ` ATENCIÓN: ${
                  sinStock.length === soloVendedores.length
                    ? 'ningún vendedor tiene'
                    : `${sinStock.length} vendedor(es) no tienen`
                } boletas libres asignadas todavía y no podrán vender nada nuevo: ${sinStock
                  .map((v) => v.nombre)
                  .join(', ')}.`
              : ''
          }`
        : `Se volverá al funcionamiento anterior: todos podrán vender cualquier boleta disponible. Las asignaciones quedan guardadas pero se ignoran.`,
      type: activar ? 'warning' : 'info',
      confirmText: activar ? 'Activar' : 'Desactivar',
      onConfirm: async () => {
        setProcesando(true)
        setError('')
        setAviso('')
        try {
          const res = await inventarioApi.setFlag(rifaId, activar)
          setAviso(
            res.inventario_por_vendedor
              ? 'Inventario por vendedor ACTIVADO en este proyecto.'
              : 'Inventario por vendedor desactivado. Todo vuelve al comportamiento anterior.'
          )
          await cargarResumen()
        } catch (e: any) {
          setError(e.message || 'Error al cambiar la configuración')
        } finally {
          setProcesando(false)
          setConfirm(null)
        }
      },
    })
  }

  const confirmarSembrar = () => {
    setConfirm({
      title: 'Registrar ventas existentes en el inventario',
      message:
        'Se registrarán en el inventario las boletas que ya tienen venta (reservadas, abonadas, pagadas) a nombre del vendedor que las vendió. Es solo para ver quién tiene qué: no cambia estados, ni ventas, ni permisos de abono.',
      type: 'info',
      confirmText: 'Registrar',
      onConfirm: async () => {
        setProcesando(true)
        setError('')
        setAviso('')
        try {
          const res = await inventarioApi.sembrar(rifaId)
          setAviso(`${res.registradas} boleta(s) con venta quedaron registradas en el inventario.`)
          await cargarResumen()
        } catch (e: any) {
          setError(e.message || 'Error al registrar las ventas existentes')
        } finally {
          setProcesando(false)
          setConfirm(null)
        }
      },
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[var(--text-secondary)]">Cargando...</span>
        </div>
      </div>
    )
  }

  const flagActivo = Boolean(resumen?.rifa.inventario_por_vendedor)

  return (
    <div className="min-h-screen">
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-6xl">
        <PageHeader
          eyebrow="Operación"
          title="Inventario de vendedores"
          description="Reparte boletas disponibles entre los vendedores. Cada vendedor solo puede vender las suyas; las ventas ya en curso no se alteran."
          actions={
            esSuperAdmin && resumen ? (
              <button
                onClick={() => confirmarFlag(!flagActivo)}
                disabled={procesando}
                className={flagActivo ? btnPeligro : btnPrimario}
              >
                {flagActivo ? 'Desactivar inventario' : 'Activar inventario'}
              </button>
            ) : undefined
          }
        />

        <div className="mb-4">
          <label className={labelBase} htmlFor="rifa">
            Proyecto
          </label>
          <select
            id="rifa"
            value={rifaId}
            onChange={(e) => setRifaId(e.target.value)}
            className={`${inputBase} max-w-md`}
          >
            {rifas.length === 0 && <option value="">Sin proyectos disponibles</option>}
            {rifas.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 border-[1.5px] border-black bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {aviso && (
          <div className="mb-4 border-[1.5px] border-black bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {aviso}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 py-10">
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[var(--text-secondary)]">Cargando inventario...</span>
          </div>
        )}

        {!loading && resumen && (
          <>
            <div
              className={`mb-5 border-[1.5px] border-black px-4 py-3 text-sm ${
                flagActivo ? 'bg-emerald-50' : 'bg-amber-50'
              }`}
            >
              <p className="font-bold uppercase text-[11px] tracking-[0.14em] mb-1">
                {flagActivo ? 'Inventario activo' : 'Inventario apagado'}
              </p>
              <p className="text-[var(--text-secondary)]">
                {flagActivo
                  ? 'Cada vendedor solo vende sus boletas asignadas. Los administradores venden del pool sin asignar y la web tampoco ofrece las asignadas.'
                  : 'Todos pueden vender cualquier boleta disponible, como siempre. Puedes asignar inventario con calma y activarlo cuando esté listo.'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Libres sin dueño', valor: resumen.pool.disponibles_libres },
                {
                  label: 'Asignadas a vendedores',
                  valor: vendedores.reduce((acc, v) => acc + v.asignadas_libres, 0),
                },
                { label: 'Bloqueos vigentes', valor: resumen.bloqueos_vigentes },
                { label: 'Total del proyecto', valor: resumen.rifa.total_boletas },
              ].map((kpi) => (
                <div key={kpi.label} className="border-[1.5px] border-black bg-white px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    {kpi.label}
                  </p>
                  <p className="text-xl font-[800] mt-1">{kpi.valor.toLocaleString('es-CO')}</p>
                </div>
              ))}
            </div>

            <section className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] mb-2">
                Boletas libres por serie
              </h2>
              <div className="flex flex-wrap gap-2">
                {SERIES.map((serie) => {
                  const libres = librosPorSerie.get(serie) || 0
                  return (
                    <div
                      key={serie}
                      className={`border-[1.5px] border-black px-3 py-2 text-center min-w-[92px] ${
                        libres > 0 ? 'bg-white' : 'bg-slate-100 opacity-60'
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                        Serie {serie}
                      </p>
                      <p className="text-base font-[800]">{libres.toLocaleString('es-CO')}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {formatNumero(serie * 1000)}-{formatNumero(serie * 1000 + 999)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </section>

            {esSuperAdmin && (
              <section className="mb-6 border-[1.5px] border-black bg-white p-4">
                <h2 className="text-sm font-bold uppercase tracking-[0.14em] mb-3">
                  Asignar boletas
                </h2>

                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setModoAsignar('serie')}
                    className={
                      modoAsignar === 'serie'
                        ? 'px-3 py-2 bg-black text-[var(--primary)] border-[1.5px] border-black font-bold uppercase text-[11px] tracking-wider'
                        : btnSecundario
                    }
                  >
                    Por serie
                  </button>
                  <button
                    onClick={() => setModoAsignar('numeros')}
                    className={
                      modoAsignar === 'numeros'
                        ? 'px-3 py-2 bg-black text-[var(--primary)] border-[1.5px] border-black font-bold uppercase text-[11px] tracking-wider'
                        : btnSecundario
                    }
                  >
                    Números específicos
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className={labelBase} htmlFor="vendedor">
                      Vendedor
                    </label>
                    <select
                      id="vendedor"
                      value={asignarVendedor}
                      onChange={(e) => setAsignarVendedor(e.target.value)}
                      className={inputBase}
                    >
                      <option value="">Selecciona un vendedor</option>
                      {vendedores
                        .filter((v) => v.activo)
                        .map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.nombre} ({v.rol === 'VENDEDOR' ? 'Vendedor' : v.rol})
                          </option>
                        ))}
                    </select>
                  </div>

                  {modoAsignar === 'serie' ? (
                    <>
                      <div>
                        <label className={labelBase} htmlFor="serie">
                          Serie
                        </label>
                        <select
                          id="serie"
                          value={asignarSerie}
                          onChange={(e) => setAsignarSerie(e.target.value)}
                          className={inputBase}
                        >
                          {SERIES.map((s) => (
                            <option key={s} value={s}>
                              Serie {s} ({formatNumero(s * 1000)}-{formatNumero(s * 1000 + 999)}) —{' '}
                              {librosPorSerie.get(s) || 0} libres
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelBase} htmlFor="cantidad">
                          Cantidad
                        </label>
                        <input
                          id="cantidad"
                          type="number"
                          min={1}
                          max={5000}
                          value={asignarCantidad}
                          onChange={(e) => setAsignarCantidad(e.target.value)}
                          className={inputBase}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-2">
                      <label className={labelBase} htmlFor="numeros">
                        Números (separados por coma o espacio)
                      </label>
                      <input
                        id="numeros"
                        type="text"
                        value={asignarNumeros}
                        onChange={(e) => setAsignarNumeros(e.target.value)}
                        placeholder="0123, 4335, 5000"
                        className={inputBase}
                      />
                    </div>
                  )}
                </div>

                <p className="text-xs text-[var(--text-secondary)] mt-3">
                  Solo se asignan boletas DISPONIBLES sin bloqueo activo. Se eligen al azar dentro de
                  la serie.
                </p>

                <div className="mt-3">
                  <button onClick={confirmarAsignar} disabled={procesando} className={btnPrimario}>
                    {procesando ? 'Procesando...' : 'Asignar'}
                  </button>
                </div>

                <div className="mt-6 pt-4 border-t-[1.5px] border-black">
                  <h3 className="text-xs font-bold uppercase tracking-[0.14em] mb-2">
                    Quitar números del inventario
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                    <div className="flex-1">
                      <label className={labelBase} htmlFor="quitar">
                        Números a liberar
                      </label>
                      <input
                        id="quitar"
                        type="text"
                        value={quitarNumeros}
                        onChange={(e) => setQuitarNumeros(e.target.value)}
                        placeholder="0123, 4335"
                        className={inputBase}
                      />
                    </div>
                    <button
                      onClick={confirmarQuitarNumeros}
                      disabled={procesando}
                      className={btnPeligro}
                    >
                      Quitar
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-2">
                    Vuelven al pool común. Nunca se quita una boleta vendida, abonada o reservada.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t-[1.5px] border-black flex flex-wrap items-center gap-3">
                  <button onClick={confirmarSembrar} disabled={procesando} className={btnSecundario}>
                    Registrar ventas existentes
                  </button>
                  <span className="text-xs text-[var(--text-secondary)]">
                    Deja ver quién vendió cada boleta ya reservada, abonada o pagada.
                  </span>
                </div>
              </section>
            )}

            <section>
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] mb-2">
                Inventario por persona
              </h2>
              {resumen.boletas_sin_vendedor > 0 && (
                <p className="text-xs text-[var(--text-secondary)] mb-2">
                  Hay {resumen.boletas_sin_vendedor} boleta(s) con venta pero sin vendedor
                  identificable.
                </p>
              )}

              <div className="overflow-x-auto border-[1.5px] border-black bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-black text-[var(--primary)]">
                    <tr>
                      {[
                        'Persona',
                        'Rol',
                        'Libres',
                        'Bloqueadas',
                        'Reservadas',
                        'Abonadas',
                        'Pagadas',
                        '',
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.12em] whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vendedores.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-3 py-6 text-center text-[var(--text-muted)]">
                          No hay vendedores registrados.
                        </td>
                      </tr>
                    )}
                    {vendedores.map((v) => (
                      <tr key={v.id} className="border-t border-black/20 align-top">
                        <td className="px-3 py-2 font-semibold whitespace-nowrap">
                          {v.nombre}
                          {!v.activo && (
                            <span className="ml-2 text-[10px] uppercase text-[var(--text-muted)]">
                              inactivo
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs whitespace-nowrap">{v.rol}</td>
                        <td className="px-3 py-2 font-bold">{v.asignadas_libres}</td>
                        <td className="px-3 py-2">{v.asignadas_bloqueadas}</td>
                        <td className="px-3 py-2">{v.reservadas}</td>
                        <td className="px-3 py-2">{v.abonadas}</td>
                        <td className="px-3 py-2">{v.pagadas}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button onClick={() => abrirDetalle(v.id)} className={btnSecundario}>
                              {vendedorAbierto === v.id ? 'Cerrar' : 'Ver'}
                            </button>
                            {esSuperAdmin && v.asignadas_libres > 0 && (
                              <button
                                onClick={() => confirmarVaciarVendedor(v)}
                                disabled={procesando}
                                className={btnPeligro}
                              >
                                Vaciar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {vendedorAbierto && (
                <div className="mt-4 border-[1.5px] border-black bg-white p-4">
                  {!detalle ? (
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-[var(--text-secondary)]">Cargando detalle...</span>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-sm font-bold uppercase tracking-[0.14em] mb-1">
                        {detalle.vendedor.nombre}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] mb-3">
                        {detalle.total} boleta(s) en su inventario
                      </p>

                      {detalle.rangos.length > 0 && (
                        <div className="mb-4">
                          <p className={labelBase}>Rangos asignados</p>
                          <div className="flex flex-wrap gap-2">
                            {detalle.rangos.map((r) => (
                              <span
                                key={`${r.desde}-${r.hasta}`}
                                className="border-[1.5px] border-black px-2 py-1 text-xs font-semibold"
                              >
                                {r.desde === r.hasta
                                  ? `#${formatNumero(r.desde)}`
                                  : `#${formatNumero(r.desde)}-#${formatNumero(r.hasta)}`}{' '}
                                <span className="text-[var(--text-muted)]">({r.cantidad})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="max-h-72 overflow-y-auto border-[1.5px] border-black">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-100 sticky top-0">
                            <tr>
                              {['Boleta', 'Serie', 'Estado', 'Cliente', 'Asignada'].map((h) => (
                                <th
                                  key={h}
                                  className="px-2 py-1.5 text-left font-bold uppercase tracking-[0.1em] text-[10px]"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {detalle.boletas.map((b) => (
                              <tr key={b.boleta_id} className="border-t border-black/10">
                                <td className="px-2 py-1.5 font-semibold">
                                  {b.numeros.map(formatNumero).join(' / ')}
                                </td>
                                <td className="px-2 py-1.5">{b.serie ?? '—'}</td>
                                <td className="px-2 py-1.5">
                                  {b.estado}
                                  {b.bloqueada && (
                                    <span className="ml-1 text-[10px] text-amber-700">
                                      (bloqueada)
                                    </span>
                                  )}
                                </td>
                                <td className="px-2 py-1.5">{b.cliente_nombre || '—'}</td>
                                <td className="px-2 py-1.5 text-[var(--text-muted)]">
                                  {b.origen === 'SEMILLA' ? 'venta previa' : b.origen.toLowerCase()}
                                </td>
                              </tr>
                            ))}
                            {detalle.boletas.length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-2 py-4 text-center text-[var(--text-muted)]">
                                  Sin boletas asignadas.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(confirm)}
        title={confirm?.title || ''}
        message={confirm?.message || ''}
        type={confirm?.type || 'warning'}
        confirmText={confirm?.confirmText}
        onConfirm={() => confirm?.onConfirm()}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
