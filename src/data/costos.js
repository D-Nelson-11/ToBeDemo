// Costos logísticos de embarques en aduana. Los datos salen del HTML de
// referencia tal cual: los montos y porcentajes están calibrados entre sí, así que
// cambiar uno suelto descuadra los totales del Resumen.
//
// Cada vista es declarativa y la pinta un solo componente (VistaCostos): métricas,
// filtros, tabla, reglas, notas y paneles. Agregar una vista es agregar una entrada
// acá y su id en el módulo que corresponda.

export const MODULOS_COSTOS = [
  {
    "id": "costos",
    "rotulo": "Costos logísticos",
    "vistas": [
      "overview",
      "risk",
      "low",
      "medium",
      "high",
      "postcustoms",
      "freeTime"
    ]
  },
  {
    "id": "tipos",
    "rotulo": "Tipos de costo",
    "vistas": [
      "demurrage",
      "storage",
      "chassis",
      "decouple",
      "fuel",
      "accumulated"
    ]
  },
  {
    "id": "gestion",
    "rotulo": "Gestión",
    "vistas": [
      "alerts",
      "approvals",
      "reports"
    ]
  }
]

export const VISTAS_COSTOS = {
  "overview": {
    "rotulo": "Resumen de costos",
    "titulo": "Costos Logísticos de Embarques en Aduana",
    "sub": null,
    "metricas": [
      {
        "tono": null,
        "rotulo": "Embarques en aduana",
        "valor": "24",
        "pie": "Activos"
      },
      {
        "tono": null,
        "rotulo": "Costo total estimado",
        "valor": "USD 285,450",
        "pie": "Costos abiertos"
      },
      {
        "tono": "red",
        "rotulo": "Demoras",
        "valor": "USD 95,350",
        "pie": "33% del total"
      },
      {
        "tono": "green",
        "rotulo": "Estadía chasis",
        "valor": "USD 45,600",
        "pie": "16% del total"
      },
      {
        "tono": null,
        "rotulo": "Multas",
        "valor": "USD 72,800",
        "pie": "26% del total"
      },
      {
        "tono": "purple",
        "rotulo": "Almacenaje",
        "valor": "USD 71,700",
        "pie": "25% del total"
      }
    ],
    "sitios": [
      "Planta Centro",
      "Planta Norte",
      "Planta Sur",
      "Demora",
      "Estadía Chasis",
      "Multa",
      "Almacenaje"
    ],
    "tabs": [
      [
        "Todos",
        "Todos 24"
      ],
      [
        "Demora",
        "Demoras 8"
      ],
      [
        "Estadía Chasis",
        "Estadía Chasis 6"
      ],
      [
        "Multa",
        "Multas 5"
      ],
      [
        "Almacenaje",
        "Almacenaje 5"
      ]
    ],
    "columnas": [
      "Embarque",
      "OC / BL",
      "Nave / Viaje",
      "Naviera",
      "Sitio",
      "Estado Aduana",
      "Costo",
      "Días",
      "Costo / día",
      "Costo estimado",
      "Inicio",
      "Riesgo",
      "Acciones"
    ],
    "filas": [
      [
        {
          "texto": "EMB-2045",
          "fuerte": true
        },
        {
          "texto": "OC-550023 / BL-789456",
          "fuerte": false
        },
        {
          "texto": "MSC BRAVO / 139E",
          "fuerte": false
        },
        {
          "texto": "MSC",
          "fuerte": false
        },
        {
          "texto": "Planta Centro",
          "fuerte": false
        },
        {
          "punto": "azul",
          "texto": "En proceso"
        },
        {
          "badge": "delay",
          "texto": "Demora"
        },
        {
          "texto": "2",
          "fuerte": false
        },
        {
          "texto": "$250",
          "fuerte": false
        },
        {
          "texto": "$500",
          "fuerte": true
        },
        {
          "texto": "28/08/2026",
          "fuerte": false
        },
        {
          "badge": "high",
          "texto": "Alto"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            " Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2046",
          "fuerte": true
        },
        {
          "texto": "OC-550024 / BL-789457",
          "fuerte": false
        },
        {
          "texto": "ONE HOUSTON / 042W",
          "fuerte": false
        },
        {
          "texto": "ONE",
          "fuerte": false
        },
        {
          "texto": "Planta Norte",
          "fuerte": false
        },
        {
          "punto": "azul",
          "texto": "En proceso"
        },
        {
          "badge": "chasis",
          "texto": "Estadía Chasis"
        },
        {
          "texto": "3",
          "fuerte": false
        },
        {
          "texto": "$120",
          "fuerte": false
        },
        {
          "texto": "$360",
          "fuerte": true
        },
        {
          "texto": "27/08/2026",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Medio"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            " Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2047",
          "fuerte": true
        },
        {
          "texto": "OC-550025 / BL-789458",
          "fuerte": false
        },
        {
          "texto": "CMA CGM LISA / 0FLG1WMA",
          "fuerte": false
        },
        {
          "texto": "CMA CGM",
          "fuerte": false
        },
        {
          "texto": "Planta Sur",
          "fuerte": false
        },
        {
          "punto": "ambar",
          "texto": "Inspección"
        },
        {
          "badge": "multa",
          "texto": "Multa"
        },
        {
          "texto": "1",
          "fuerte": false
        },
        {
          "texto": "$1,250",
          "fuerte": false
        },
        {
          "texto": "$1,250",
          "fuerte": true
        },
        {
          "texto": "29/08/2026",
          "fuerte": false
        },
        {
          "badge": "high",
          "texto": "Alto"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            " Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2048",
          "fuerte": true
        },
        {
          "texto": "OC-550026 / BL-789459",
          "fuerte": false
        },
        {
          "texto": "MAERSK EDISON / 514S",
          "fuerte": false
        },
        {
          "texto": "MAERSK",
          "fuerte": false
        },
        {
          "texto": "Planta Centro",
          "fuerte": false
        },
        {
          "punto": "azul",
          "texto": "En proceso"
        },
        {
          "badge": "alm",
          "texto": "Almacenaje"
        },
        {
          "texto": "2",
          "fuerte": false
        },
        {
          "texto": "$180",
          "fuerte": false
        },
        {
          "texto": "$360",
          "fuerte": true
        },
        {
          "texto": "28/08/2026",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Medio"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            " Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2049",
          "fuerte": true
        },
        {
          "texto": "OC-550027 / BL-789460",
          "fuerte": false
        },
        {
          "texto": "HMM ALGECIRAS / 021E",
          "fuerte": false
        },
        {
          "texto": "HMM",
          "fuerte": false
        },
        {
          "texto": "Planta Norte",
          "fuerte": false
        },
        {
          "punto": "azul",
          "texto": "En proceso"
        },
        {
          "badge": "delay",
          "texto": "Demora"
        },
        {
          "texto": "4",
          "fuerte": false
        },
        {
          "texto": "$250",
          "fuerte": false
        },
        {
          "texto": "$1,000",
          "fuerte": true
        },
        {
          "texto": "26/08/2026",
          "fuerte": false
        },
        {
          "badge": "high",
          "texto": "Alto"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            " Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2050",
          "fuerte": true
        },
        {
          "texto": "OC-550028 / BL-789461",
          "fuerte": false
        },
        {
          "texto": "APL RAFFLES / 0FLG1WMA",
          "fuerte": false
        },
        {
          "texto": "APL",
          "fuerte": false
        },
        {
          "texto": "Planta Sur",
          "fuerte": false
        },
        {
          "punto": "rojo",
          "texto": "Retenido"
        },
        {
          "badge": "chasis",
          "texto": "Estadía Chasis"
        },
        {
          "texto": "5",
          "fuerte": false
        },
        {
          "texto": "$120",
          "fuerte": false
        },
        {
          "texto": "$600",
          "fuerte": true
        },
        {
          "texto": "25/08/2026",
          "fuerte": false
        },
        {
          "badge": "high",
          "texto": "Alto"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            " Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2051",
          "fuerte": true
        },
        {
          "texto": "OC-550029 / BL-789462",
          "fuerte": false
        },
        {
          "texto": "MSC SEASIDE / 140E",
          "fuerte": false
        },
        {
          "texto": "MSC",
          "fuerte": false
        },
        {
          "texto": "Planta Centro",
          "fuerte": false
        },
        {
          "punto": "azul",
          "texto": "En proceso"
        },
        {
          "badge": "multa",
          "texto": "Multa"
        },
        {
          "texto": "1",
          "fuerte": false
        },
        {
          "texto": "$750",
          "fuerte": false
        },
        {
          "texto": "$750",
          "fuerte": true
        },
        {
          "texto": "30/08/2026",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Medio"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            " Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2052",
          "fuerte": true
        },
        {
          "texto": "OC-550030 / BL-789463",
          "fuerte": false
        },
        {
          "texto": "COSCO SHIPPING / 023E",
          "fuerte": false
        },
        {
          "texto": "COSCO",
          "fuerte": false
        },
        {
          "texto": "Planta Norte",
          "fuerte": false
        },
        {
          "punto": "azul",
          "texto": "En proceso"
        },
        {
          "badge": "alm",
          "texto": "Almacenaje"
        },
        {
          "texto": "3",
          "fuerte": false
        },
        {
          "texto": "$180",
          "fuerte": false
        },
        {
          "texto": "$540",
          "fuerte": true
        },
        {
          "texto": "27/08/2026",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Medio"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            " Aprobar"
          ]
        }
      ]
    ],
    "paneles": [
      {
        "titulo": "Resumen y proyección",
        "filas": [
          [
            "Costo total estimado",
            "USD 285,450"
          ],
          [
            "Demoras",
            "USD 95,350"
          ],
          [
            "Estadía Chasis",
            "USD 45,600"
          ],
          [
            "Multas",
            "USD 72,800"
          ],
          [
            "Almacenaje",
            "USD 71,700"
          ]
        ],
        "barras": [],
        "notas": []
      },
      {
        "titulo": "Costos por tipo",
        "filas": [
          [
            "Demoras",
            "33%"
          ],
          [
            "Estadía Chasis",
            "16%"
          ],
          [
            "Multas",
            "26%"
          ],
          [
            "Almacenaje",
            "25%"
          ]
        ],
        "barras": [
          [
            33,
            "#d84b45"
          ],
          [
            16,
            "#2b70a5"
          ],
          [
            26,
            "#e8872d"
          ],
          [
            25,
            "#7653a6"
          ]
        ],
        "notas": []
      },
      {
        "titulo": "Casos prioritarios",
        "filas": [],
        "barras": [],
        "notas": [
          {
            "tipo": "alert",
            "texto": "EMB-2050 · 5 días de estadía chasis · Retenido · Nivel 3"
          },
          {
            "tipo": "note",
            "texto": "EMB-2049 · 4 días de demora · USD 1,000 · Nivel 2"
          }
        ]
      },
      {
        "titulo": "Gestión de costos, eventos y escalamiento",
        "filas": [],
        "barras": [],
        "notas": [
          {
            "tipo": "alert",
            "texto": "Caso crítico: un embarque retenido que acumula días de estadía debe generar alerta a Aduana, Transporte, Compras y responsable del sitio."
          },
          {
            "tipo": "note",
            "texto": "Nota automática: registrar causa, evidencia, días cobrados, costo por día, costo proyectado y responsable."
          }
        ]
      }
    ]
  },
  "risk": {
    "rotulo": "Riesgo de generar costo",
    "titulo": "Embarques con Riesgo de Generar Costos",
    "sub": "Embarques próximos a vencer tiempo libre o exceder la ventana operativa.",
    "contador": 7,
    "metricas": [
      {
        "tono": "yellow",
        "rotulo": "Vence en ≤ 24 h",
        "valor": "3",
        "pie": null
      },
      {
        "tono": "yellow",
        "rotulo": "Vence en 24–48 h",
        "valor": "4",
        "pie": null
      },
      {
        "tono": null,
        "rotulo": "Costo potencial",
        "valor": "USD 8,420",
        "pie": null
      },
      {
        "tono": "red",
        "rotulo": "Alto riesgo",
        "valor": "2",
        "pie": null
      },
      {
        "tono": "green",
        "rotulo": "Intervenibles",
        "valor": "7",
        "pie": null
      }
    ],
    "columnas": [
      "Embarque",
      "Sitio",
      "Estado",
      "Tiempo libre vence",
      "Horas restantes",
      "Costo que podría iniciar",
      "Proyección diaria",
      "Riesgo",
      "Acción"
    ],
    "filas": [
      [
        {
          "texto": "EMB-2060",
          "fuerte": true
        },
        {
          "texto": "Planta Centro",
          "fuerte": false
        },
        {
          "texto": "Aduana",
          "fuerte": false
        },
        {
          "texto": "24/08 · 18:00",
          "fuerte": false
        },
        {
          "texto": "8 h",
          "fuerte": false
        },
        {
          "texto": "Demora / Storage",
          "fuerte": false
        },
        {
          "texto": "$420/día",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Medio"
        },
        {
          "acciones": [
            "Ver / actuar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2061",
          "fuerte": true
        },
        {
          "texto": "Planta Sur",
          "fuerte": false
        },
        {
          "texto": "Aduana",
          "fuerte": false
        },
        {
          "texto": "25/08 · 08:00",
          "fuerte": false
        },
        {
          "texto": "22 h",
          "fuerte": false
        },
        {
          "texto": "Storage",
          "fuerte": false
        },
        {
          "texto": "$310/día",
          "fuerte": false
        },
        {
          "badge": "high",
          "texto": "Alto"
        },
        {
          "acciones": [
            "Intervenir"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2062",
          "fuerte": true
        },
        {
          "texto": "Planta Norte",
          "fuerte": false
        },
        {
          "texto": "Aduana",
          "fuerte": false
        },
        {
          "texto": "26/08 · 10:00",
          "fuerte": false
        },
        {
          "texto": "48 h",
          "fuerte": false
        },
        {
          "texto": "Demora",
          "fuerte": false
        },
        {
          "texto": "$250/día",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Medio"
        },
        {
          "acciones": [
            "Ver / actuar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2063",
          "fuerte": true
        },
        {
          "texto": "Planta Centro",
          "fuerte": false
        },
        {
          "texto": "Inspección",
          "fuerte": false
        },
        {
          "texto": "25/08 · 06:00",
          "fuerte": false
        },
        {
          "texto": "20 h",
          "fuerte": false
        },
        {
          "texto": "Demora / Multa",
          "fuerte": false
        },
        {
          "texto": "$680/día",
          "fuerte": false
        },
        {
          "badge": "high",
          "texto": "Alto"
        },
        {
          "acciones": [
            "Escalar"
          ]
        }
      ]
    ]
  },
  "low": {
    "rotulo": "Costos bajos",
    "titulo": "Embarques con Costos Bajos",
    "sub": "Alertas preventivas para evitar que el costo aumente.",
    "columnas": [
      "Embarque",
      "Sitio",
      "Costo actual",
      "Tipo",
      "Días",
      "Próximo umbral",
      "Alerta",
      "Acción"
    ],
    "filas": [
      [
        {
          "texto": "EMB-2046",
          "fuerte": false
        },
        {
          "texto": "Planta Norte",
          "fuerte": false
        },
        {
          "texto": "$360",
          "fuerte": false
        },
        {
          "texto": "Estadía Chasis",
          "fuerte": false
        },
        {
          "texto": "3",
          "fuerte": false
        },
        {
          "texto": "24 h",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Vigilar"
        },
        {
          "acciones": [
            "Seguimiento"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2048",
          "fuerte": false
        },
        {
          "texto": "Planta Centro",
          "fuerte": false
        },
        {
          "texto": "$360",
          "fuerte": false
        },
        {
          "texto": "Storage",
          "fuerte": false
        },
        {
          "texto": "2",
          "fuerte": false
        },
        {
          "texto": "48 h",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Preventiva"
        },
        {
          "acciones": [
            "Seguimiento"
          ]
        }
      ]
    ]
  },
  "medium": {
    "rotulo": "Costos medios",
    "titulo": "Embarques con Costos Medios",
    "sub": "Casos que requieren validación y seguimiento activo.",
    "columnas": [
      "Embarque",
      "Sitio",
      "Tipo",
      "Costo",
      "Días",
      "Causa",
      "Alerta",
      "Acción"
    ],
    "filas": [
      [
        {
          "texto": "EMB-2045",
          "fuerte": false
        },
        {
          "texto": "Planta Centro",
          "fuerte": false
        },
        {
          "texto": "Demora",
          "fuerte": false
        },
        {
          "texto": "$500",
          "fuerte": false
        },
        {
          "texto": "2",
          "fuerte": false
        },
        {
          "texto": "Corrección documental",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Nivel 2"
        },
        {
          "acciones": [
            "Validar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2052",
          "fuerte": false
        },
        {
          "texto": "Planta Norte",
          "fuerte": false
        },
        {
          "texto": "Storage",
          "fuerte": false
        },
        {
          "texto": "$540",
          "fuerte": false
        },
        {
          "texto": "3",
          "fuerte": false
        },
        {
          "texto": "Retención",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Nivel 2"
        },
        {
          "acciones": [
            "Validar"
          ]
        }
      ]
    ]
  },
  "high": {
    "rotulo": "Costos altos / acciones",
    "titulo": "Embarques con Costos Altos · Acciones",
    "sub": "Casos con impacto económico o riesgo de escalamiento.",
    "metricas": [
      {
        "tono": "red",
        "rotulo": "Casos críticos",
        "valor": "3",
        "pie": null
      },
      {
        "tono": "red",
        "rotulo": "Costo acumulado",
        "valor": "USD 18,740",
        "pie": null
      },
      {
        "tono": null,
        "rotulo": "Para aprobación",
        "valor": "2",
        "pie": null
      },
      {
        "tono": "yellow",
        "rotulo": "Para escalamiento",
        "valor": "2",
        "pie": null
      },
      {
        "tono": null,
        "rotulo": "Áreas involucradas",
        "valor": "5",
        "pie": null
      }
    ],
    "columnas": [
      "Embarque",
      "Sitio",
      "Costo",
      "Causa",
      "Días",
      "Proyección",
      "Áreas",
      "Acciones"
    ],
    "filas": [
      [
        {
          "texto": "EMB-2050",
          "fuerte": true
        },
        {
          "texto": "Planta Sur",
          "fuerte": false
        },
        {
          "texto": "$3,900",
          "fuerte": true
        },
        {
          "texto": "Estadía chasis",
          "fuerte": false
        },
        {
          "texto": "5",
          "fuerte": false
        },
        {
          "texto": "$780/día",
          "fuerte": false
        },
        {
          "texto": "Transporte / Aduana / Compras",
          "fuerte": false
        },
        {
          "acciones": [
            "Escalar",
            "Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2047",
          "fuerte": true
        },
        {
          "texto": "Planta Sur",
          "fuerte": false
        },
        {
          "texto": "$1,250",
          "fuerte": true
        },
        {
          "texto": "Multa",
          "fuerte": false
        },
        {
          "texto": "1",
          "fuerte": false
        },
        {
          "texto": "$1,250/día",
          "fuerte": false
        },
        {
          "texto": "Aduana / Compras",
          "fuerte": false
        },
        {
          "acciones": [
            "Escalar",
            "Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2049",
          "fuerte": true
        },
        {
          "texto": "Planta Norte",
          "fuerte": false
        },
        {
          "texto": "$1,000",
          "fuerte": true
        },
        {
          "texto": "Demora",
          "fuerte": false
        },
        {
          "texto": "4",
          "fuerte": false
        },
        {
          "texto": "$250/día",
          "fuerte": false
        },
        {
          "texto": "Naviera / Aduana",
          "fuerte": false
        },
        {
          "acciones": [
            "Escalar"
          ]
        }
      ]
    ]
  },
  "postcustoms": {
    "rotulo": "Costos post-aduana",
    "titulo": "Posibles Costos Post-Aduana",
    "sub": "Control desde la liberación hasta descarga y cierre operativo.",
    "metricas": [
      {
        "tono": "yellow",
        "rotulo": "Riesgo Chasis",
        "valor": "5",
        "pie": null
      },
      {
        "tono": "yellow",
        "rotulo": "Riesgo estadía planta",
        "valor": "4",
        "pie": null
      },
      {
        "tono": null,
        "rotulo": "Desacople potencial",
        "valor": "2",
        "pie": null
      },
      {
        "tono": null,
        "rotulo": "Combustible proyectado",
        "valor": "USD 2,860",
        "pie": null
      },
      {
        "tono": "red",
        "rotulo": "Demora acumulada",
        "valor": "USD 6,420",
        "pie": null
      }
    ],
    "columnas": [
      "Embarque",
      "Sitio",
      "Fin tiempo libre",
      "Inicio descarga",
      "Estado",
      "Chasis",
      "Estadía planta",
      "Demora acumulada",
      "Proyección"
    ],
    "filas": [
      [
        {
          "texto": "EMB-2070",
          "fuerte": false
        },
        {
          "texto": "Planta Centro",
          "fuerte": false
        },
        {
          "texto": "25/08 18:00",
          "fuerte": false
        },
        {
          "texto": "26/08 08:00",
          "fuerte": false
        },
        {
          "texto": "Liberado",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Riesgo"
        },
        {
          "texto": "0 días",
          "fuerte": false
        },
        {
          "texto": "$0",
          "fuerte": false
        },
        {
          "texto": "$120/día",
          "fuerte": false
        }
      ],
      [
        {
          "texto": "EMB-2071",
          "fuerte": false
        },
        {
          "texto": "Planta Norte",
          "fuerte": false
        },
        {
          "texto": "24/08 18:00",
          "fuerte": false
        },
        {
          "texto": "25/08 14:00",
          "fuerte": false
        },
        {
          "texto": "Liberado",
          "fuerte": false
        },
        {
          "badge": "high",
          "texto": "Activo"
        },
        {
          "texto": "1 día",
          "fuerte": false
        },
        {
          "texto": "$420",
          "fuerte": false
        },
        {
          "texto": "$180/día",
          "fuerte": false
        }
      ],
      [
        {
          "texto": "EMB-2072",
          "fuerte": false
        },
        {
          "texto": "Planta Sur",
          "fuerte": false
        },
        {
          "texto": "23/08 18:00",
          "fuerte": false
        },
        {
          "texto": "25/08 10:00",
          "fuerte": false
        },
        {
          "texto": "En descarga",
          "fuerte": false
        },
        {
          "badge": "high",
          "texto": "Activo"
        },
        {
          "texto": "2 días",
          "fuerte": false
        },
        {
          "texto": "$680",
          "fuerte": false
        },
        {
          "texto": "$240/día",
          "fuerte": false
        }
      ]
    ]
  },
  "freeTime": {
    "rotulo": "Tiempo libre / vencimientos",
    "titulo": "Tiempo Libre y Vencimientos",
    "sub": "El reloj operativo determina cuándo comienza a generarse cada costo.",
    "reglas": [
      {
        "titulo": "Demora",
        "texto": "Definición: costo excedente al tiempo libre de la naviera, dentro y fuera de puerto.Regla: al terminar el tiempo libre se inicia el conteo del costo según la tarifa aplicable."
      },
      {
        "titulo": "Storage",
        "texto": "Definición: costo de almacenaje dentro del puerto.Regla: vence al terminar el tiempo libre y continúa mientras la carga permanezca almacenada."
      },
      {
        "titulo": "Estadía de chasis",
        "texto": "Definición: costo que se cobra al exceder el tiempo acordado de descarga.Regla: controlar desde llegada a planta / inicio de descarga hasta devolución o cierre del equipo."
      },
      {
        "titulo": "Desacople",
        "texto": "Definición: costo asociado a separación de unidad/equipo cuando el proceso operativo lo requiere."
      },
      {
        "titulo": "Combustible",
        "texto": "Definición: costo adicional asociado al servicio/transporte según operación y condiciones aplicables."
      }
    ]
  },
  "demurrage": {
    "rotulo": "Demora",
    "titulo": "Demora",
    "sub": "Costo excedente al tiempo libre de la naviera dentro y fuera de puerto.",
    "metricas": [
      {
        "tono": "red",
        "rotulo": "Costo actual",
        "valor": "$95,350",
        "pie": "33% del total"
      },
      {
        "tono": null,
        "rotulo": "Embarques",
        "valor": "8",
        "pie": "Activos"
      },
      {
        "tono": "yellow",
        "rotulo": "Próximos a vencer",
        "valor": "4",
        "pie": "Preventiva"
      },
      {
        "tono": "yellow",
        "rotulo": "Proyección 48 h",
        "valor": "+$8,200",
        "pie": null
      },
      {
        "tono": null,
        "rotulo": "Mayor causa",
        "valor": "Aduana",
        "pie": null
      }
    ],
    "sitios": [
      "Planta Centro",
      "Planta Norte",
      "Planta Sur"
    ],
    "columnas": [
      "Embarque",
      "OC / BL",
      "Sitio",
      "Causa",
      "Fin tiempo libre",
      "Días",
      "Costo / día",
      "Costo actual",
      "Proyección",
      "Riesgo",
      "Acciones"
    ],
    "filas": [
      [
        {
          "texto": "EMB-2045",
          "fuerte": true
        },
        {
          "texto": "OC-550023 / BL-789456",
          "fuerte": false
        },
        {
          "texto": "Planta Centro",
          "fuerte": false
        },
        {
          "texto": "Corrección documental",
          "fuerte": false
        },
        {
          "texto": "28/08/2026 18:00",
          "fuerte": false
        },
        {
          "texto": "2",
          "fuerte": false
        },
        {
          "texto": "$250",
          "fuerte": true
        },
        {
          "texto": "$500",
          "fuerte": false
        },
        {
          "texto": "$750",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Medio"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            "Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2049",
          "fuerte": true
        },
        {
          "texto": "OC-550027 / BL-789460",
          "fuerte": false
        },
        {
          "texto": "Planta Norte",
          "fuerte": false
        },
        {
          "texto": "Retención / liberación tardía",
          "fuerte": false
        },
        {
          "texto": "26/08/2026 18:00",
          "fuerte": false
        },
        {
          "texto": "4",
          "fuerte": false
        },
        {
          "texto": "$250",
          "fuerte": true
        },
        {
          "texto": "$1,000",
          "fuerte": false
        },
        {
          "texto": "$1,250",
          "fuerte": false
        },
        {
          "badge": "high",
          "texto": "Alto"
        },
        {
          "acciones": [
            "Detalle",
            "Escalar",
            "Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2072",
          "fuerte": true
        },
        {
          "texto": "OC-550031 / BL-789464",
          "fuerte": false
        },
        {
          "texto": "Planta Sur",
          "fuerte": false
        },
        {
          "texto": "Tiempo libre agotado",
          "fuerte": false
        },
        {
          "texto": "23/08/2026 18:00",
          "fuerte": false
        },
        {
          "texto": "2",
          "fuerte": false
        },
        {
          "texto": "$340",
          "fuerte": true
        },
        {
          "texto": "$680",
          "fuerte": false
        },
        {
          "texto": "$1,020",
          "fuerte": false
        },
        {
          "badge": "high",
          "texto": "Alto"
        },
        {
          "acciones": [
            "Detalle",
            "Escalar",
            "Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2075",
          "fuerte": true
        },
        {
          "texto": "OC-550034 / BL-789467",
          "fuerte": false
        },
        {
          "texto": "Planta Centro",
          "fuerte": false
        },
        {
          "texto": "Demora fuera de puerto",
          "fuerte": false
        },
        {
          "texto": "24/08/2026 18:00",
          "fuerte": false
        },
        {
          "texto": "1",
          "fuerte": false
        },
        {
          "texto": "$190",
          "fuerte": true
        },
        {
          "texto": "$190",
          "fuerte": false
        },
        {
          "texto": "$380",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Medio"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            "Aprobar"
          ]
        }
      ]
    ]
  },
  "storage": {
    "rotulo": "Storage",
    "titulo": "Storage",
    "sub": "Costo de almacenaje dentro del puerto; inicia al terminar el tiempo libre.",
    "metricas": [
      {
        "tono": "purple",
        "rotulo": "Costo actual",
        "valor": "$71,700",
        "pie": "25% del total"
      },
      {
        "tono": null,
        "rotulo": "Embarques",
        "valor": "5",
        "pie": "Activos"
      },
      {
        "tono": "yellow",
        "rotulo": "Próximos a vencer",
        "valor": "3",
        "pie": null
      },
      {
        "tono": "yellow",
        "rotulo": "Proyección diaria",
        "valor": "$2,140",
        "pie": null
      },
      {
        "tono": "red",
        "rotulo": "Críticos",
        "valor": "1",
        "pie": null
      }
    ],
    "sitios": [
      "Planta Centro",
      "Planta Norte",
      "Planta Sur"
    ],
    "columnas": [
      "Embarque",
      "OC / BL",
      "Sitio",
      "Causa",
      "Fin tiempo libre",
      "Días",
      "Costo / día",
      "Costo actual",
      "Proyección",
      "Riesgo",
      "Acciones"
    ],
    "filas": [
      [
        {
          "texto": "EMB-2048",
          "fuerte": true
        },
        {
          "texto": "OC-550026 / BL-789459",
          "fuerte": false
        },
        {
          "texto": "Planta Centro",
          "fuerte": false
        },
        {
          "texto": "Carga permanece en puerto",
          "fuerte": false
        },
        {
          "texto": "28/08/2026 18:00",
          "fuerte": false
        },
        {
          "texto": "2",
          "fuerte": false
        },
        {
          "texto": "$180",
          "fuerte": true
        },
        {
          "texto": "$360",
          "fuerte": false
        },
        {
          "texto": "$540",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Medio"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            "Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2052",
          "fuerte": true
        },
        {
          "texto": "OC-550030 / BL-789463",
          "fuerte": false
        },
        {
          "texto": "Planta Norte",
          "fuerte": false
        },
        {
          "texto": "Retención documental",
          "fuerte": false
        },
        {
          "texto": "27/08/2026 18:00",
          "fuerte": false
        },
        {
          "texto": "3",
          "fuerte": false
        },
        {
          "texto": "$180",
          "fuerte": true
        },
        {
          "texto": "$540",
          "fuerte": false
        },
        {
          "texto": "$720",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Medio"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            "Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2061",
          "fuerte": true
        },
        {
          "texto": "OC-550032 / BL-789465",
          "fuerte": false
        },
        {
          "texto": "Planta Sur",
          "fuerte": false
        },
        {
          "texto": "Inspección",
          "fuerte": false
        },
        {
          "texto": "25/08/2026 08:00",
          "fuerte": false
        },
        {
          "texto": "1",
          "fuerte": false
        },
        {
          "texto": "$310",
          "fuerte": true
        },
        {
          "texto": "$310",
          "fuerte": false
        },
        {
          "texto": "$930",
          "fuerte": false
        },
        {
          "badge": "high",
          "texto": "Alto"
        },
        {
          "acciones": [
            "Detalle",
            "Escalar",
            "Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2076",
          "fuerte": true
        },
        {
          "texto": "OC-550035 / BL-789468",
          "fuerte": false
        },
        {
          "texto": "Planta Norte",
          "fuerte": false
        },
        {
          "texto": "Carga pendiente de retiro",
          "fuerte": false
        },
        {
          "texto": "26/08/2026 12:00",
          "fuerte": false
        },
        {
          "texto": "2",
          "fuerte": false
        },
        {
          "texto": "$220",
          "fuerte": true
        },
        {
          "texto": "$440",
          "fuerte": false
        },
        {
          "texto": "$880",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Medio"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            "Aprobar"
          ]
        }
      ]
    ]
  },
  "chassis": {
    "rotulo": "Estadía de chasis",
    "titulo": "Estadía de Chasis",
    "sub": "Costo cobrado al exceder el tiempo acordado de descarga.",
    "metricas": [
      {
        "tono": "green",
        "rotulo": "Costo actual",
        "valor": "$45,600",
        "pie": "16% del total"
      },
      {
        "tono": null,
        "rotulo": "Embarques",
        "valor": "6",
        "pie": "Activos"
      },
      {
        "tono": "yellow",
        "rotulo": "En descarga",
        "valor": "4",
        "pie": null
      },
      {
        "tono": "red",
        "rotulo": "Excedidos",
        "valor": "2",
        "pie": null
      },
      {
        "tono": null,
        "rotulo": "Proyección diaria",
        "valor": "$1,080",
        "pie": null
      }
    ],
    "sitios": [
      "Planta Centro",
      "Planta Norte",
      "Planta Sur"
    ],
    "columnas": [
      "Embarque",
      "OC / BL",
      "Sitio",
      "Causa",
      "Fin tiempo libre",
      "Días",
      "Costo / día",
      "Costo actual",
      "Proyección",
      "Riesgo",
      "Acciones"
    ],
    "filas": [
      [
        {
          "texto": "EMB-2050",
          "fuerte": true
        },
        {
          "texto": "OC-550028 / BL-789461",
          "fuerte": false
        },
        {
          "texto": "Planta Sur",
          "fuerte": false
        },
        {
          "texto": "Descarga excede ventana",
          "fuerte": false
        },
        {
          "texto": "25/08/2026 18:00",
          "fuerte": false
        },
        {
          "texto": "5",
          "fuerte": false
        },
        {
          "texto": "$780",
          "fuerte": true
        },
        {
          "texto": "$3,900",
          "fuerte": false
        },
        {
          "texto": "$4,680",
          "fuerte": false
        },
        {
          "badge": "high",
          "texto": "Alto"
        },
        {
          "acciones": [
            "Detalle",
            "Escalar",
            "Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2046",
          "fuerte": true
        },
        {
          "texto": "OC-550024 / BL-789457",
          "fuerte": false
        },
        {
          "texto": "Planta Norte",
          "fuerte": false
        },
        {
          "texto": "Descarga pendiente",
          "fuerte": false
        },
        {
          "texto": "27/08/2026 18:00",
          "fuerte": false
        },
        {
          "texto": "3",
          "fuerte": false
        },
        {
          "texto": "$120",
          "fuerte": true
        },
        {
          "texto": "$360",
          "fuerte": false
        },
        {
          "texto": "$480",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Medio"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            "Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2071",
          "fuerte": true
        },
        {
          "texto": "OC-550033 / BL-789466",
          "fuerte": false
        },
        {
          "texto": "Planta Norte",
          "fuerte": false
        },
        {
          "texto": "Demora en descarga",
          "fuerte": false
        },
        {
          "texto": "24/08/2026 18:00",
          "fuerte": false
        },
        {
          "texto": "1",
          "fuerte": false
        },
        {
          "texto": "$180",
          "fuerte": true
        },
        {
          "texto": "$180",
          "fuerte": false
        },
        {
          "texto": "$360",
          "fuerte": false
        },
        {
          "badge": "high",
          "texto": "Alto"
        },
        {
          "acciones": [
            "Detalle",
            "Escalar",
            "Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2077",
          "fuerte": true
        },
        {
          "texto": "OC-550036 / BL-789469",
          "fuerte": false
        },
        {
          "texto": "Planta Centro",
          "fuerte": false
        },
        {
          "texto": "Equipo pendiente de devolución",
          "fuerte": false
        },
        {
          "texto": "26/08/2026 18:00",
          "fuerte": false
        },
        {
          "texto": "2",
          "fuerte": false
        },
        {
          "texto": "$150",
          "fuerte": true
        },
        {
          "texto": "$300",
          "fuerte": false
        },
        {
          "texto": "$450",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Medio"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            "Aprobar"
          ]
        }
      ]
    ]
  },
  "decouple": {
    "rotulo": "Desacople",
    "titulo": "Desacople",
    "sub": "Costos asociados a separación de unidad/equipo durante la operación.",
    "metricas": [
      {
        "tono": null,
        "rotulo": "Casos activos",
        "valor": "2",
        "pie": null
      },
      {
        "tono": "yellow",
        "rotulo": "Riesgo",
        "valor": "3",
        "pie": null
      },
      {
        "tono": null,
        "rotulo": "Costo actual",
        "valor": "$1,840",
        "pie": null
      },
      {
        "tono": "yellow",
        "rotulo": "Proyección",
        "valor": "$3,570",
        "pie": null
      },
      {
        "tono": "red",
        "rotulo": "Críticos",
        "valor": "1",
        "pie": null
      }
    ],
    "sitios": [
      "Planta Centro",
      "Planta Norte",
      "Planta Sur"
    ],
    "columnas": [
      "Embarque",
      "OC / BL",
      "Sitio",
      "Causa",
      "Fin tiempo libre",
      "Días",
      "Costo / día",
      "Costo actual",
      "Proyección",
      "Riesgo",
      "Acciones"
    ],
    "filas": [
      [
        {
          "texto": "EMB-2080",
          "fuerte": true
        },
        {
          "texto": "OC-550040 / BL-789470",
          "fuerte": false
        },
        {
          "texto": "Planta Centro",
          "fuerte": false
        },
        {
          "texto": "Separación de equipo",
          "fuerte": false
        },
        {
          "texto": "26/08/2026 18:00",
          "fuerte": false
        },
        {
          "texto": "1",
          "fuerte": false
        },
        {
          "texto": "$420",
          "fuerte": true
        },
        {
          "texto": "$420",
          "fuerte": false
        },
        {
          "texto": "$840",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Medio"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            "Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2081",
          "fuerte": true
        },
        {
          "texto": "OC-550041 / BL-789471",
          "fuerte": false
        },
        {
          "texto": "Planta Sur",
          "fuerte": false
        },
        {
          "texto": "Equipo requiere desacople",
          "fuerte": false
        },
        {
          "texto": "27/08/2026 18:00",
          "fuerte": false
        },
        {
          "texto": "2",
          "fuerte": false
        },
        {
          "texto": "$710",
          "fuerte": true
        },
        {
          "texto": "$1,420",
          "fuerte": false
        },
        {
          "texto": "$2,130",
          "fuerte": false
        },
        {
          "badge": "high",
          "texto": "Alto"
        },
        {
          "acciones": [
            "Detalle",
            "Escalar",
            "Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2082",
          "fuerte": true
        },
        {
          "texto": "OC-550042 / BL-789472",
          "fuerte": false
        },
        {
          "texto": "Planta Norte",
          "fuerte": false
        },
        {
          "texto": "Maniobra operativa",
          "fuerte": false
        },
        {
          "texto": "28/08/2026 12:00",
          "fuerte": false
        },
        {
          "texto": "1",
          "fuerte": false
        },
        {
          "texto": "$300",
          "fuerte": true
        },
        {
          "texto": "$300",
          "fuerte": false
        },
        {
          "texto": "$600",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Medio"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            "Aprobar"
          ]
        }
      ]
    ]
  },
  "fuel": {
    "rotulo": "Combustible",
    "titulo": "Combustible",
    "sub": "Costos adicionales asociados a la operación de transporte.",
    "metricas": [
      {
        "tono": null,
        "rotulo": "Costo actual",
        "valor": "$2,860",
        "pie": null
      },
      {
        "tono": null,
        "rotulo": "Embarques",
        "valor": "7",
        "pie": null
      },
      {
        "tono": "yellow",
        "rotulo": "Proyección",
        "valor": "$3,480",
        "pie": null
      },
      {
        "tono": null,
        "rotulo": "Mayor sitio",
        "valor": "Planta Sur",
        "pie": null
      },
      {
        "tono": "red",
        "rotulo": "Alertas",
        "valor": "2",
        "pie": null
      }
    ],
    "sitios": [
      "Planta Centro",
      "Planta Norte",
      "Planta Sur"
    ],
    "columnas": [
      "Embarque",
      "OC / BL",
      "Sitio",
      "Causa",
      "Fin tiempo libre",
      "Días",
      "Costo / día",
      "Costo actual",
      "Proyección",
      "Riesgo",
      "Acciones"
    ],
    "filas": [
      [
        {
          "texto": "EMB-2085",
          "fuerte": true
        },
        {
          "texto": "OC-550045 / BL-789475",
          "fuerte": false
        },
        {
          "texto": "Planta Sur",
          "fuerte": false
        },
        {
          "texto": "Desvío operativo",
          "fuerte": false
        },
        {
          "texto": "27/08/2026 12:00",
          "fuerte": false
        },
        {
          "texto": "1",
          "fuerte": false
        },
        {
          "texto": "$320",
          "fuerte": true
        },
        {
          "texto": "$320",
          "fuerte": false
        },
        {
          "texto": "$640",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Medio"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            "Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2086",
          "fuerte": true
        },
        {
          "texto": "OC-550046 / BL-789476",
          "fuerte": false
        },
        {
          "texto": "Planta Centro",
          "fuerte": false
        },
        {
          "texto": "Tiempo adicional de transporte",
          "fuerte": false
        },
        {
          "texto": "28/08/2026 12:00",
          "fuerte": false
        },
        {
          "texto": "1",
          "fuerte": false
        },
        {
          "texto": "$260",
          "fuerte": true
        },
        {
          "texto": "$260",
          "fuerte": false
        },
        {
          "texto": "$520",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Medio"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            "Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2087",
          "fuerte": true
        },
        {
          "texto": "OC-550047 / BL-789477",
          "fuerte": false
        },
        {
          "texto": "Planta Norte",
          "fuerte": false
        },
        {
          "texto": "Ruta adicional",
          "fuerte": false
        },
        {
          "texto": "28/08/2026 16:00",
          "fuerte": false
        },
        {
          "texto": "1",
          "fuerte": false
        },
        {
          "texto": "$410",
          "fuerte": true
        },
        {
          "texto": "$410",
          "fuerte": false
        },
        {
          "texto": "$820",
          "fuerte": false
        },
        {
          "badge": "low",
          "texto": "Bajo"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            "Aprobar"
          ]
        }
      ]
    ]
  },
  "accumulated": {
    "rotulo": "Demora acumulada",
    "titulo": "Demora Acumulada",
    "sub": "Seguimiento desde el fin del tiempo libre hasta el cierre del costo.",
    "metricas": [
      {
        "tono": "red",
        "rotulo": "Costo acumulado",
        "valor": "$6,420",
        "pie": null
      },
      {
        "tono": null,
        "rotulo": "Embarques",
        "valor": "4",
        "pie": null
      },
      {
        "tono": null,
        "rotulo": "Días acumulados",
        "valor": "12",
        "pie": null
      },
      {
        "tono": "yellow",
        "rotulo": "Proyección",
        "valor": "$7,330",
        "pie": null
      },
      {
        "tono": "red",
        "rotulo": "Críticos",
        "valor": "2",
        "pie": null
      }
    ],
    "sitios": [
      "Planta Centro",
      "Planta Norte",
      "Planta Sur"
    ],
    "columnas": [
      "Embarque",
      "OC / BL",
      "Sitio",
      "Causa",
      "Fin tiempo libre",
      "Días",
      "Costo / día",
      "Costo actual",
      "Proyección",
      "Riesgo",
      "Acciones"
    ],
    "filas": [
      [
        {
          "texto": "EMB-2049",
          "fuerte": true
        },
        {
          "texto": "OC-550027 / BL-789460",
          "fuerte": false
        },
        {
          "texto": "Planta Norte",
          "fuerte": false
        },
        {
          "texto": "Fin tiempo libre excedido",
          "fuerte": false
        },
        {
          "texto": "26/08/2026 18:00",
          "fuerte": false
        },
        {
          "texto": "4",
          "fuerte": false
        },
        {
          "texto": "$250",
          "fuerte": true
        },
        {
          "texto": "$1,000",
          "fuerte": false
        },
        {
          "texto": "$1,250",
          "fuerte": false
        },
        {
          "badge": "high",
          "texto": "Alto"
        },
        {
          "acciones": [
            "Detalle",
            "Escalar",
            "Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2050",
          "fuerte": true
        },
        {
          "texto": "OC-550028 / BL-789461",
          "fuerte": false
        },
        {
          "texto": "Planta Sur",
          "fuerte": false
        },
        {
          "texto": "Fin tiempo libre excedido",
          "fuerte": false
        },
        {
          "texto": "25/08/2026 18:00",
          "fuerte": false
        },
        {
          "texto": "5",
          "fuerte": false
        },
        {
          "texto": "$780",
          "fuerte": true
        },
        {
          "texto": "$3,900",
          "fuerte": false
        },
        {
          "texto": "$4,680",
          "fuerte": false
        },
        {
          "badge": "high",
          "texto": "Alto"
        },
        {
          "acciones": [
            "Detalle",
            "Escalar",
            "Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2072",
          "fuerte": true
        },
        {
          "texto": "OC-550031 / BL-789464",
          "fuerte": false
        },
        {
          "texto": "Planta Sur",
          "fuerte": false
        },
        {
          "texto": "Tiempo libre agotado",
          "fuerte": false
        },
        {
          "texto": "23/08/2026 18:00",
          "fuerte": false
        },
        {
          "texto": "2",
          "fuerte": false
        },
        {
          "texto": "$340",
          "fuerte": true
        },
        {
          "texto": "$680",
          "fuerte": false
        },
        {
          "texto": "$1,020",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Medio"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            "Aprobar"
          ]
        }
      ],
      [
        {
          "texto": "EMB-2075",
          "fuerte": true
        },
        {
          "texto": "OC-550034 / BL-789467",
          "fuerte": false
        },
        {
          "texto": "Planta Centro",
          "fuerte": false
        },
        {
          "texto": "Demora fuera de puerto",
          "fuerte": false
        },
        {
          "texto": "24/08/2026 18:00",
          "fuerte": false
        },
        {
          "texto": "1",
          "fuerte": false
        },
        {
          "texto": "$190",
          "fuerte": true
        },
        {
          "texto": "$190",
          "fuerte": false
        },
        {
          "texto": "$380",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Medio"
        },
        {
          "acciones": [
            "Detalle",
            "Validar",
            "Aprobar"
          ]
        }
      ]
    ]
  },
  "alerts": {
    "rotulo": "Alertas y notificaciones",
    "titulo": "Alertas y Notificaciones",
    "sub": "Alertas automáticas por proximidad, generación y crecimiento de costos.",
    "notas": [
      {
        "tipo": "alert",
        "texto": "EMB-2050: costo alto y tendencia creciente. Escalar a Transporte, Aduana, Compras y Planta Sur."
      },
      {
        "tipo": "note",
        "texto": "EMB-2060: 8 horas para vencer tiempo libre. Generar alerta preventiva."
      },
      {
        "tipo": "note",
        "texto": "Post-aduana: controlar chasis desde llegada a planta hasta fin de descarga."
      }
    ]
  },
  "approvals": {
    "rotulo": "Aprobaciones",
    "titulo": "Aprobaciones",
    "sub": "Solicitudes de pago y validación de costos.",
    "columnas": [
      "Solicitud",
      "Embarque",
      "Costo",
      "Monto",
      "Responsable",
      "Estado",
      "Acción"
    ],
    "filas": [
      [
        {
          "texto": "AP-00041",
          "fuerte": false
        },
        {
          "texto": "EMB-2050",
          "fuerte": false
        },
        {
          "texto": "Estadía chasis",
          "fuerte": false
        },
        {
          "texto": "$3,900",
          "fuerte": false
        },
        {
          "texto": "Compras",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Pendiente"
        },
        {
          "acciones": [
            "Revisar"
          ]
        }
      ],
      [
        {
          "texto": "AP-00042",
          "fuerte": false
        },
        {
          "texto": "EMB-2047",
          "fuerte": false
        },
        {
          "texto": "Multa",
          "fuerte": false
        },
        {
          "texto": "$1,250",
          "fuerte": false
        },
        {
          "texto": "Compras",
          "fuerte": false
        },
        {
          "badge": "med",
          "texto": "Pendiente"
        },
        {
          "acciones": [
            "Revisar"
          ]
        }
      ]
    ]
  },
  "reports": {
    "rotulo": "Informes",
    "titulo": "Informes de Costos",
    "sub": "Informes ejecutivos y operativos por sitio, tipo y período.",
    "metricas": [
      {
        "tono": null,
        "rotulo": "Costo total",
        "valor": "USD 285,450",
        "pie": null
      },
      {
        "tono": "red",
        "rotulo": "Demora",
        "valor": "33%",
        "pie": null
      },
      {
        "tono": "purple",
        "rotulo": "Storage",
        "valor": "25%",
        "pie": null
      },
      {
        "tono": "green",
        "rotulo": "Chasis",
        "valor": "16%",
        "pie": null
      },
      {
        "tono": null,
        "rotulo": "Otros",
        "valor": "26%",
        "pie": null
      }
    ]
  }
}

/** Los pares etiqueta → valor de una fila, para armar el detalle del embarque. */
export function camposDeFila(vista, fila) {
  return vista.columnas
    .map((col, i) => [col, fila[i]])
    .filter(([col, celda]) => celda && !celda.acciones && !/^Acci/i.test(col))
    .map(([col, celda]) => [col, celda.texto ?? ''])
}
