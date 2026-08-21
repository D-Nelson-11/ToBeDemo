# Portal de Abastecimiento — demo "To Be"

Demo de frontend (sin backend) de la propuesta de mejora del flujo de abastecimiento.
Todos los datos son mock y viven en memoria: se reinician al recargar.

## El recorrido

| Paso | Pantalla | Qué muestra |
| --- | --- | --- |
| 1 | Crear Orden de Compra | Alta de la OC, lectura simulada del PDF del proveedor y tabla de materiales editable. |
| 2 | Crear Despacho | Listado de OC con estado abierta/cerrada, filtros por situación, inactivar OC y edición de cantidades. El modal compara rutas y arma el borrador de despachos. |
| 3 | Seguimiento de Despacho | Programación con ETD / ETA frontera / ETA planta, checklists de aduana y logístico, próxima tarea y alerta por color. |

Lo que se hace en un paso aparece en el siguiente: una OC creada en el paso 1 se
puede despachar en el 2, y esos despachos se siguen en el 3.

## Correr en local

```bash
pnpm install
pnpm dev
```

## Publicar

Cada push a `main` dispara el workflow `.github/workflows/deploy.yml`, que compila
y reemplaza la rama `gh-pages`. No hay que correr nada a mano.

Para publicar desde la máquina sin pasar por el workflow:

```bash
pnpm deploy
```

Usa `HashRouter` y `base: './'`, así que funciona desde un subdirectorio sin
configuración extra.

## Dónde tocar las cosas

- `src/styles/app.css` — tokens de color, tipografía, ancho del contenedor
  (`--container-app`) y alto de las tablas (`--alto-tabla`).
- `src/data/catalogos.js` — proveedores, incoterms, maestro de rutas y checklists.
- `src/data/ordenes.js` — las órdenes de compra de ejemplo.
