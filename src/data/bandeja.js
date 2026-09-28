// Bandeja simulada del especialista. `hace` va en minutos desde que se abre la
// pantalla: con fechas fijas la demo se vería vieja a la semana.

export const MI_CORREO = 'abastecimiento@grupovesta.net'

export const ETIQUETAS = {
  Proveedores: 'bg-teal-600',
  Aduana: 'bg-navy-600',
  MSF: 'bg-ambar-500',
  Navieras: 'bg-navy-400',
  Transporte: 'bg-rojo-600',
}

export const BANDEJA = [
  {
    id: 'm1',
    de: 'Notificaciones MSF',
    correo: 'notificaciones@msf.gob.hn',
    asunto: 'Notificación MSF HN-2026-G020842 · pago pendiente',
    cuerpo: `Estimado usuario:

Se registró la solicitud MSF HN-2026-G020842 para la operación FYDUCA HN-2026-F001 (Plátano verde, 500 u.).

Montos a pagar:
 · Pago transferente: USD 6.25
 · Pago adquiriente: HNL 350.00

La emisión de la FYDUCA queda sujeta a la confirmación de ambos pagos.

Este es un mensaje automático, favor no responder.`,
    etiqueta: 'MSF',
    hace: 18,
    leido: false,
    destacado: true,
  },
  {
    id: 'm2',
    de: 'Maersk Line · Documentación',
    correo: 'docs.hn@maersk.com',
    asunto: 'BL MAEU4521387 liberado · listo para recolecta',
    cuerpo: `Buen día,

Les informamos que el BL original MAEU4521387 fue liberado y está disponible para recolecta en nuestra oficina documental de San Pedro Sula.

Horario: lunes a viernes, 8:00 a 16:00.
Favor presentar carta de autorización y copia de identificación del mensajero.

Saludos,
Maersk Line Honduras`,
    etiqueta: 'Navieras',
    hace: 52,
    leido: false,
    adjuntos: ['BL_MAEU4521387.pdf'],
  },
  {
    id: 'm3',
    de: 'Agencia Aduanal Centroamericana',
    correo: 'operaciones@aduanalca.hn',
    asunto: 'Selectivo amarillo · embarque en Pto. Cortés',
    cuerpo: `Estimados,

La declaración del embarque en Pto. Cortés cayó en selectivo amarillo. Necesitamos la factura comercial corregida (el valor unitario no coincide con el BL) para continuar con la liquidación.

Estimamos 24 h adicionales una vez recibido el documento.

Quedamos atentos.`,
    etiqueta: 'Aduana',
    hace: 95,
    leido: false,
    destacado: true,
  },
  {
    id: 'm4',
    de: 'Proveedor Agrícola GT',
    correo: 'exportaciones@agricolagt.com',
    asunto: 'FYDUCA HN-2026-F003 emitida',
    cuerpo: `Buenas tardes,

Adjuntamos la FYDUCA de la operación HN-2026-F003 (Vegetales frescos, 360 u.). Con esto pueden proceder al pago de impuestos.

La carga está lista en nuestro centro de control y sale en cuanto nos confirmen.

Saludos cordiales.`,
    etiqueta: 'Proveedores',
    hace: 180,
    leido: true,
    adjuntos: ['FYDUCA_HN-2026-F003.pdf'],
  },
  {
    id: 'm5',
    de: 'Transportes Rápidos',
    correo: 'trafico@transportesrapidos.com',
    asunto: 'Unidad 1432 · ETA El Poy actualizada',
    cuerpo: `Hola,

La unidad 1432 salió de Laredo con 6 h de retraso por inspección en frontera. Nueva ETA a El Poy: mañana 14:00.

Les avisamos cualquier cambio.`,
    etiqueta: 'Transporte',
    hace: 260,
    leido: true,
  },
  {
    id: 'm6',
    de: 'Empaques Centroamérica',
    correo: 'ventas@empaquesca.com',
    asunto: 'Confirmación OC-4562 · cartón corrugado',
    cuerpo: `Estimados,

Confirmamos la recepción de la OC-4562. El producto está listo y la FYDUCA ya fue pagada; esperamos su instrucción para la salida.

Saludos.`,
    etiqueta: 'Proveedores',
    hace: 60 * 22,
    leido: true,
  },
  {
    id: 'm7',
    de: 'CMA CGM Honduras',
    correo: 'customer.hn@cma-cgm.com',
    asunto: 'Aviso de arribo · CMA Horizon V.118',
    cuerpo: `Estimado cliente,

El buque CMA Horizon V.118 arribará a Pto. Cortés el jueves. Favor tener lista la documentación para evitar cargos de almacenaje.

Días libres: 5.

Atentamente,
CMA CGM`,
    etiqueta: 'Navieras',
    hace: 60 * 30,
    leido: true,
  },
  {
    id: 'm8',
    de: 'Control Tower',
    correo: 'torre@grupovesta.net',
    asunto: 'Resumen diario · 5 alertas abiertas',
    cuerpo: `Resumen automático de la torre de control:

 · 5 embarques con desviación
 · 2 en aduana de destino
 · 3 BL liberados pendientes de recolecta

Revisá el detalle en Control Tower.`,
    etiqueta: 'Aduana',
    hace: 60 * 26,
    leido: true,
  },
]
