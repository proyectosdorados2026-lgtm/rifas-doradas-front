'use client'

import Link from 'next/link'

type Props = {
  eyebrow?: string
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  actions?: React.ReactNode
}

/** Cabecera uniforme para vistas admin / vendedor dentro del shell. */
export default function PageHeader({
  eyebrow = 'Operación',
  title,
  description,
  backHref,
  backLabel = 'Volver',
  actions,
}: Props) {
  return (
    <header className="mb-4 sm:mb-6 border-b-[1.5px] border-black pb-3 sm:pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between min-w-0">
        <div className="min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] hover:text-black mb-2"
            >
              ← {backLabel}
            </Link>
          )}
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {eyebrow}
          </p>
          <h1
            className="text-xl sm:text-2xl lg:text-3xl font-[800] tracking-tight text-black mt-1 break-words"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
