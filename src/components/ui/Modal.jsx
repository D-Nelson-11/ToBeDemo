import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { LuX } from 'react-icons/lu'
import { cx } from './Button'

const ANCHOS = { sm: 'max-w-[460px]', md: 'max-w-[760px]', lg: 'max-w-[1080px]', xl: 'max-w-[1220px]' }

export default function Modal({
  open,
  onClose,
  eyebrow,
  title,
  size = 'md',
  flush = false,
  footer,
  children,
}) {
  const panelRef = useRef(null)
  const devolverFoco = useRef(null)

  useEffect(() => {
    if (!open) return
    devolverFoco.current = document.activeElement
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
        return
      }
      // trampa de foco simple: Tab circula dentro del panel
      if (e.key !== 'Tab' || !panelRef.current) return
      const f = panelRef.current.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
      )
      if (!f.length) return
      const [first, last] = [f[0], f[f.length - 1]]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      devolverFoco.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-start justify-center overflow-y-auto bg-navy-950/55 px-4 py-8 backdrop-blur-[2px] motion-safe:animate-[fade_220ms_var(--ease-out-soft)]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'relative m-auto flex max-h-[calc(100vh-48px)] w-full flex-col overflow-hidden rounded-lg bg-surface',
          'shadow-[0_0_0_1px_rgba(0,48,73,0.1),0_18px_40px_-16px_rgba(0,28,44,0.4)]',
          'motion-safe:animate-[rise_220ms_var(--ease-out-soft)]',
          ANCHOS[size],
        )}
      >
        <div className="flex shrink-0 items-start gap-4 bg-navy-800 px-5 pb-3.5 pt-[15px] text-white">
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <span className="mb-[3px] block text-xs text-white/70">
                {eyebrow}
              </span>
            )}
            <div className="text-lg font-bold leading-tight">{title}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-1 -mt-0.5 flex h-7 w-7 items-center justify-center rounded-sm border border-white/15 bg-white/8 text-white transition duration-100 hover:bg-white/18 active:scale-95"
          >
            <LuX size={15} />
          </button>
        </div>

        <div className={cx('min-h-0 flex-1 overflow-y-auto', !flush && 'p-5')}>{children}</div>

        {footer && (
          <div className="flex shrink-0 items-center gap-2 border-t border-line bg-surface-2 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export function FootNote({ children }) {
  return <span className="min-w-0 flex-1 text-sm text-ink-2">{children}</span>
}
