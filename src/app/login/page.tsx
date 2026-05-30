'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { API_BASE_URL } from '@/config/api'

interface LoginFormData {
  email: string
  password: string
}

interface LoginResponse {
  success: boolean
  message: string
  data?: {
    token: string
    user: {
      id: string
      email: string
      nombre: string
      rol: string
    }
  }
  error?: string
  details?: Array<{
    field: string
    message: string
  }>
}

const ROL_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
}

const ROL_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  SUPER_ADMIN: { bg: 'from-purple-700 to-indigo-900', border: 'border-purple-400', text: 'text-purple-100', badge: 'bg-purple-500/30 text-purple-100 border-purple-400' },
  ADMIN:       { bg: 'from-indigo-700 to-slate-900',  border: 'border-indigo-400',  text: 'text-indigo-100',  badge: 'bg-indigo-500/30 text-indigo-100 border-indigo-400'  },
  VENDEDOR:    { bg: 'from-emerald-700 to-teal-900',  border: 'border-emerald-400', text: 'text-emerald-100', badge: 'bg-emerald-500/30 text-emerald-100 border-emerald-400' },
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [welcomeUser, setWelcomeUser] = useState<{ nombre: string; rol: string; email: string } | null>(null)
  const [countdown, setCountdown] = useState(3)
  const router = useRouter()

  useEffect(() => {
    if (!welcomeUser) return
    if (countdown <= 0) {
      router.push('/dashboard')
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [welcomeUser, countdown, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data: LoginResponse = await response.json()

      if (data.success) {
        localStorage.setItem('token', data.data!.token)
        localStorage.setItem('user', JSON.stringify(data.data!.user))
        setWelcomeUser(data.data!.user)
        setCountdown(3)
      } else {
        if (data.error === 'Validation Error' && data.details) {
          const validationErrors = data.details.map(detail => detail.message).join(', ')
          setError(validationErrors)
        } else {
          setError(data.message || 'Error al iniciar sesión')
        }
      }
    } catch (err) {
      setError('Error de conexión. Por favor intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Pantalla de bienvenida post-login
  if (welcomeUser) {
    const rol = welcomeUser.rol || 'VENDEDOR'
    const colors = ROL_COLORS[rol] || ROL_COLORS['ADMIN']
    const rolLabel = ROL_LABELS[rol] || rol
    const iniciales = welcomeUser.nombre
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()

    return (
      <div className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br ${colors.bg} p-6 relative overflow-hidden`}>
        {/* Fondo decorativo */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-lg w-full">
          {/* Avatar con iniciales */}
          <div className={`w-36 h-36 rounded-full border-4 ${colors.border} bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-2xl`}>
            <span className="text-5xl font-black text-white tracking-tight">{iniciales}</span>
          </div>

          {/* Saludo */}
          <div>
            <p className={`text-lg font-medium ${colors.text} opacity-80 mb-1 uppercase tracking-widest`}>
              ¡Bienvenido de nuevo!
            </p>
            <h1 className="text-5xl font-black text-white leading-tight mb-3">
              {welcomeUser.nombre.toUpperCase()}
            </h1>
            <span className={`inline-block px-5 py-1.5 rounded-full border text-sm font-bold uppercase tracking-widest ${colors.badge}`}>
              {rolLabel}
            </span>
            <p className={`mt-3 text-sm ${colors.text} opacity-60`}>{welcomeUser.email}</p>
          </div>

          {/* Contador */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center">
              <span className="text-3xl font-black text-white">{countdown}</span>
            </div>
            <p className={`text-sm ${colors.text} opacity-70`}>
              Entrando al sistema...
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-1 px-8 py-2.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white font-semibold rounded-xl backdrop-blur-sm transition-all text-sm"
            >
              Entrar ahora →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-300 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-400 rounded-full blur-2xl" />
        </div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold tracking-tight mb-3">Sistema de Rifas</h2>
            <p className="text-indigo-200 text-lg leading-relaxed max-w-md">
              Plataforma profesional de gestión de rifas, ventas y sorteos en tiempo real.
            </p>
          </div>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-3 text-indigo-200">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-sm">Gestión de ventas en tiempo real</span>
            </div>
            <div className="flex items-center gap-3 text-indigo-200">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-sm">Control de boletas y abonos</span>
            </div>
            <div className="flex items-center gap-3 text-indigo-200">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-sm">Reportes y analítica avanzada</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full max-w-[420px] animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8 sm:p-10 border border-slate-100">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-slate-900 mb-1">Iniciar sesión</h1>
              <p className="text-slate-500 text-sm">Ingresa tus credenciales para acceder al sistema</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="w-4.5 h-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-200 text-slate-900 placeholder-slate-400 bg-slate-50/50 hover:border-slate-300 text-sm"
                    placeholder="tu@correo.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="w-4.5 h-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-200 text-slate-900 placeholder-slate-400 bg-slate-50/50 hover:border-slate-300 text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm animate-slide-down">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-xl font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 active:scale-[0.98]"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Iniciar sesión
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </span>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Sistema de Rifas © {new Date().getFullYear()} · Todos los derechos reservados
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
