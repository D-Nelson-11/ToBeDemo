const MES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function parseISO(val) {
  if (!val) return null
  const [y, m, d] = val.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function toISO(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(date, days) {
  const r = new Date(date)
  r.setDate(r.getDate() + days)
  return r
}

export function hoy() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** 14 ago 2026 */
export function fmtFecha(value) {
  const d = value instanceof Date ? value : parseISO(value)
  if (!d) return '—'
  return `${String(d.getDate()).padStart(2, '0')} ${MES_CORTO[d.getMonth()]} ${d.getFullYear()}`
}

/** 14/08/26 — para columnas apretadas */
export function fmtFechaCorta(value) {
  const d = value instanceof Date ? value : parseISO(value)
  if (!d) return '—'
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(
    d.getFullYear(),
  ).slice(2)}`
}

export function diasEntre(a, b) {
  if (!a || !b) return null
  const ms = new Date(b).setHours(0, 0, 0, 0) - new Date(a).setHours(0, 0, 0, 0)
  return Math.round(ms / 86400000)
}

/** "hace 32 días" / "en 12 días" / "hoy" */
export function desdeHoy(value) {
  const d = value instanceof Date ? value : parseISO(value)
  if (!d) return null
  const n = diasEntre(hoy(), d)
  if (n === 0) return 'hoy'
  if (n < 0) return `hace ${Math.abs(n)} d`
  return `en ${n} d`
}

export function fmtNum(n, decimales = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return n.toLocaleString('es-HN', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })
}

export function fmtMoneda(n, moneda = 'USD') {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  const simbolo = moneda === 'HNL' ? 'L' : moneda === 'EUR' ? '€' : '$'
  return `${simbolo} ${n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
