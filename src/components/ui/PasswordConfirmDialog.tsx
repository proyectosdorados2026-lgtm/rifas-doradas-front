'use client'

import { useState } from 'react'
import { API_BASE_URL } from '@/config/api'

interface PasswordConfirmDialogProps {
  isOpen: boolean
  userEmail: string
  userName?: string
  rifaName: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export default function PasswordConfirmDialog({
  isOpen,
  userEmail,
  userName,
  rifaName,
  onConfirm,
  onCancel,
  isLoading = false
}: PasswordConfirmDialogProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)

  if (!isOpen) return null

  const handleValidatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setValidating(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          password: password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setPassword('')
        onConfirm()
      } else {
        setError(data.message || 'Contraseña incorrecta')
      }
    } catch (err) {
      setError('Error al validar contraseña. Intenta nuevamente.')
    } finally {
      setValidating(false)
    }
  }

  const handleClose = () => {
    if (!validating) {
      setPassword('')
      setError(null)
      onCancel()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in">
        <div className="mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-10.5a9.01 9.01 0 019.471 7.5H20a2 2 0 012 2v4a2 2 0 01-2 2h-4.5a2 2 0 01-2-2v-4a2 2 0 012-2h.029a9 9 0 01-.471-7.5H7.5a2 2 0 00-2 2v4a2 2 0 002 2H18" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 text-center mb-2">
            Confirmar eliminación
          </h2>
          <p className="text-sm text-slate-600 text-center">
            Se eliminará permanentemente: <span className="font-medium text-slate-900">"{rifaName}"</span>
          </p>
        </div>

        <form onSubmit={handleValidatePassword} className="space-y-4">
          {/* User info display */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Usuario</p>
            <p className="text-sm font-medium text-slate-900">{userName || userEmail}</p>
            <p className="text-xs text-slate-500 mt-1">{userEmail}</p>
          </div>

          {/* Password input */}
          <div>
            <label htmlFor="password" className="block text-sm font-bold text-black mb-2">
              Digita tu contraseña para confirmar
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(null)
              }}
              disabled={validating || isLoading}
              className="w-full px-4 py-3 border border-slate-400 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all duration-200 text-black placeholder-slate-500 disabled:bg-slate-50 disabled:cursor-not-allowed bg-white"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={validating || isLoading}
              className="flex-1 px-4 py-2.5 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={validating || isLoading || !password.trim()}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {validating || isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Validando...
                </>
              ) : (
                'Eliminar proyecto'
              )}
            </button>
          </div>
        </form>

        <p className="text-xs text-slate-500 text-center mt-4">
          Tu contraseña no se guarda, solo se valida
        </p>
      </div>
    </div>
  )
}
