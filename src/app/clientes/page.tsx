'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { clienteApi } from '@/lib/clienteApi'
import { Cliente, ClienteListResponse, ClienteFiltroEstado, ClienteResumenFiltros } from '@/types/cliente'
import ClienteList from '@/components/ClienteList'
import ClienteForm from '@/components/ClienteForm'
import ClienteDetalle from '@/components/ClienteDetalle'

type ViewMode = 'list' | 'form' | 'detail'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [viewingClienteId, setViewingClienteId] = useState<string | null>(null)
  const [filtroActivo, setFiltroActivo] = useState<ClienteFiltroEstado>('todos')
  const [currentSearch, setCurrentSearch] = useState('')
  const [rifaActual, setRifaActual] = useState<{ id: string; nombre: string; estado: string } | null>(null)
  const [resumenFiltros, setResumenFiltros] = useState<ClienteResumenFiltros>({
    todos: 0,
    con_boletas: 0,
    pagadas: 0,
    reservadas: 0,
    abonadas: 0
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchClientes()
  }, [router])

  const fetchClientes = async (
    page: number = 1,
    search: string = '',
    filtro: ClienteFiltroEstado = filtroActivo
  ) => {
    try {
      setLoading(true)
      const response: ClienteListResponse = await clienteApi.getClientes(page, pagination.limit, search, filtro)
      setClientes(response.data)
      setRifaActual(response.rifa_actual || null)
      if (response.resumen_filtros) {
        setResumenFiltros(response.resumen_filtros)
      }
      setPagination(response.pagination)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCliente = () => {
    setEditingCliente(null)
    setViewMode('form')
  }

  const handleEditCliente = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setViewMode('form')
  }

  const handleViewCliente = (cliente: Cliente) => {
    setViewingClienteId(cliente.id)
    setViewMode('detail')
  }

  const handleBackToList = () => {
    setViewMode('list')
    setViewingClienteId(null)
    setEditingCliente(null)
    // Refresh list to get updated data
    fetchClientes(pagination.page, currentSearch, filtroActivo)
  }

  const handleDeleteCliente = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      return
    }

    try {
      await clienteApi.deleteCliente(id)
      fetchClientes(pagination.page, currentSearch, filtroActivo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar cliente')
    }
  }

  const handleFormSubmit = async (clienteData: any) => {
    try {
      if (editingCliente) {
        await clienteApi.updateCliente(editingCliente.id, clienteData)
      } else {
        await clienteApi.createCliente(clienteData)
      }
      setViewMode('list')
      setEditingCliente(null)
      fetchClientes(pagination.page, currentSearch, filtroActivo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar cliente')
    }
  }

  const handleSearch = (search: string) => {
    setCurrentSearch(search)
    setFiltroActivo('todos')
    fetchClientes(1, search, 'todos')
  }

  const handlePageChange = (page: number) => {
    fetchClientes(page, currentSearch, filtroActivo)
  }

  const handleFilterEstado = (estado: ClienteFiltroEstado) => {
    setFiltroActivo(estado)
    fetchClientes(1, currentSearch, estado)
  }

  if (loading && clientes.length === 0 && viewMode === 'list') {
    return (
      <div className="px-4 py-16 flex items-center justify-center">
        <div className="border-[1.5px] border-black bg-[var(--surface-elevated)] px-5 py-3 text-sm font-semibold uppercase tracking-wide shadow-[4px_4px_0_#101010]">
          Cargando clientes...
        </div>
      </div>
    )
  }

  const pageTitle =
    viewMode === 'detail'
      ? 'Detalle de cliente'
      : viewMode === 'form'
        ? editingCliente
          ? 'Editar cliente'
          : 'Nuevo cliente'
        : 'Clientes'

  return (
    <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <header className="mb-6 border-b-[1.5px] border-black pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Directorio</p>
            <h1 className="text-2xl sm:text-3xl font-[800] tracking-tight mt-1" style={{ fontFamily: 'var(--font-display)' }}>
              {pageTitle}
            </h1>
          </div>
          {viewMode === 'list' && (
            <button
              onClick={handleCreateCliente}
              className="bg-[var(--primary)] text-black border-[1.5px] border-black px-4 py-2 font-bold uppercase text-sm tracking-wide shadow-[3px_3px_0_#101010] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#101010]"
            >
              + Nuevo cliente
            </button>
          )}
        </div>
      </header>

      <main>
        {error && (
          <div className="bg-[var(--danger-light)] border-[1.5px] border-black text-[var(--danger)] px-4 py-3 mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold">✕</button>
          </div>
        )}

        {viewMode === 'form' && (
          <ClienteForm
            cliente={editingCliente}
            onSubmit={handleFormSubmit}
            onCancel={handleBackToList}
          />
        )}

        {viewMode === 'detail' && viewingClienteId && (
          <ClienteDetalle
            clienteId={viewingClienteId}
            onBack={handleBackToList}
          />
        )}

        {viewMode === 'list' && (
          <ClienteList
            clientes={clientes}
            rifaActual={rifaActual}
            resumenFiltros={resumenFiltros}
            pagination={pagination}
            onEdit={handleEditCliente}
            onDelete={handleDeleteCliente}
            onView={handleViewCliente}
            onSearch={handleSearch}
            onPageChange={handlePageChange}
            onFilterEstado={handleFilterEstado}
            filtroActivo={filtroActivo}
            loading={loading}
          />
        )}
      </main>
    </div>
  )
}
