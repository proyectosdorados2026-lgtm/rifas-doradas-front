'use client'

import { useEffect, useState } from 'react'
import {
  EstadisticasPublicas,
  EstadisticasPorRifa
} from '@/types/ventasPublicas'
import { ventasPublicasApi } from '@/lib/ventasPublicasApi'

export default function EstadisticasVentasPublicas() {
  const [estadisticas, setEstadisticas] = useState<EstadisticasPublicas | null>(
    null
  )
  const [estadisticasPorRifa, setEstadisticasPorRifa] = useState<
    EstadisticasPorRifa[]
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  const cargarEstadisticas = async () => {
    try {
      setLoading(true)
      setError(null)

      const [respStats, respPorRifa] = await Promise.all([
        ventasPublicasApi.getEstadisticasPublicas(),
        ventasPublicasApi.getEstadisticasPorRifa()
      ])

      if (!respStats.success) {
        throw new Error(respStats.message || 'Error cargando estadísticas')
      }

      setEstadisticas(respStats.data || null)
      setEstadisticasPorRifa(respPorRifa.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatoMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-slate-600 mt-3">Cargando estadísticas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPIs Generales */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Ventas */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase">
                Total Ventas
              </p>
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {estadisticas.total_ventas}
            </p>
          </div>

          {/* Ventas Pagadas */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-green-700 uppercase">
                Pagadas
              </p>
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-green-700">
              {estadisticas.ventas_pagadas}
            </p>
          </div>

          {/* Ventas Abonadas */}
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-yellow-700 uppercase">
                Abonadas
              </p>
              <svg
                className="w-5 h-5 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-yellow-700">
              {estadisticas.ventas_abonadas}
            </p>
          </div>

          {/* Ventas Pendientes */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-blue-700 uppercase">
                Pendientes
              </p>
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {estadisticas.ventas_pendientes}
            </p>
          </div>

          {/* Ventas Sin Revisar */}
          <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-purple-700 uppercase">
                Sin Revisar
              </p>
              <span className="text-lg">🆕</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">
              {estadisticas.ventas_sin_revisar || 0}
            </p>
          </div>

          {/* Saldo Pendiente */}
          <div className="bg-red-50 rounded-lg border border-red-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-red-700 uppercase">
                Saldo Pendiente
              </p>
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <p className="text-lg font-bold text-red-700">
              {formatoMoneda(estadisticas.saldo_pendiente_total)}
            </p>
          </div>
        </div>
      )}

      {/* Montos Totales */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
            <p className="text-sm font-medium text-slate-700 mb-2">
              Total en Ventas
            </p>
            <p className="text-3xl font-bold text-blue-900">
              {formatoMoneda(estadisticas.total_venta)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
            <p className="text-sm font-medium text-slate-700 mb-2">
              Total Abonado
            </p>
            <p className="text-3xl font-bold text-green-900">
              {formatoMoneda(estadisticas.total_abonado)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
            <p className="text-sm font-medium text-slate-700 mb-2">
              % de Cobranza
            </p>
            <p className="text-3xl font-bold text-purple-900">
              {estadisticas.total_venta > 0
                ? ((estadisticas.total_abonado / estadisticas.total_venta) * 100).toFixed(1)
                : '0'}
              %
            </p>
          </div>
        </div>
      )}

      {/* Estadísticas por Proyecto */}
      {estadisticasPorRifa.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            📊 Descomposición por proyecto
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Rifa
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-slate-700">
                    Ventas
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-slate-700">
                    Clientes
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-slate-700">
                    Total Venta
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-slate-700">
                    Abonado
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-slate-700">
                    % Cobranza
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {estadisticasPorRifa.map((rifa) => (
                  <tr key={rifa.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {rifa.rifa_nombre}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {rifa.total_ventas_publicas}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {rifa.clientes_unicos}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-900 font-medium">
                      {formatoMoneda(rifa.total_venta)}
                    </td>
                    <td className="px-4 py-3 text-right text-green-700 font-medium">
                      {formatoMoneda(rifa.total_abonado)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-700">
                      {rifa.total_venta > 0
                        ? ((rifa.total_abonado / rifa.total_venta) * 100).toFixed(1)
                        : '0'}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
