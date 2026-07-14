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
    const token = localStorage.getItem('token')
    const raw = localStorage.getItem('user')
    if (!token || !raw) return
    try {
      const user = JSON.parse(raw)
      const rol = (user?.rol || '').toUpperCase()
      router.replace(rol === 'SUPER_ADMIN' ? '/analytics' : '/mis-reportes')
    } catch {
      /* stay on login */
    }
  }, [router])

  useEffect(() => {
    if (!welcomeUser) return
    if (countdown <= 0) {
      const rol = (welcomeUser.rol || '').toUpperCase()
      router.push(rol === 'SUPER_ADMIN' ? '/analytics' : '/mis-reportes')
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
    const rol = (welcomeUser.rol || 'VENDEDOR').toUpperCase()
    const rolLabel = ROL_LABELS[rol] || rol
    const iniciales = welcomeUser.nombre
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] p-4 sm:p-6">
        <div className="w-full max-w-md border-[1.5px] border-black bg-[var(--surface-elevated)] shadow-[8px_8px_0_#101010] p-5 sm:p-8 text-center">
          <div className="w-20 h-20 mx-auto border-[1.5px] border-black bg-black text-[var(--primary)] flex items-center justify-center text-2xl font-black mb-6">
            {iniciales}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2">Bienvenido</p>
          <h1 className="text-3xl font-[800] tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            {welcomeUser.nombre}
          </h1>
          <span className="inline-block px-3 py-1 border-[1.5px] border-black bg-[var(--primary)] text-black text-[10px] font-bold uppercase tracking-widest">
            {rolLabel}
          </span>
          <p className="mt-3 text-sm text-[var(--text-muted)]">{welcomeUser.email}</p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="w-14 h-14 border-[1.5px] border-black bg-black text-[var(--primary)] flex items-center justify-center text-2xl font-black">
              {countdown}
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Entrando…</p>
            <button
              onClick={() => {
                router.push(rol === 'SUPER_ADMIN' ? '/analytics' : '/mis-reportes')
              }}
              className="mt-2 px-6 py-2.5 bg-[var(--primary)] text-black border-[1.5px] border-black font-bold uppercase text-xs tracking-wider shadow-[3px_3px_0_#101010]"
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
      <div className="hidden lg:flex lg:w-[46%] bg-black text-[var(--primary)] relative overflow-hidden border-r-[1.5px] border-black">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(#c4f000 1px, transparent 1px), linear-gradient(90deg, #c4f000 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative z-10 flex flex-col justify-center px-14">
          <div className="w-14 h-14 bg-[var(--primary)] text-black border border-[var(--primary)] flex items-center justify-center mb-8 font-[800] text-lg" style={{ fontFamily: 'var(--font-display)' }}>
            RF
          </div>
          <h2 className="text-4xl font-[800] tracking-tight text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            Rifas Ops
          </h2>
          <p className="text-[var(--primary)]/80 text-base max-w-sm leading-relaxed">
            Panel operativo para ventas, abonos y reportes. Misma interfaz para admin y vendedores.
          </p>
          <ul className="mt-10 space-y-3 text-sm text-white/70">
            <li className="flex items-center gap-2"><span className="w-2 h-2 bg-[var(--primary)]" /> Ventas en tiempo real</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 bg-[var(--primary)]" /> Abonos y cobranza</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 bg-[var(--primary)]" /> Reportes por rol</li>
          </ul>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[var(--background)]">
        <div className="w-full max-w-[420px] min-w-0">
          <div className="bg-[var(--surface-elevated)] border-[1.5px] border-black shadow-[8px_8px_0_#101010] p-5 sm:p-8">
            <div className="mb-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Acceso</p>
              <h1 className="text-2xl font-[800] tracking-tight mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                Iniciar sesión
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-1">Admin, vendedores y super admin.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email">Correo</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full mt-1.5 px-3 py-2.5"
                  placeholder="tu@correo.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="password">Contraseña</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full mt-1.5 px-3 py-2.5"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="border-[1.5px] border-black bg-[var(--danger-light)] text-[var(--danger)] px-4 py-3 text-sm font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[var(--primary)] text-black py-3 border-[1.5px] border-black font-bold uppercase text-sm tracking-wider shadow-[4px_4px_0_#101010] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_#101010] disabled:opacity-50"
              >
                {isLoading ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
