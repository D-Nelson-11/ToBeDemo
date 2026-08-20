export const cx = (...xs) => xs.filter(Boolean).join(' ')

const VARIANTES = {
  primary: 'btn-primary',
  secondary: 'btn-sec',
  quiet: 'btn-quiet',
  danger: 'btn-danger',
  link: 'btn-link',
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  block = false,
  className,
  children,
  ...props
}) {
  const link = variant === 'link'
  return (
    <button
      type="button"
      className={cx(
        !link && 'btn',
        VARIANTES[variant],
        !link && size === 'sm' && 'btn-sm',
        block && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
