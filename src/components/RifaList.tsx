'use client'

import { useState, useEffect, useCallback } from 'react'
import { Rifa } from '@/types/rifa'
import { ventasApi } from '@/lib/ventasApi'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface RifaListProps {
  rifas: Rifa[]
  onEdit: (rifa: Rifa) => void
  onDelete: (id: string) => void
  onChangeEstado: (id: string, estado: string) => void
  loading: boolean
}

const statusColors = {
  BORRADOR: 'bg-gray-100 text-gray-800',
  ACTIVA: 'bg-green-100 text-green-800',
  PAUSADA: 'bg-yellow-100 text-yellow-800',
  TERMINADA: 'bg-blue-100 text-blue-800'
}

const statusLabels = {
  BORRADOR: 'Borrador',
  ACTIVA: 'Activa',
  PAUSADA: 'Pausada',
  TERMINADA: 'Terminada'
}

export default function RifaList({
  rifas,
  onEdit,
  onDelete,
  onChangeEstado,
  loading
}: RifaListProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    type: 'danger' | 'warning' | 'info'
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  })
  
  // Estado para almacenar conteos de boletas por rifa (disponibles y pagadas)
  const [boletasConteoPorRifa, setBoletasConteoPorRifa] = useState<Record<string, { disponibles?: number; pagadas?: number }>>({})

  // Cargar conteos de boletas por rifa usando estadísticas agregadas del backend
  // (evita descargar todas las boletas de cada rifa solo para contarlas)
  const cargarBoletasDisponibles = useCallback(async () => {
    const resultados = await Promise.all(
      rifas.map(async (rifa) => {
        try {
          const response = await ventasApi.getRifaStats(rifa.id)
          const stats = response.data
          return {
            id: rifa.id,
            conteo: { disponibles: stats.boletas_disponibles, pagadas: stats.boletas_pagadas }
          }
        } catch (error) {
          console.error(`Error cargando estadísticas para proyecto ${rifa.id}:`, error)
          // Si hay error, usar los valores del servidor como fallback
          return {
            id: rifa.id,
            conteo: { disponibles: rifa.boletas_disponibles, pagadas: rifa.boletas_vendidas }
          }
        }
      })
    )

    const conteos: Record<string, { disponibles?: number; pagadas?: number }> = {}
    for (const r of resultados) conteos[r.id] = r.conteo
    setBoletasConteoPorRifa(conteos)
  }, [rifas])

  // Efecto para cargar boletas disponibles cuando cambian los proyectos
  useEffect(() => {
    if (rifas.length > 0) {
      cargarBoletasDisponibles()
    }
  }, [rifas, cargarBoletasDisponibles])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(parseFloat(amount))
  }

  const getEstadoOptions = (currentEstado: string) => {
    const options = []
    
    if (currentEstado === 'BORRADOR') {
      options.push({ value: 'ACTIVA', label: 'Activar', confirm: '¿Estás seguro de que deseas activar este proyecto?' })
    } else if (currentEstado === 'ACTIVA') {
      options.push({ value: 'PAUSADA', label: 'Pausar', confirm: '¿Estás seguro de que deseas pausar este proyecto? Las ventas de boletas se detendrán.' })
      options.push({ value: 'TERMINADA', label: 'Terminar', confirm: '¿Estás seguro de que deseas terminar este proyecto? Esta acción no se puede deshacer.' })
    } else if (currentEstado === 'PAUSADA') {
      options.push({ value: 'ACTIVA', label: 'Reactivar', confirm: '¿Estás seguro de que deseas reactivar este proyecto?' })
      options.push({ value: 'TERMINADA', label: 'Terminar', confirm: '¿Estás seguro de que deseas terminar este proyecto? Esta acción no se puede deshacer.' })
    }

    return options
  }

  const handleDeleteClick = (rifa: Rifa) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar proyecto',
      message: `¿Estás seguro de que deseas eliminar "${rifa.nombre}"? Esta acción no se puede deshacer y eliminará todos los datos asociados.`,
      onConfirm: () => {
        onDelete(rifa.id)
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      },
      type: 'danger'
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Precio Boleta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Boletas Vendidas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Boletas Disponibles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Boletas Totales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Fecha Sorteo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    Cargando...
                  </td>
                </tr>
              ) : rifas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron proyectos
                  </td>
                </tr>
              ) : (
                rifas.map((rifa) => (
                  <tr key={rifa.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        {rifa.nombre}
                      </div>
                      <div className="text-sm text-slate-500 truncate max-w-xs">
                        {rifa.descripcion}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[rifa.estado]}`}>
                        {statusLabels[rifa.estado]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {formatCurrency(rifa.precio_boleta)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {boletasConteoPorRifa[rifa.id] && boletasConteoPorRifa[rifa.id].pagadas !== undefined
                        ? boletasConteoPorRifa[rifa.id].pagadas
                        : <span className="text-slate-400">Cargando...</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {boletasConteoPorRifa[rifa.id] && boletasConteoPorRifa[rifa.id].disponibles !== undefined 
                        ? boletasConteoPorRifa[rifa.id].disponibles 
                        : <span className="text-slate-400">Cargando...</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {rifa.total_boletas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {rifa.fecha_sorteo ? formatDate(rifa.fecha_sorteo) : 'No definida'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => onEdit(rifa)}
                          className="text-slate-600 hover:text-slate-900 text-xs"
                        >
                          Editar
                        </button>
                        
                        {getEstadoOptions(rifa.estado).length > 0 && (
                          <select
                            onChange={(e) => {
                              const value = e.target.value
                              if (value) {
                                const option = getEstadoOptions(rifa.estado).find(opt => opt.value === value)
                                if (option && option.confirm) {
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: `Cambiar Estado - ${option.label}`,
                                    message: option.confirm,
                                    onConfirm: () => {
                                      onChangeEstado(rifa.id, value)
                                      setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                                    },
                                    type: option.value === 'TERMINADA' ? 'danger' : 'warning'
                                  })
                                }
                                e.target.value = ''
                              }
                            }}
                            className="text-xs text-slate-700 bg-white border border-slate-300 rounded px-2 py-1 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent cursor-pointer"
                            defaultValue=""
                          >
                            <option value="" disabled className="text-slate-500">Cambiar Estado</option>
                            {getEstadoOptions(rifa.estado).map(option => (
                              <option key={option.value} value={option.value} className="text-slate-700">
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        <button
                          onClick={() => handleDeleteClick(rifa)}
                          className="text-red-600 hover:text-red-900 text-xs"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        type={confirmDialog.type}
      />
    </div>
  )
}
