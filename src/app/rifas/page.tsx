'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { rifaApi } from '@/lib/rifaApi'
import { Rifa, RifaListResponse } from '@/types/rifa'
import RifaList from '@/components/RifaList'
import RifaForm from '@/components/RifaForm'
import PasswordConfirmDialog from '@/components/ui/PasswordConfirmDialog'

export default function RifasPage() {
  const [rifas, setRifas] = useState<Rifa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingRifa, setEditingRifa] = useState<Rifa | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [rifaToDelete, setRifaToDelete] = useState<Rifa | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    console.log('Token:', token)
    console.log('UserData:', userData)
    
    if (!token || !userData) {
      console.log('No token or user data, redirecting to login')
      router.push('/login')
      return
    }

    try {
      const user = JSON.parse(userData)
      console.log('Parsed user:', user)
      console.log('User role:', user.rol)
      setUserRole(user.rol)
      setUserEmail(user.email)
      setUserName(user.nombre)
      
      // Check if user has SUPER_ADMIN role
      if (user.rol !== 'SUPER_ADMIN') {
        console.log('User is not SUPER_ADMIN, role:', user.rol)
        setError('No tienes permisos para acceder a este módulo')
        setLoading(false)
        return
      }
      
      fetchRifas()
    } catch (error) {
      console.error('Error parsing user data:', error)
      router.push('/login')
    }
  }, [router])

  const fetchRifas = async () => {
    try {
      setLoading(true)
      const response: RifaListResponse = await rifaApi.getRifas()
      setRifas(response.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar proyectos')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRifa = () => {
    setEditingRifa(null)
    setShowForm(true)
  }

  const handleEditRifa = (rifa: Rifa) => {
    setEditingRifa(rifa)
    setShowForm(true)
  }

  const handleDeleteRifa = async (id: string) => {
    const rifa = rifas.find(r => r.id === id)
    if (rifa) {
      setRifaToDelete(rifa)
      setShowPasswordDialog(true)
    }
  }

  const handleConfirmDelete = async () => {
    if (!rifaToDelete) return

    try {
      await rifaApi.deleteRifa(rifaToDelete.id)
      setShowPasswordDialog(false)
      setRifaToDelete(null)
      fetchRifas()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar proyecto')
      setShowPasswordDialog(false)
      setRifaToDelete(null)
    }
  }

  const handleFormSubmit = async (rifaData: any) => {
    try {
      if (editingRifa) {
        await rifaApi.updateRifa(editingRifa.id, rifaData)
      } else {
        await rifaApi.createRifa(rifaData)
      }
      setShowForm(false)
      setEditingRifa(null)
      fetchRifas()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar proyecto')
    }
  }

  const handleChangeEstado = async (id: string, estado: string) => {
    try {
      await rifaApi.changeRifaEstado(id, estado)
      fetchRifas()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado')
    }
  }

  if (userRole === 'SUPER_ADMIN' && error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md">
          {error}
        </div>
      </div>
    )
  }

  if (userRole && userRole !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg max-w-md">
          <h2 className="text-lg font-medium mb-2">Acceso Restringido</h2>
          <p>Este módulo solo está disponible para usuarios con rol SUPER_ADMIN</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                ← Dashboard
              </button>
              <h1 className="text-2xl font-light text-slate-900">Proyectos</h1>
            </div>
            <button
              onClick={handleCreateRifa}
              className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Nuevo proyecto
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {showForm ? (
          <RifaForm
            rifa={editingRifa}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false)
              setEditingRifa(null)
            }}
          />
        ) : (
          <RifaList
            rifas={rifas}
            onEdit={handleEditRifa}
            onDelete={handleDeleteRifa}
            onChangeEstado={handleChangeEstado}
            loading={loading}
          />
        )}
      </main>

      {userEmail && (
        <PasswordConfirmDialog
          isOpen={showPasswordDialog}
          userEmail={userEmail}
          userName={userName || undefined}
          rifaName={rifaToDelete?.nombre || ''}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowPasswordDialog(false)
            setRifaToDelete(null)
          }}
        />
      )}
    </div>
  )
}
