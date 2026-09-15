# Datos que vienen con el sistema

## `alicuotas-arba-2026.json`

La tabla de alícuotas del impuesto sobre los ingresos brutos de la **Provincia
de Buenos Aires** para **2026**: 1.022 actividades del nomenclador NAIIB-18, con
la alícuota general de cada una y los **tramos por facturación** del art. 28 de
la Ley Impositiva.

**De dónde sale.** Del archivo *Alicuotaria* que publica ARBA en
<https://www.arba.gov.ar/archivos/Publicaciones/naiib.html>, período
`202601`-`202612`. Ninguno de los porcentajes está estimado ni redondeado: son
los del archivo oficial, tal cual.

**Cómo se generó.** Con el mismo intérprete que usa la aplicación
(`parsearAlicuotariaArba` en `index.html`), para que este archivo no pueda
diferir de lo que el sistema entiende cuando se sube el `.xls` de ARBA a mano.

**Cuándo hay que tocarlo.** Cuando salga la Ley Impositiva del año que viene.
No hace falta editarlo: se baja el archivo nuevo de ARBA y se carga desde
**Alícuotas IIBB → Cargar la tabla**, que se queda con el período más nuevo y
actualiza los códigos que ya estaban. Este JSON queda como el atajo del año en
que se armó.

**Forma del archivo.**

```json
{
  "jurisdiccion": "arba",
  "vigencia": "2026",
  "fuente": "…",
  "minimo": 10967,
  "filas": {
    "691001": {
      "desc": "Servicios jurídicos",
      "alicuota": 4.5,
      "tramos": [[15286053, 3.5], [917163000, 4], [null, 4.5]]
    }
  }
}
```

`tramos` va de menor a mayor: `[techo de facturación, alícuota]`, con `null` en
el último ("de ahí para arriba"). `alicuota` es la general de la actividad, la
que se usa cuando no se sabe cuánto facturó el contribuyente. `minimo` es el
impuesto mínimo mensual, que en este archivo es el mismo para todas las
actividades y por eso va una sola vez arriba.
