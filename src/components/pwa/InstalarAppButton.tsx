'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, Share, Plus, X, Smartphone } from 'lucide-react'

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isIosSafari(): boolean {
  if (!isIos()) return false
  return !/crios|fxios|opios|edgios/i.test(navigator.userAgent)
}

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /android/i.test(navigator.userAgent)
}

type GuideKind = 'ios' | 'android' | null

export default function InstalarAppButton() {
  const [visible, setVisible] = useState(false)
  const [guide, setGuide] = useState<GuideKind>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (isStandalone()) return

    const onPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)

    if (isIosSafari() || isAndroid()) {
      setVisible(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const handleInstall = useCallback(async () => {
    if (isIos()) {
      setGuide('ios')
      return
    }

    if (deferredPrompt) {
      try {
        setInstalling(true)
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') setVisible(false)
        setDeferredPrompt(null)
      } catch {
        setGuide('android')
      } finally {
        setInstalling(false)
      }
      return
    }

    setGuide('android')
  }, [deferredPrompt])

  if (!visible) return null

  return (
    <>
      <div className="mt-5 pt-5 border-t-[1.5px] border-black/15">
        <button
          type="button"
          onClick={handleInstall}
          disabled={installing}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-black text-[var(--primary)] border-[1.5px] border-black font-bold uppercase text-xs tracking-wider shadow-[3px_3px_0_#101010] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#101010] disabled:opacity-60 min-h-[44px]"
        >
          <Download className="w-4 h-4 shrink-0" aria-hidden />
          {installing ? 'Abriendo instalador…' : 'Instalar app'}
        </button>
        <p className="mt-2 text-[10px] text-center text-[var(--text-muted)] leading-relaxed">
          {isIos()
            ? 'Acceso rápido desde la pantalla de inicio (Safari).'
            : deferredPrompt
              ? 'Un toque y queda en tu celular como app.'
              : 'Agrega el panel a la pantalla de inicio.'}
        </p>
      </div>

      {guide && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
          onClick={() => setGuide(null)}
        >
          <div
            className="w-full max-w-sm bg-[var(--surface-elevated)] border-[1.5px] border-black shadow-[8px_8px_0_#101010] p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 border-[1.5px] border-black bg-[var(--primary)] text-black flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" aria-hidden />
                </div>
                <div>
                  <h2 id="pwa-guide-title" className="text-sm font-[800] uppercase tracking-tight">
                    Instalar en {guide === 'ios' ? 'iPhone' : 'Android'}
                  </h2>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Panel interno · Sueños Dorados</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGuide(null)}
                className="p-1.5 border-[1.5px] border-black hover:bg-black/5 shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {guide === 'ios' && !isIosSafari() && (
              <p className="text-sm text-[var(--danger)] font-medium mb-4 border-[1.5px] border-black bg-[var(--danger-light)] px-3 py-2">
                Abre esta página en <strong>Safari</strong> para poder instalar la app.
              </p>
            )}

            <ol className="space-y-4 text-sm text-[var(--text-secondary)]">
              {guide === 'ios' ? (
                <>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 shrink-0 border-[1.5px] border-black bg-black text-[var(--primary)] text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <span className="pt-0.5">
                      Toca el botón <Share className="w-4 h-4 inline -mt-0.5 mx-0.5" aria-hidden />{' '}
                      <strong>Compartir</strong> en la barra inferior de Safari.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 shrink-0 border-[1.5px] border-black bg-black text-[var(--primary)] text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <span className="pt-0.5">
                      Elige <strong>「Agregar a pantalla de inicio」</strong>
                      <Plus className="w-4 h-4 inline -mt-0.5 mx-0.5" aria-hidden />.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 shrink-0 border-[1.5px] border-black bg-black text-[var(--primary)] text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <span className="pt-0.5">
                      Toca <strong>「Agregar」</strong> arriba a la derecha. Listo.
                    </span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 shrink-0 border-[1.5px] border-black bg-black text-[var(--primary)] text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <span className="pt-0.5">
                      Toca el menú <strong>⋮</strong> (tres puntos) arriba a la derecha en Chrome.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 shrink-0 border-[1.5px] border-black bg-black text-[var(--primary)] text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <span className="pt-0.5">
                      Selecciona <strong>「Instalar app」</strong> o{' '}
                      <strong>「Agregar a pantalla de inicio」</strong>.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 shrink-0 border-[1.5px] border-black bg-black text-[var(--primary)] text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <span className="pt-0.5">Confirma y la app quedará en tu pantalla de inicio.</span>
                  </li>
                </>
              )}
            </ol>

            <button
              type="button"
              onClick={() => setGuide(null)}
              className="mt-6 w-full py-2.5 bg-[var(--primary)] text-black border-[1.5px] border-black font-bold uppercase text-xs tracking-wider shadow-[3px_3px_0_#101010]"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  )
}
