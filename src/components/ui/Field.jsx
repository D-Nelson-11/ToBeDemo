import { LuChevronDown } from 'react-icons/lu'
import { cx } from './Button'

export function Field({ label, hint, required, children, className, style }) {
  return (
    <label className={cx('flex min-w-0 flex-col gap-1.5', className)} style={style}>
      {label && (
        <span className="lbl">
          {label}
          {required && <span className="text-xs leading-none text-rojo-600">*</span>}
        </span>
      )}
      {children}
      {hint && <span className="text-xs text-ink-3 text-pretty">{hint}</span>}
    </label>
  )
}

export function Input({ numeric, date, className, ...props }) {
  return (
    <input
      className={cx('inp', numeric && 'cellinp-num', date && 'inp-date', className)}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }) {
  return <textarea className={cx('inp inp-area', className)} {...props} />
}

export function Select({ options = [], placeholder, className, children, ...props }) {
  return (
    <span className="relative flex min-w-0">
      <select className={cx('inp inp-sel', className)} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {children ??
          options.map((o) => {
            const value = typeof o === 'string' ? o : o.value
            const label = typeof o === 'string' ? o : o.label
            return (
              <option key={value} value={value}>
                {label}
              </option>
            )
          })}
      </select>
      <LuChevronDown
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3"
      />
    </span>
  )
}
