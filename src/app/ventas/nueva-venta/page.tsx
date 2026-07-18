'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { rifaApi } from '@/lib/rifaApi'
import { Rifa } from '@/types/rifa'
import { Cliente, BoletaEnCarrito } from '@/types/ventas'
import SelectorBoletas from '@/components/ventas/SelectorBoletas'
import ClienteSearch from '@/components/ventas/ClienteSearch'
import ClienteSeleccionado from '@/components/ventas/ClienteSeleccionado'
import CarritoVentas from '@/components/ventas/CarritoVentas'
import MisReservas from '@/components/ventas/MisReservas'
import { RealTimeNotifications } from '@/components/ventas/RealTimeNotifications'
import { useVentasRealTime } from '@/hooks/useWebSocket'

// Componente temporal para SelectorRifa
function SelectorRifa({ rifas, rifaSeleccionada, onRifaSeleccionada }: { 
  rifas: Rifa[], 
  rifaSeleccionada: Rifa | null, 
  onRifaSeleccionada: (rifa: Rifa) => void 
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-medium text-slate-900 mb-4">Seleccionar proyecto</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rifas.map((rifa) => (
          <button
            key={rifa.id}
            onClick={() => onRifaSeleccionada(rifa)}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              rifaSeleccionada?.id === rifa.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="font-medium text-slate-900">{rifa.nombre}</div>
            <div className="text-sm text-slate-600 mt-1">
              Premio: {rifa.premio || 'No especificado'}
            </div>
            <div className="text-sm text-slate-500">
              Precio: ${typeof rifa.precio_boleta === 'number' ? rifa.precio_boleta : parseFloat(rifa.precio_boleta || '0')}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function VentasPage() {
  const router = useRouter()
  const [rifas, setRifas] = useState<Rifa[]>([])
  const [rifaSeleccionada, setRifaSeleccionada] = useState<Rifa | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estado del flujo de ventas
  const [pasoActual, setPasoActual] = useState<'seleccionar-rifa' | 'seleccionar-boletas' | 'datos-cliente' | 'resumen'>('seleccionar-rifa')
  const [boletasSeleccionadas, setBoletasSeleccionadas] = useState<BoletaEnCarrito[]>([])
  const [mostrarReservas, setMostrarReservas] = useState(false)
  const [cliente, setCliente] = useState<Cliente>({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    identificacion: ''
  })

  // WebSocket para actualizaciones en tiempo real
  const { eventosRecientes, conectado } = useVentasRealTime(
    rifaSeleccionada?.id || ''
  )

  // Cargar proyectos activos
  const cargarRifas = async () => {
    try {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')
      
      if (!token || !userData) {
        router.push('/login')
        return
      }

      const user = JSON.parse(userData)
      
      // Verificar rol
      if (user.rol !== 'SUPER_ADMIN' && user.rol !== 'VENDEDOR' && user.rol !== 'ADMIN') {
        router.push('/dashboard')
        return
      }

      // Cargar proyectos activos usando endpoint operativo (sin acceso al módulo de rifas)
      try {
        const response = await rifaApi.getRifasOperativas('ACTIVA')
        setRifas(response.data)
        setError(null) // Limpiar error si todo funciona
      } catch (rifaError: any) {
        console.warn('Error cargando proyectos, verificando si es HTML 404...', rifaError)
        
        // Verificar específicamente si es un error de HTML (404 page)
        if (rifaError.message && rifaError.message.includes('Unexpected token')) {
          console.log('Endpoint /api/rifas devuelve HTML (404), usando rifa de ejemplo')
          
          // Rifa de ejemplo para pruebas mientras el backend no tiene el endpoint
          const rifaEjemplo: Rifa = {
            id: 'rifa-ejemplo-123',
            nombre: 'Proyecto ejemplo - Pruebas',
            slug: 'rifa-ejemplo-pruebas',
            premio: 'Premio de Ejemplo $1000',
            premio_principal: 'Premio de Ejemplo $1000',
            descripcion: 'Proyecto de ejemplo para probar el sistema de ventas',
            estado: 'ACTIVA',
            precio_boleta: '10.00',
            total_boletas: 100,
            boletas_vendidas: 0,
            boletas_disponibles: 100,
            fecha_inicio: new Date().toISOString(),
            fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            fecha_sorteo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            imagen_url: null,
            terminos_condiciones: null,
            creado_por: user.id,
            creador_nombre: user.nombre,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          setRifas([rifaEjemplo])
          setError('Usando proyecto de ejemplo. El endpoint /api/rifas no está disponible en el backend.')
        } else {
          // Si es otro tipo de error, dejar que se maneje normalmente
          throw rifaError
        }
      }
      
    } catch (error) {
      console.error('Error general en cargarRifas:', error)
      setError('Error cargando proyectos activos')
    } finally {
      setLoading(false)
    }
  }

  // Seleccionar proyecto
  const seleccionarRifa = (rifa: Rifa) => {
    setRifaSeleccionada(rifa)
    setPasoActual('seleccionar-boletas')
    setBoletasSeleccionadas([])
  }

  // Manejar selección de boletas
  const handleBoletaSeleccionada = (boleta: BoletaEnCarrito) => {
    setBoletasSeleccionadas(prev => [...prev, boleta])
  }

  const handleBoletaRemovida = (boletaId: string) => {
    if (boletaId === 'all') {
      // Limpiar todo
      setBoletasSeleccionadas([])
      setPasoActual('seleccionar-boletas')
    } else {
      setBoletasSeleccionadas(prev => prev.filter(b => b.id !== boletaId))
    }
  }

  // Continuar al siguiente paso
  const continuarSiguiente = () => {
    switch (pasoActual) {
      case 'seleccionar-boletas':
        if (boletasSeleccionadas.length > 0) {
          setPasoActual('datos-cliente')
        }
        break
      case 'datos-cliente':
        if (cliente.nombre && cliente.telefono) {
          setPasoActual('resumen')
        }
        break
    }
  }

  // Venta completada
  const handleVentaCompletada = () => {
    // Resetear estado
    setBoletasSeleccionadas([])
    setCliente({
      nombre: '',
      telefono: '',
      email: '',
      direccion: '',
      identificacion: ''
    })
    setPasoActual('seleccionar-boletas')
    
    // Opcional: mostrar notificación de éxito
    // alert('¡Venta completada exitosamente!')
  }

  // Volver al paso anterior
  const volverPasoAnterior = () => {
    switch (pasoActual) {
      case 'seleccionar-boletas':
        setRifaSeleccionada(null)
        setPasoActual('seleccionar-rifa')
        break
      case 'datos-cliente':
        setPasoActual('seleccionar-boletas')
        break
      case 'resumen':
        setPasoActual('datos-cliente')
        break
    }
  }

  // Indicador de conexión WebSocket
  const ConexionIndicator = () => (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${conectado ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-xs text-slate-600">
        {conectado ? 'Conectado' : 'Desconectado'}
      </span>
    </div>
  )

  useEffect(() => {
    cargarRifas()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mb-4">
            <svg className="w-4 h-4 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-slate-600">Cargando sistema de ventas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-slate-600 hover:text-slate-900"
              >
                ← Dashboard
              </button>
              <h1 className="text-xl font-semibold text-slate-900">Sistema de Ventas</h1>
            </div>
            <ConexionIndicator />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-900 font-medium mb-2">Error cargando el sistema</p>
            <p className="text-slate-600">{error}</p>
            <button
              onClick={cargarRifas}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Indicador de paso actual */}
            <div className="flex items-center justify-center space-x-2 mb-8">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${
                pasoActual === 'seleccionar-rifa' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                <span>1</span>
                <span>Seleccionar proyecto</span>
              </div>
              <div className={`w-8 h-px bg-slate-300`}></div>
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${
                pasoActual === 'seleccionar-boletas' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                <span>2</span>
                <span>Seleccionar Boletas</span>
              </div>
              <div className={`w-8 h-px bg-slate-300`}></div>
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${
                pasoActual === 'datos-cliente' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                <span>3</span>
                <span>Datos Cliente</span>
              </div>
              <div className={`w-8 h-px bg-slate-300`}></div>
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${
                pasoActual === 'resumen' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                <span>4</span>
                <span>Resumen</span>
              </div>
            </div>

            {/* Sección de Reservas Activas
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <button
                onClick={() => setMostrarReservas(!mostrarReservas)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📌</span>
                  <div className="text-left">
                    <h3 className="font-medium text-slate-900">Mis Reservas Activas</h3>
                    <p className="text-sm text-slate-600">Gestiona tus boletas bloqueadas</p>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-slate-600 transition-transform ${mostrarReservas ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
              </button>

              {mostrarReservas && (
                <div className="border-t border-slate-200 p-6">
                  <MisReservas rifaId={rifaSeleccionada?.id} />
                </div>
              )}
            </div> */}

            {/* Contenido del paso actual */}
            {pasoActual === 'seleccionar-rifa' && (
              <div className="space-y-6">
                <SelectorRifa
                  rifas={rifas}
                  rifaSeleccionada={rifaSeleccionada}
                  onRifaSeleccionada={seleccionarRifa}
                />
              </div>
            )}

            {pasoActual === 'seleccionar-boletas' && rifaSeleccionada && (
              <div className="space-y-6">
                <SelectorBoletas
                  rifaId={rifaSeleccionada.id}
                  precioBoleta={typeof rifaSeleccionada.precio_boleta === 'number' ? rifaSeleccionada.precio_boleta : parseFloat(rifaSeleccionada.precio_boleta || '0')}
                  onBoletaSeleccionada={handleBoletaSeleccionada}
                  onBoletaRemovida={handleBoletaRemovida}
                  boletasSeleccionadas={boletasSeleccionadas}
                />
                
                {/* Botón para continuar al siguiente paso */}
                <div className="flex justify-between">
                  <button
                    onClick={volverPasoAnterior}
                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    ← Volver
                  </button>
                  
                  {boletasSeleccionadas.length > 0 && (
                    <button
                      onClick={() => setPasoActual('datos-cliente')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <span>Continuar con Cliente</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                  
                  {boletasSeleccionadas.length === 0 && (
                    <div className="text-slate-500 text-sm">
                      Selecciona al menos una boleta para continuar
                    </div>
                  )}
                </div>
              </div>
            )}

            {pasoActual === 'datos-cliente' && (
              <div className="space-y-6">
                <ClienteSearch
                 rifaId={rifaSeleccionada?.id}
                 onClienteSelected={(clienteSeleccionado) => {
                 console.log('Cliente seleccionado:', clienteSeleccionado)
                 setCliente(clienteSeleccionado)

                 setTimeout(() => {
                 setPasoActual('resumen')
                 }, 0)
                 }}
                />
                
                {/* Botón para volver */}
                <div className="flex justify-between">
                  <button
                    onClick={volverPasoAnterior}
                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    ← Volver a Boletas
                  </button>
                </div>
              </div>
            )}

            {/* Paso 4: Resumen y Venta */}
             {pasoActual === 'resumen' && rifaSeleccionada&& (
              <div className="space-y-6">
                <ClienteSeleccionado
                  cliente={cliente}
                  onCambiarCliente={() => setPasoActual('datos-cliente')}
                />
                
                <CarritoVentas
                  boletas={boletasSeleccionadas}
                  cliente={cliente}
                  precioBoleta={typeof rifaSeleccionada.precio_boleta === 'number' ? rifaSeleccionada.precio_boleta : parseFloat(rifaSeleccionada.precio_boleta || '0')}
                  rifaId={rifaSeleccionada.id}
                  rifaNombre={rifaSeleccionada.nombre}
                  fechaSorteo={rifaSeleccionada.fecha_sorteo}
                  onBoletaRemovida={handleBoletaRemovida}
                  onVentaCompletada={handleVentaCompletada}
                />
                
                <div className="flex justify-between">
                  <button
                    onClick={volverPasoAnterior}
                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    ← Volver
                  </button>
                </div>
              </div>
            )}

            {/* Fallback si no hay contenido */}
            {pasoActual === 'resumen' && (!cliente || cliente.nombre.trim() === '') && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.707.293H17a2 2 0 012-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-slate-600 font-medium mb-2">No hay cliente seleccionado</p>
                <p className="text-slate-500 mb-4">Por favor, regresa y selecciona o crea un cliente para continuar.</p>
                <button
                  onClick={() => setPasoActual('datos-cliente')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Seleccionar Cliente
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notificaciones en tiempo real */}
        <RealTimeNotifications 
          eventos={eventosRecientes}
        />
      </main>
    </div>
  )
}
