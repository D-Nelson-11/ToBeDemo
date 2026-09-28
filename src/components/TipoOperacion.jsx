import {
  LuArrowLeftRight,
  LuCircleCheck,
  LuCreditCard,
  LuFileText,
  LuFileUp,
  LuInfo,
  LuPaperclip,
  LuStethoscope,
  LuTriangleAlert,
} from 'react-icons/lu'
import Button, { cx } from './ui/Button'
import { Field, Input, Select } from './ui/Field'
import { useOc } from '../data/store'

export const OPERACION_VACIA = {
  tipo: 'aduana',
  origen: 'Guatemala',
  destino: 'Honduras',
  mercancia: '',
  msfNo: 'HN-2026-G020842',
  msfTransferente: 'USD 6.25',
  msfAdquiriente: 'HNL 350.00',
  msfPagado: false,
  fyduca: '',
  impuestos: 'HNL 0.00',
  impPagado: false,
}

const TIPOS = [
  {
    id: 'aduana',
    rotulo: 'Instrucción de Aduana',
    texto: 'Flujo convencional de documentación e instrucción aduanera.',
    icono: LuFileText,
  },
  {
    id: 'fyduca',
    rotulo: 'FYDUCA',
    texto: 'Para mercancías con libre circulación que cumplan los requisitos aplicables.',
    icono: LuArrowLeftRight,
  },
]

const PAISES = ['Guatemala', 'Honduras', 'El Salvador']

const MERCANCIAS = [
  { value: 'general', label: 'Mercancía general' },
  { value: 'agricola', label: 'Producto de interés agrícola / sanitario' },
]

const PASOS_ADUANA = ['Producto listo', 'Documentación', 'Instrucción aduana', 'Tránsito', 'Planta']

const PASOS_FYDUCA = [
  'Producto listo',
  'MSF / validación',
  'FYDUCA recibida',
  'Pago impuestos',
  'Esperando salida',
  'Tránsito',
  'Arribo a planta',
  'Recepción',
]

// El paso en curso sale de lo ya registrado; no se guarda aparte para que no se desincronice.
function pasoFyduca(op) {
  if (!op.mercancia) return 0
  if (op.mercancia === 'agricola' && !op.msfPagado) return 1
  if (!op.fyduca) return 2
  if (!op.impPagado) return 3
  return 4
}

function Proceso({ pasos, actual }) {
  return (
    <ol className="m-0 flex list-none items-start overflow-x-auto p-0 py-1">
      {pasos.map((p, i) => (
        <li key={p} className="flex min-w-[92px] flex-1 flex-col items-center gap-1.5 text-center">
          <span className="flex w-full items-center">
            <span className={cx('h-px flex-1', i === 0 ? 'bg-transparent' : i <= actual ? 'bg-teal-600' : 'bg-line')} />
            <span
              className={cx(
                'num flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                i < actual
                  ? 'bg-teal-50 text-teal-700'
                  : i === actual
                    ? 'bg-navy-700 text-white'
                    : 'bg-surface-3 text-ink-3',
              )}
            >
              {i < actual ? <LuCircleCheck size={13} /> : i + 1}
            </span>
            <span
              className={cx('h-px flex-1', i === pasos.length - 1 ? 'bg-transparent' : i < actual ? 'bg-teal-600' : 'bg-line')}
            />
          </span>
          <span className={cx('px-1 text-xs', i === actual ? 'font-bold text-navy-800' : 'text-ink-3')}>{p}</span>
        </li>
      ))}
    </ol>
  )
}

function Aviso({ tono = 'info', children }) {
  const Icono = tono === 'ok' ? LuCircleCheck : tono === 'alerta' ? LuTriangleAlert : LuInfo
  return (
    <div
      className={cx(
        'flex items-start gap-2.5 rounded-sm border px-3 py-2.5 text-sm',
        tono === 'ok' && 'border-teal-100 bg-teal-50 text-teal-700',
        tono === 'alerta' && 'border-ambar-100 bg-ambar-50 text-ambar-700',
        tono === 'info' && 'border-line bg-surface-2 text-ink-2',
      )}
    >
      <Icono size={15} className="mt-px shrink-0" />
      <span className="min-w-0">{children}</span>
    </div>
  )
}

/** Tipo de operación del despacho: instrucción de aduana convencional o FYDUCA con MSF e impuestos. */
export default function TipoOperacion({ op = OPERACION_VACIA, onChange, referencia }) {
  const { avisar } = useOc()
  const set = (patch) => onChange({ ...op, ...patch })
  const fy = op.tipo === 'fyduca'
  const agricola = op.mercancia === 'agricola'
  // Sin MSF la FYDUCA se espera de una vez; con MSF, solo después del pago.
  const esperaFyduca = op.mercancia && (!agricola || op.msfPagado)

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Tipo de operación</span>
        <span
          className={cx(
            'ml-auto rounded-full px-2.5 py-[3px] text-xs font-semibold',
            fy ? 'bg-navy-50 text-navy-700' : 'bg-teal-50 text-teal-700',
          )}
        >
          {fy ? 'FYDUCA' : 'Aduana'}
        </span>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {TIPOS.map((t) => {
            const activo = op.tipo === t.id
            return (
              <button
                key={t.id}
                onClick={() => set({ tipo: t.id })}
                className={cx(
                  'flex items-start gap-3 rounded-sm border px-4 py-3 text-left transition-colors duration-100',
                  activo ? 'border-navy-600 bg-navy-50' : 'border-line hover:border-navy-200 hover:bg-surface-2',
                )}
              >
                <t.icono size={18} className={cx('mt-px shrink-0', activo ? 'text-navy-700' : 'text-ink-4')} />
                <span className="min-w-0">
                  <b className="block text-base font-bold text-navy-800">{t.rotulo}</b>
                  <span className="block text-sm text-ink-3">{t.texto}</span>
                </span>
              </button>
            )
          })}
        </div>

        {!fy && <Proceso pasos={PASOS_ADUANA} actual={0} />}

        {fy && (
          <>
            <Aviso tono="info">
              Al seleccionar FYDUCA, Supply Hub determina si el producto requiere MSF y habilita las
              acciones en el orden correcto.
            </Aviso>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="País origen">
                <Select options={PAISES} value={op.origen} onChange={(e) => set({ origen: e.target.value })} />
              </Field>
              <Field label="País destino">
                <Select options={PAISES} value={op.destino} onChange={(e) => set({ destino: e.target.value })} />
              </Field>
              <Field label="Tipo de mercancía">
                <Select
                  placeholder="Seleccionar…"
                  options={MERCANCIAS}
                  value={op.mercancia}
                  onChange={(e) => set({ mercancia: e.target.value })}
                />
              </Field>
            </div>

            {!op.mercancia && <Aviso tono="alerta">Seleccioná el tipo de mercancía para definir el flujo.</Aviso>}
            {op.mercancia === 'general' && (
              <Aviso tono="ok">
                <b>Mercancía general.</b> No se activa MSF. Después de cargar la FYDUCA se habilita el
                pago de impuestos.
              </Aviso>
            )}

            {/* MSF: la notificación llega por correo y se vuelve el primer pago */}
            {agricola && (
              <div className="flex flex-col gap-3 rounded-sm border border-ambar-100 bg-ambar-50/50 p-3">
                <div className="flex items-center gap-2 text-sm font-bold text-ambar-700">
                  <LuStethoscope size={15} /> MSF requerido
                </div>
                <p className="m-0 text-sm text-ink-2">
                  La notificación MSF recibida por correo se registra acá y se convierte en una obligación
                  de pago antes de continuar con la emisión de FYDUCA.
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Field label="Número solicitud MSF">
                    <Input value={op.msfNo} disabled={op.msfPagado} onChange={(e) => set({ msfNo: e.target.value })} />
                  </Field>
                  <Field label="Pago transferente">
                    <Input
                      value={op.msfTransferente}
                      disabled={op.msfPagado}
                      onChange={(e) => set({ msfTransferente: e.target.value })}
                    />
                  </Field>
                  <Field label="Pago adquiriente">
                    <Input
                      value={op.msfAdquiriente}
                      disabled={op.msfPagado}
                      onChange={(e) => set({ msfAdquiriente: e.target.value })}
                    />
                  </Field>
                </div>
                {op.msfPagado ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 flex-1">
                      <Aviso tono="ok">
                        <b>Pago MSF registrado.</b> El proveedor puede continuar con la emisión de FYDUCA.
                      </Aviso>
                    </span>
                    <Button size="sm" onClick={() => avisar('Comprobante MSF (demo).', 'ok')}>
                      <LuPaperclip size={12} /> Ver comprobante
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 flex-1 text-xs text-ink-3">Estado: pendiente de pago</span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        set({ msfPagado: true })
                        avisar('MSF enviado a pago. La operación quedó pendiente de FYDUCA.', 'ok')
                      }}
                    >
                      <LuCreditCard size={13} /> Enviar a pago MSF
                    </Button>
                  </div>
                )}
              </div>
            )}

            {esperaFyduca && !op.fyduca && (
              <div className="flex flex-wrap items-center gap-3 rounded-sm border border-line bg-surface-2 p-3">
                <span className="min-w-0 flex-1 text-sm text-ink-2">
                  <b className="text-ink">Esperando FYDUCA.</b> Cuando el proveedor la emita, cargala para
                  habilitar el pago final de impuestos.
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    set({ fyduca: `FYD-${referencia}` })
                    avisar('FYDUCA cargada. Pago de impuestos habilitado.', 'ok')
                  }}
                >
                  <LuFileUp size={13} /> Cargar FYDUCA
                </Button>
              </div>
            )}

            {op.fyduca && (
              <div className="flex flex-col gap-3 rounded-sm border border-line bg-surface-2 p-3">
                <div className="text-sm font-bold text-ink">Pago final de impuestos</div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Field label="Número FYDUCA">
                    <Input value={op.fyduca} disabled readOnly />
                  </Field>
                  <Field label="Impuestos">
                    <Input value={op.impuestos} disabled={op.impPagado} onChange={(e) => set({ impuestos: e.target.value })} />
                  </Field>
                  <Field label="Estado">
                    <Input value={op.impPagado ? 'Pagado' : 'Pendiente de pago'} disabled readOnly />
                  </Field>
                </div>
                {op.impPagado ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 flex-1">
                      <Aviso tono="ok">
                        <b>Impuestos pagados.</b> La operación queda en <b>Esperando salida</b>.
                      </Aviso>
                    </span>
                    <Button size="sm" onClick={() => avisar('Comprobante de impuestos (demo).', 'ok')}>
                      <LuPaperclip size={12} /> Ver comprobante
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 flex-1 text-xs text-ink-3">Segundo pago de la operación</span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        set({ impPagado: true })
                        avisar('Pago de impuestos registrado. Estado: esperando salida.', 'ok')
                      }}
                    >
                      <LuCreditCard size={13} /> Enviar a pago de impuestos
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Proceso pasos={PASOS_FYDUCA} actual={pasoFyduca(op)} />
          </>
        )}
      </div>
    </div>
  )
}
