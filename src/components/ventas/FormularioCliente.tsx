'use client'

import { useState, useEffect } from 'react'
import { ventasApi } from '@/lib/ventasApi'
import { Cliente } from '@/types/ventas'

interface FormularioClienteProps {
  onClienteChange: (cliente: Cliente) => void
  clienteInicial?: Cliente
  required?: boolean
}

export default function FormularioCliente({ 
  onClienteChange, 
  clienteInicial,
  required = true 
}: FormularioClienteProps) {
  const [cliente, setCliente] = useState<Cliente>(clienteInicial || {
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    identificacion: ''
  })
  
  const [buscando, setBuscando] = useState(false)
  const [resultadosBusqueda, setResultadosBusqueda] = useState<Cliente[]>([])
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [errores, setErrores] = useState<Record<string, string>>({})

  // Validar campos
  const validarCampo = (campo: string, valor: string): string => {
    if (required && campo === 'nombre' && !valor.trim()) {
      return 'El nombre es requerido'
    }
    if (required && campo === 'telefono' && !valor.trim()) {
      return 'El teléfono es requerido'
    }
    if (campo === 'telefono' && valor && !/^\+?[\d\s\-\(\)]+$/.test(valor)) {
      return 'Teléfono inválido'
    }
    if (campo === 'email' && valor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
      return 'Email inválido'
    }
    return ''
  }

  // Buscar cliente por teléfono o email
  const buscarCliente = async (query: string) => {
    if (query.length < 3) {
      setResultadosBusqueda([])
      setMostrarResultados(false)
      return
    }

    setBuscando(true)
    try {
      const response = await ventasApi.buscarClientes(query)
      const clientes = Array.isArray(response.data) ? response.data : (response.data as any).clientes ?? []
      setResultadosBusqueda(clientes)
      setMostrarResultados(clientes.length > 0)
    } catch (error) {
      console.error('Error buscando cliente:', error)
      setResultadosBusqueda([])
    } finally {
      setBuscando(false)
    }
  }

  // Manejar cambios en los campos
  const handleChange = (campo: string, valor: string) => {
    const nuevoCliente = { ...cliente, [campo]: valor }
    setCliente(nuevoCliente)
    
    // Validar campo
    const error = validarCampo(campo, valor)
    setErrores(prev => ({ ...prev, [campo]: error }))
    
    // Buscar cliente si es teléfono o email
    if (campo === 'telefono' || campo === 'email') {
      buscarCliente(valor)
    }
    
    // Notificar al padre
    onClienteChange(nuevoCliente)
  }

  // Seleccionar cliente de los resultados
  const seleccionarCliente = (clienteSeleccionado: Cliente) => {
    setCliente(clienteSeleccionado)
    setMostrarResultados(false)
    setResultadosBusqueda([])
    onClienteChange(clienteSeleccionado)
  }

  // Limpiar formulario
  const limpiarFormulario = () => {
    const clienteVacio: Cliente = {
      nombre: '',
      telefono: '',
      email: '',
      direccion: '',
      identificacion: ''
    }
    setCliente(clienteVacio)
    setResultadosBusqueda([])
    setMostrarResultados(false)
    setErrores({})
    onClienteChange(clienteVacio)
  }

  // Validar formulario completo
  const esValido = () => {
    if (!required) return true
    
    const camposRequeridos = ['nombre', 'telefono']
    for (const campo of camposRequeridos) {
      const error = validarCampo(campo, cliente[campo as keyof Cliente] as string)
      if (error) return false
    }
    return true
  }

  // Efecto para validar cuando cambia el cliente
  useEffect(() => {
    if (clienteInicial) {
      setCliente(clienteInicial)
    }
  }, [clienteInicial])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-300 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-black">Información del Cliente</h2>
        {cliente.nombre && (
          <button
            onClick={limpiarFormulario}
            className="text-sm text-black hover:text-blue-700 font-medium"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Resultados de búsqueda */}
      {mostrarResultados && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-medium text-blue-900 mb-2">
            Clientes encontrados:
          </div>
          {buscando ? (
            <div className="text-sm text-blue-700">Buscando...</div>
          ) : (
            <div className="space-y-2">
              {resultadosBusqueda.map((clienteEncontrado) => (
                <button
                  key={clienteEncontrado.id}
                  onClick={() => seleccionarCliente(clienteEncontrado)}
                  className="w-full text-left p-2 bg-white border border-blue-300 rounded hover:bg-blue-100"
                >
                  <div className="font-medium text-blue-900">
                    {clienteEncontrado.nombre}
                  </div>
                  <div className="text-sm text-blue-700">
                    {clienteEncontrado.telefono} {clienteEncontrado.email && `• ${clienteEncontrado.email}`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Formulario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-bold text-black mb-2">
            Nombre {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={cliente.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-600 focus:border-blue-400 outline-none placeholder:text-slate-500 ${
              errores.nombre ? 'border-red-400' : 'border-slate-400'
            }`}
            placeholder="Nombre completo del cliente"
          />
          {errores.nombre && (
            <p className="mt-1 text-xs text-red-600">{errores.nombre}</p>
          )}
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-bold text-black mb-2">
            Teléfono {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="tel"
            value={cliente.telefono}
            onChange={(e) => handleChange('telefono', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-600 focus:border-blue-400 outline-none placeholder:text-slate-500 ${
              errores.telefono ? 'border-red-400' : 'border-slate-400'
            }`}
            placeholder="+1234567890"
          />
          {errores.telefono && (
            <p className="mt-1 text-xs text-red-600">{errores.telefono}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-bold text-black mb-2">
            Email <span className="font-normal text-slate-500">(opcional)</span>
          </label>
          <input
            type="email"
            value={cliente.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-600 focus:border-blue-400 outline-none placeholder:text-slate-500 ${
              errores.email ? 'border-red-400' : 'border-slate-400'
            }`}
            placeholder="Opcional"
          />
          {errores.email && (
            <p className="mt-1 text-xs text-red-600">{errores.email}</p>
          )}
        </div>

        {/* Identificación */}
        <div>
          <label className="block text-sm font-bold text-black mb-2">
            Identificación
          </label>
          <input
            type="text"
            value={cliente.identificacion}
            onChange={(e) => handleChange('identificacion', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-600 focus:border-blue-400 outline-none placeholder:text-slate-500 border-slate-400"
            placeholder="Cédula, DNI, etc."
          />
        </div>

        {/* Dirección (full width) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-black mb-2">
            Dirección
          </label>
          <textarea
            value={cliente.direccion}
            onChange={(e) => handleChange('direccion', e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-600 focus:border-blue-400 outline-none placeholder:text-slate-500 border-slate-400 resize-none"
            placeholder="Dirección completa del cliente"
          />
        </div>
      </div>

      {/* Indicador de validez */}
      {required && (
        <div className="mt-4 text-sm">
          {esValido() ? (
            <div className="flex items-center text-green-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Información válida
            </div>
          ) : (
            <div className="flex items-center text-amber-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Complete los campos requeridos
            </div>
          )}
        </div>
      )}
    </div>
  )
}
