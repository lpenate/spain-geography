# Test de ríos y lagos de España — Definición funcional y plan de desarrollo

Estado: noviembre de 2026. **Reorientación del enfoque**: el mapa deja de ser «relieve + capa de puntos proyectados» y pasa a ser **un único SVG enriquecido** donde cada río y lago es un elemento del propio SVG con sus metadatos.

> **Estado (22-11-2026): fases 1 a 5 implementadas.**
> - Geometría de los 45 ríos y 5 lagos desde OpenStreetMap (`data-sources/osm/`), proyectada con una calibración ajustada sobre los ríos ya trazados (error medio ≈ 0,5 unidades). Ver [`verificacion-45-rios.png`](verificacion-45-rios.png).
> - `scripts/build-rivers-svg.mjs` lee `data-sources/spain-rios.source.svg` + `data-sources/rios.meta.json`, valida (50 elementos, 8/26/16) y emite `public/maps/spain-rios.svg` (sin nombres) y `public/data/spain-rios.json`.
> - Cada río tiene un `path[data-river][data-course]` con el cauce principal de nacimiento a desembocadura (más un path de brazos secundarios si los hay). El quiz resalta el río entero, encuadra su `bbox` y ofrece un slider «Recorre el cauce» que mueve el punto por el río manteniéndolo centrado.
> - Se quitaron del mapa los límites autonómicos y se retiró el pipeline de puntos proyectados (`generate-rivers.mjs`, `iberian-rivers.geojson`).
> - Pendiente: página de depuración `RiverMapDebug.vue` (la imagen de control la sustituye por ahora).

El SVG fuente está ahora en `data-sources/spain-rios.source.svg`; [`iberian-rivers.meta.json`](iberian-rivers.meta.json) queda como histórico, sustituido por `data-sources/rios.meta.json`.

La foto del libro de texto de partida está en [`rios-mapa-libro.jpg`](rios-mapa-libro.jpg) (unidad U2, «Los lagos y las lagunas» / «Ríos de España»). Se usa **solo como referencia de contenido y para validación visual**, no como fuente de geometría.

---

## 1. Diagnóstico del enfoque anterior

| Problema | Causa |
| --- | --- |
| El marcador no cae sobre el río | Se proyectaba `[lon, lat]` a porcentaje sobre un SVG de relieve cuya proyección real no está garantizada (equirrectangular «estandarizada» asumida, no verificada). Cualquier desviación se ve como error. |
| Dos fuentes de verdad | La geometría (mapa físico) y los datos (GeoJSON de puntos) viven en archivos distintos y se unen mediante una transformación matemática. |
| Ambigüedad visual | Un punto no dice qué río es: en confluencias (Sil/Miño, Jarama/Henares/Tajo, Segre/Cinca/Ebro) el alumno no sabe a cuál se refiere la pregunta. |
| Difícil de corregir | Ajustar un punto implica editar coordenadas geográficas, regenerar y volver a mirar el resultado. |

**Conclusión**: mientras geometría y datos estén separados por una proyección, habrá desajustes. La solución es eliminar la proyección del flujo: la geometría y los datos viven juntos, en el mismo sistema de coordenadas del SVG.

---

## 2. Principios del nuevo enfoque

1. **Una sola fuente de verdad geométrica**: el SVG enriquecido. No hay `[lon, lat]` ni proyección en tiempo de ejecución.
2. **Cada río es un `<path>` completo** (de nacimiento a desembocadura), con `id` estable y atributos `data-*`. Cada lago/laguna es un `<path>` o `<ellipse>` equivalente.
3. **El marcador se calcula sobre el propio trazado** (`getPointAtLength`), de modo que *no puede* quedar fuera del río.
4. **Se resalta el elemento, no un punto**: la pregunta ilumina todo el recorrido del río, lo que elimina la ambigüedad en confluencias.
5. **Los metadatos pedagógicos (nombre, alias, vertiente, tipo) están en el SVG** o se generan a partir de él en build. Nunca se editan a mano en dos sitios.
6. **Validación automática**: el build falla si falta geometría de algún elemento, si hay ids duplicados o si el ancla no está sobre el trazado.

---

## 3. Definición funcional

### 3.1 Flujo de una ronda
1. El usuario inicia el test «Ríos y lagos de España». Se seleccionan **8 elementos** al azar (`pickRiverRound`), garantizando al menos 1 lago/laguna y variedad de vertientes.
2. Para cada pregunta se muestra el mapa físico de España con **un elemento resaltado**, y el panel lateral con:
   - Campo de texto «¿Cómo se llama?».
   - Tres radio buttons obligatorios: **Cantábrica**, **Atlántica**, **Mediterránea**.
   - Botón «Comprobar».
3. Tras comprobar, se muestra el resultado (puntos, nombre correcto, vertiente correcta) y el botón «Siguiente».
4. Al terminar las 8 preguntas, resumen final: puntuación acumulada sobre 8 y porcentaje de acierto, con listado de fallos para repasar.

### 3.2 Representación en el mapa
- **Mapa base**: relieve físico mudo (sin topónimos) y, dentro del mismo SVG, la red hidrográfica completa en azul tenue como contexto (los ríos no preguntados no llevan nombre).
- **Elemento preguntado**:
  - Su trazado se resalta (trazo más grueso, color de acento, animación de pulso suave). Para lagos, se rellena y se perfila.
  - Un **marcador** (anillo + núcleo) se sitúa en el **punto ancla** del elemento, calculado sobre su trazado.
  - Una **flecha discontinua** conecta el formulario con el marcador (se recalcula con zoom, resize y scroll).
- **Zoom automático** al elemento: el encuadre se calcula a partir del `bbox` del elemento con un margen (mínimo de zoom para ríos largos como Tajo o Duero, para que se vea entero). Controles manuales: `+`, `−`, `Todo`.
- **Tras comprobar**, el trazado, el marcador y la flecha cambian de color: verde (1,0), ámbar (0,5), rojo (0).

### 3.3 Puntuación (sin cambios)
| Resultado | Puntos |
| --- | --- |
| Nombre correcto + vertiente correcta | 1,0 |
| Nombre correcto + vertiente incorrecta | 0,5 |
| Nombre incorrecto (aunque la vertiente sea correcta) | 0 |

El nombre se valida contra el nombre oficial y sus alias con `isApproximateMatch` (insensible a mayúsculas, tildes y signos; tolerancia a erratas leves; prefijos «río», «lago», «laguna», «el», «la»).

### 3.4 Requisitos no funcionales
- **Accesibilidad**: `fieldset` con `legend` para la vertiente; el elemento resaltado tiene `aria-label` genérico («Elemento marcado en el mapa»), **sin revelar el nombre**; el cambio de color no es el único indicador (también texto).
- **Rendimiento**: SVG < 2 MB tras `svgo`; el relieve puede ir como `<image>` embebida si se genera desde raster, pero los ríos siempre son vectores.
- **Responsive**: el SVG usa `viewBox` y escala; la flecha se basa en `getBoundingClientRect` / `getScreenCTM`, no en píxeles fijos.
- **Sin spoilers en el DOM**: el nombre del río preguntado no debe aparecer en atributos visibles de la pregunta activa (ver riesgo R4).

### 3.5 Fuera de alcance (por ahora)
- Modo «pulsa sobre el río» (clic en el mapa). La estructura de paths lo permite en el futuro (con un `stroke` invisible ancho para facilitar el clic).
- Topónimos de ciudades, montañas o islas.
- Islas Canarias y Baleares: no tienen ríos en el test; se incluyen solo como contexto si el mapa base las trae.

---

## 4. Modelo del SVG enriquecido

### 4.1 Estructura

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1183.412 1015.165"
     data-schema="rios-v1">
  <!-- 1. Relieve mudo -->
  <g id="relief"> … </g>

  <!-- 2. Hidrografía: un elemento por río, de nacimiento a desembocadura -->
  <g id="hydrography">
    <path id="rio-tajo" class="hydro hydro--rio"
          d="M …"
          data-name="Tajo"
          data-aliases="Tejo|Río Tajo"
          data-vertiente="atlantica"
          data-type="rio"
          data-anchor="0.45" />
    <!-- … -->
  </g>

  <!-- 3. Lagos, lagunas y humedales -->
  <g id="water-bodies">
    <path id="lago-sanabria" class="hydro hydro--lago"
          d="M … Z"
          data-name="Lago de Sanabria"
          data-aliases="Sanabria|Lago Sanabria"
          data-vertiente="atlantica"
          data-type="lago" />
    <!-- … -->
  </g>
</svg>
```

### 4.2 Atributos obligatorios por elemento
| Atributo | Descripción |
| --- | --- |
| `id` | `rio-<slug>` o `lago-<slug>`, único y estable (clave del dataset). |
| `data-name` | Nombre oficial. |
| `data-aliases` | Alias separados por `|` (puede ir vacío). |
| `data-vertiente` | `cantabrica` \| `atlantica` \| `mediterranea`. |
| `data-type` | `rio` \| `lago`. |
| `data-anchor` | Solo ríos: fracción `0–1` de la longitud del trazado donde se coloca el marcador (por defecto `0.5`; se ajusta cuando el tramo medio es poco visible o está tapado por una confluencia). |

Los lagos usan como ancla el centroide de su `bbox`.

### 4.3 Reglas de dibujo
- Un río = un `<path>` continuo desde el nacimiento hasta la desembocadura (o hasta la confluencia, en afluentes). En afluentes, el último vértice **coincide** con un vértice del río principal.
- Los ríos con tramo compartido en el libro (p. ej. Guadiana Menor → Guadalquivir) se dibujan como paths independientes.
- Lagos: polígono simplificado. Para Lagos de Covadonga (Enol y Ercina), un único elemento con dos subpaths.
- El trazo base es un `stroke` azul; el estado resaltado se aplica por CSS (`.is-target`, `.is-correct`, `.is-partial`, `.is-wrong`), sin tocar la geometría.

---

## 5. Inventario del dataset (50 elementos)

**El dataset debe contener exactamente los ríos y lagos rotulados en el mapa del libro** (foto `rios-mapa-libro.jpg`, unidad U2): **45 ríos + 5 lagos/lagunas = 50 elementos**. Esta lista sustituye a la anterior (58), que incluía elementos que no aparecen en el libro y omitía otros. Se ha obtenido leyendo los rótulos de la foto ampliada (resolución limitada), así que está **pendiente de tu confirmación** (ver tabla de diferencias).

### Vertiente cantábrica (8)
- **Ríos (7)**: Eo, Navia, Narcea, Nalón, Saja, Nervión, Bidasoa.
- **Lagos (1)**: Lagos de Covadonga.

### Vertiente atlántica (26)
- **Galicia (3 ríos)**: Tambre, Miño, Sil.
- **Cuenca del Duero (5 ríos + 2 lagos)**: Duero, Esla, Pisuerga, Adaja, Tormes; Lago de Sanabria, Laguna Negra.
- **Cuenca del Tajo (6 ríos)**: Tajo, Alagón, Tiétar, Alberche, Jarama, Henares.
- **Cuenca del Guadiana (5 ríos + 1 laguna)**: Guadiana, Zújar, Jabalón, Cigüela, Záncara; Lagunas de Ruidera.
- **Cuenca del Guadalquivir (2 ríos)**: Guadalquivir, Genil.
- **Suroeste (2 ríos)**: Odiel, Tinto.

### Vertiente mediterránea (16)
- **Sur / Levante (7 ríos)**: Almanzora, Guadalhorce, Guadalfeo, Segura, Júcar, Cabriel, Turia.
- **Cuenca del Ebro (6 ríos + 1 laguna)**: Ebro, Jalón, Aragón, Gállego, Cinca, Segre; Laguna de Gallocanta.
- **Cataluña (2 ríos)**: Llobregat, Ter.

Total: 8 + 26 + 16 = **50** (45 ríos y 5 lagos/lagunas).

### Diferencias respecto al inventario anterior

| Cambio | Elementos | Motivo |
| --- | --- | --- |
| **Se quitan** (no rotulados en el libro) | Ulla, Limia, Sella, Deva, Guadalimar, Guadiana Menor, Guadalete, Mijares, Fluvià, Albufera de Valencia | No aparecen en el mapa de la foto. «Guadalete» probablemente fue una lectura errónea de «Guadalfeo». |
| **Se añaden** (rotulados en el libro) | Saja, Laguna Negra | El libro rotula «Saja» en la zona cantábrica (no «Sella») y «Laguna Negra» junto al nacimiento del Duero en el Sistema Ibérico. |
| **Se mantienen** | resto | Rotulados en el libro. |

**A confirmar contigo**: (1) que ninguno de los elementos quitados esté en otra página o apartado del libro que quieras incluir; (2) la vertiente de la Laguna Negra (se asigna a la atlántica por estar en la cabecera del Duero); (3) «Bidasoa» y «Llobregat», cuyos rótulos están borrosos en la foto. Los rótulos «Ría de Navia» y «Ría de Bilbao» del libro son estuarios y se tratan como alias de Navia y Nervión.

### Alias y variantes aceptadas

| Elemento | Alias admitidos |
| --- | --- |
| Miño | Minho, Río Miño |
| Duero | Douro, Río Duero |
| Tajo | Tejo, Río Tajo |
| Júcar | Xúquer, Xuquer, Río Júcar |
| Nervión | Nerbioi, Ría de Bilbao, Ría del Nervión |
| Navia | Ría de Navia |
| Eo | Ría del Eo, Ría de Eo |
| Cigüela | Gigüela, Ciguela, Giguela |
| Tiétar | Tietar |
| Turia | Guadalaviar |
| Tinto | Río Tinto |
| Saja | Río Saja |
| Laguna Negra | Laguna Negra de Urbión, Laguna Negra de Soria |
| Lago de Sanabria | Sanabria, Lago Sanabria |
| Lagos de Covadonga | Covadonga, Lagos Covadonga, Enol, Ercina, Lago Enol, Lago Ercina |
| Laguna de Gallocanta | Gallocanta, Laguna Gallocanta |
| Lagunas de Ruidera | Ruidera, Lagunas Ruidera |

---

## 6. Arquitectura de archivos y componentes (objetivo)

| Archivo | Acción | Función |
| --- | --- | --- |
| `data-sources/spain-rios.source.svg` | **Nuevo** | SVG fuente editable (Inkscape): relieve + ríos + lagos con ids y `data-*`. Es la única fuente de geometría. |
| `data-sources/iberian-rivers.meta.json` | **Reemplaza** al GeoJSON de puntos | Metadatos pedagógicos por `id` (nombre, alias, vertiente, tipo, `anchor`). Se valida contra el SVG. |
| `scripts/build-rivers-svg.mjs` | **Reemplaza** a `generate-rivers.mjs` | Fusiona metadatos en el SVG fuente, valida, optimiza (`svgo`) y emite `public/maps/spain-rios.svg` y `public/data/spain-rios.json`. **Sin proyección lon/lat.** |
| `public/maps/spain-rios.svg` | Generado | SVG enriquecido servido en la app. |
| `public/data/spain-rios.json` | Generado | Índice derivado: por `id`, nombre, alias, vertiente, tipo, `bbox` y punto ancla `{x, y}` en coordenadas del `viewBox`. Solo para búsquedas y tests; no es fuente de geometría. |
| `public/maps/spain-physical.svg` | Se conserva como insumo | Punto de partida del relieve (ver Fase 0). |
| `src/types/river.ts` | Actualizar | `RiverItem` pasa a llevar `bbox` y `anchor` en coordenadas SVG (no `%` ni lon/lat). |
| `src/services/riverData.ts` | Actualizar | Carga el JSON y el SVG. |
| `src/utils/riverSession.ts` | Sin cambios de lógica | `pickRiverRound`, `isRiverAnswerCorrect`. |
| `src/utils/riverSession.spec.ts` | Ampliar | Añadir tests de integridad SVG ↔ dataset (ver Fase 4). |
| `src/components/quiz/RiverQuiz.vue` | Refactorizar | Inyecta el SVG **inline** (no `<img>`), resalta por clase el `<path>` del elemento, coloca marcador con `getPointAtLength`, calcula zoom con `bbox`. |
| `src/views/dev/RiverMapDebug.vue` | **Nuevo** (solo dev) | Página de depuración: muestra los 50 elementos con su etiqueta sobre el mapa para validación visual. |
| `src/views/quizzes/QuizPlayView.vue`, `src/types/quiz.ts`, `src/utils/quizNav.ts` | Sin cambios | Registro del modo `rios`. |

---

## 7. Plan de desarrollo

### Fase 0 — Auditoría del mapa físico actual (decisión de ruta)
**Objetivo**: saber qué contiene realmente `spain-physical.svg`.
- Abrir el SVG y comprobar si la hidrografía azul son **paths vectoriales separables** (cada río identificable) o si está fundida con el relieve (un solo path/raster).
- Anotar proyección, `viewBox` y calidad de los trazos.

**Decisión**:
- **Ruta A** — los ríos son paths separables → se etiquetan *in situ* (ids + `data-*`) y se agrupan en `#hydrography`. Es la ruta más rápida y la que mejor coincide visualmente.
- **Ruta B** — ríos fundidos o inservibles → se **redibujan sobre el relieve en el mismo SVG** (Inkscape, trazando sobre el propio relieve y con la foto del libro como guía a baja opacidad), y se eliminan del fondo los ríos sin identificar para que no haya doble línea.
- **Ruta C** (alternativa si el relieve no es salvable) — regenerar el SVG completo desde datos abiertos (Natural Earth / red hidrográfica oficial del IGN o MITECO) con **una sola proyección** (`d3-geo`) aplicada a ríos, lagos y a una imagen de relieve embebida con el mismo `viewBox`. Mayor coste, pero coherencia garantizada.

**Entregable**: nota de decisión (ruta elegida y justificación) en este documento.

#### Resultado de la Fase 0 (auditoría realizada en noviembre de 2026)

**Qué contienen las fuentes**
- `spain-rios.svg` es solo un envoltorio de 247 bytes: un `<image>` que apunta a `spain-physical.svg`. No contiene ríos.
- `spain-physical.svg` (815 KB) es un **JPEG de relieve embebido + capa vectorial**: 35 trazados azules (`#0978AB`, ríos y embalses con relleno `#C6ECFF`), un trazado grande de costa y un conjunto de fronteras en gris (`#646464`). Es la salida de NordNordWest, con `viewBox 0 0 1183.412 1015.165`.
- `spain-physical.jpg` (1197 × 1029) es el mismo relieve que está embebido en el SVG.
- Los trazados azules están hechos con **curvas de Bézier cúbicas** (cientos de puntos por río) y, superpuestos al relieve, **siguen los valles**. Es decir, la geometría buena ya existe y coincide con el relieve; lo que fallaba era el enfoque de puntos proyectados.

**Decisión: Ruta A para lo que existe + Ruta B (ampliada) para lo que falta.**

*Cobertura actual (identificación provisional, a confirmar en la Fase 1):*

| Trazado en el SVG | Río |
| --- | --- |
| 32 | Miño |
| 25 | Sil |
| 8 | Esla |
| 0 | Pisuerga |
| 31 | Duero |
| 30 | Tormes |
| 3, 34, 29 | Tajo (en tres tramos; 2 y 1 son embalses) |
| 28 | Guadiana |
| 4 | Guadalquivir |
| 6 | Genil |
| 7 | Segura |
| 5 | Júcar |
| 13 | Turia |
| 33 (+10, 9) | Ebro (con cabecera y embalse) |
| 15 | Jalón |
| 16 | Aragón |
| 14 | Segre |

Son **17 de los 45 ríos** del libro (los 17 están entre los rotulados en el libro). El resto de trazados azules son ríos de Portugal, Francia y Marruecos (11, 12, 17–24, 26), un embalse (27), la costa (35) y el recuadro de Canarias (71): se descartan o se dejan como contexto atenuado.

*Faltan 28 ríos por trazar:* los 7 cantábricos (Eo, Navia, Narcea, Nalón, Saja, Nervión, Bidasoa); Tambre; Adaja, Alagón, Tiétar, Alberche, Jarama y Henares; Zújar, Jabalón, Cigüela y Záncara; Odiel y Tinto; Cabriel; Almanzora, Guadalhorce y Guadalfeo; Gállego y Cinca; Llobregat y Ter. Además hay que crear los **5 lagos/lagunas** (Covadonga, Sanabria, Laguna Negra, Ruidera, Gallocanta), que no están en el SVG.

**Requisito de calidad: nada de líneas rectas.** Los ríos nuevos no pueden ser segmentos poligonales. Reglas:
1. Trazarlos **siguiendo el valle visible en el relieve**, con puntos densos (un punto cada 5–10 unidades del `viewBox` como orden de magnitud) y suavizado Catmull-Rom → Bézier cúbica, igual que los trazados existentes.
2. Mismo estilo que los existentes (`stroke #0978AB`, ancho ~1,13, `round` en cap y join), de modo que no se distinga el río original del añadido.
3. Los afluentes terminan exactamente sobre un vértice del río principal.
4. Validación visual obligatoria en la Fase 5 (superposición con el relieve y con la foto del libro).
5. Si se dispone de datos abiertos de la red hidrográfica (Natural Earth, IGN, MITECO), es preferible usarlos como guía de trazado, **alineados con el relieve**, antes que dibujar a ojo.

### Fase 1 — Construcción del SVG fuente
- Crear `data-sources/spain-rios.source.svg` con los grupos `#relief`, `#hydrography`, `#water-bodies`.
- Un `<path>` por cada uno de los 50 elementos, con `id` según la convención `rio-*` / `lago-*`.
- Trabajar por vertientes (cantábrica → mediterránea → atlántica), validando cada bloque contra la foto del libro.
- Ajustar `data-anchor` en ríos con trazado complejo.

**Estado**: 17 de 50 elementos ya etiquetados (ver «Entregables ya generados»); faltan 28 ríos y 5 lagos.

**Criterio de aceptación**: los 50 elementos existen como paths con id único; un overlay de la foto del libro al 50 % muestra los ríos en su sitio.

### Entregables ya generados (Fase 1, parte 1)

Los ficheros están enlazados como si estuvieran en la misma carpeta que este documento; el desarrollador los moverá a su ubicación definitiva (`data-sources/`, `public/maps/`…) y les dará uso.

| Fichero | Qué es | Destino previsto |
| --- | --- | --- |
| [`spain-rios.source.svg`](spain-rios.source.svg) | **SVG enriquecido**: relieve + costa + fronteras + hidrografía, con los 17 ríos ya existentes etiquetados con `id` y `data-*`. Geometría idéntica a la original. | `data-sources/spain-rios.source.svg` (fuente editable) |
| [`iberian-rivers.meta.json`](iberian-rivers.meta.json) | Metadatos de los 17 ríos (nombre, alias, vertiente, ancla, `bbox`, elementos SVG) y lista de elementos **pendientes de trazar**. | `data-sources/iberian-rivers.meta.json` |
| [`verificacion-17-rios.png`](verificacion-17-rios.png) | Imagen de control: los 17 ríos con su nombre y su ancla sobre el relieve. | Solo referencia (QA) |
| [`spain-physical.svg`](spain-physical.svg) y [`spain-physical.jpg`](spain-physical.jpg) | Fuentes de partida (relieve y trazados originales). | Insumo; el SVG enriquecido las sustituye |
| [`rios-mapa-libro.jpg`](rios-mapa-libro.jpg) | Foto del libro, referencia de contenido. | Referencia |

**Estructura del SVG enriquecido** (`viewBox 0 0 1183.412 1015.165`, igual que el original):
- `<image>` con el relieve embebido en base64.
- `<g id="hydrography">`: los trazados azules originales **en su mismo orden**, con estas marcas:
  - Ríos del libro: `class="hydro hydro--rio"`, `id`, `data-river`, `data-name`, `data-aliases` (separados por `|`), `data-vertiente`, `data-type="rio"` y `data-anchor`.
  - Resto (embalses y ríos de Francia, Portugal y Marruecos): `class="hydro hydro--context"` con `data-role="embalse"` o `data-role="foreign"`. Se atenúan u ocultan por CSS.
- Costa y fronteras originales, sin tocar.

**Ríos con geometría existente (17 de 45):**

| `id` | Río | Vertiente | Elementos SVG | `data-anchor` | Ancla (x, y) |
| --- | --- | --- | --- | --- | --- |
| `rio-mino` | Miño | atlantica | `rio-mino` | 0.8 | (182, 138) |
| `rio-sil` | Sil | atlantica | `rio-sil` | 0.5 | (248, 202) |
| `rio-duero` | Duero | atlantica | `rio-duero` | 0.8 | (552, 301) |
| `rio-esla` | Esla | atlantica | `rio-esla` | 0.5 | (350, 215) |
| `rio-pisuerga` | Pisuerga | atlantica | `rio-pisuerga` | 0.5 | (457, 221) |
| `rio-tormes` | Tormes | atlantica | `rio-tormes` | 0.5 | (355, 367) |
| `rio-tajo` | Tajo | atlantica | `rio-tajo-1`, `rio-tajo-2`, `rio-tajo-3` | 0.5 | (415, 462) |
| `rio-guadiana` | Guadiana | atlantica | `rio-guadiana` | 0.5 | (367, 556) |
| `rio-guadalquivir` | Guadalquivir | atlantica | `rio-guadalquivir` | 0.5 | (431, 673) |
| `rio-genil` | Genil | atlantica | `rio-genil` | 0.5 | (442, 744) |
| `rio-segura` | Segura | mediterranea | `rio-segura` | 0.5 | (658, 642) |
| `rio-jucar` | Júcar | mediterranea | `rio-jucar` | 0.5 | (634, 542) |
| `rio-turia` | Turia | mediterranea | `rio-turia` | 0.5 | (696, 465) |
| `rio-ebro` | Ebro | mediterranea | `rio-ebro-1`, `rio-ebro-2` | 0.75 | (580, 195) |
| `rio-jalon` | Jalón | mediterranea | `rio-jalon` | 0.5 | (662, 320) |
| `rio-aragon` | Aragón | mediterranea | `rio-aragon` | 0.5 | (701, 186) |
| `rio-segre` | Segre | mediterranea | `rio-segre` | 0.5 | (892, 256) |

Notas:
- Los ríos en varios tramos (Tajo, Ebro) comparten `data-river`; el runtime los selecciona juntos con `[data-river="rio-tajo"]`. `data-anchor` es la fracción de longitud **sobre el conjunto de tramos**, en el orden en que aparecen en la tabla.
- Las anclas están colocadas lejos de las confluencias para que el marcador no induzca a confusión (Duero, Ebro y Miño se desplazaron a su tramo alto). Se pueden retocar cambiando solo `data-anchor`.
- La identificación de cada trazado se hizo por posición y aspecto; **debe validarse con la imagen de control**. Las más dudosas: Genil, Tormes y el tramo alto del Guadiana.

**Uso desde el componente** (resumen):

```ts
const pieces = svg.querySelectorAll(`[data-river="${id}"]`)   // uno o varios tramos
pieces.forEach(p => p.classList.add('is-target'))              // resalta el recorrido completo
// el ancla se calcula sobre el trazado: getPointAtLength(total * anchor)
```

**Pendiente de trazar (28 ríos + 5 lagos):** están listados en `pendientes` de [`iberian-rivers.meta.json`](iberian-rivers.meta.json).
- Cantábrica: Eo, Navia, Narcea, Nalón, Saja, Nervión, Bidasoa; Lagos de Covadonga.
- Atlántica: Tambre, Adaja, Alagón, Tiétar, Alberche, Jarama, Henares, Zújar, Jabalón, Cigüela, Záncara, Odiel, Tinto; Lago de Sanabria, Laguna Negra, Lagunas de Ruidera.
- Mediterránea: Cabriel, Almanzora, Guadalhorce, Guadalfeo, Gállego, Cinca, Llobregat, Ter; Laguna de Gallocanta.

Convención de ids para los nuevos: `rio-<slug>` y `lago-<slug>` (por ejemplo `rio-eo`, `lago-sanabria`), con los mismos atributos `data-*` y añadidos dentro de `<g id="hydrography">` con el mismo estilo de trazo que los existentes (curvas suaves, sin segmentos rectos).

### Fase 2 — Pipeline de build
- Implementar `scripts/build-rivers-svg.mjs`:
  1. Lee el SVG fuente y `iberian-rivers.meta.json`.
  2. Valida: todo id del meta existe en el SVG y viceversa; vertiente y tipo válidos; ids únicos.
  3. Inyecta `data-*` desde el meta en cada path (para que no se editen a mano en dos sitios).
  4. Calcula `bbox` y punto ancla (por longitud de trazado) por elemento.
  5. Optimiza con `svgo` conservando ids y `data-*`.
  6. Emite `public/maps/spain-rios.svg` y `public/data/spain-rios.json`.
- Retirar `scripts/generate-rivers.mjs` y `data-sources/iberian-rivers.geojson`.

**Criterio de aceptación**: `node scripts/build-rivers-svg.mjs` termina sin errores y falla con mensaje claro si se rompe cualquiera de las reglas de validación.

### Fase 3 — Componente `RiverQuiz.vue`
- Inyectar el SVG inline y localizar el elemento por `id`.
- Resaltar el path con clases (`is-target`, `is-correct`, `is-partial`, `is-wrong`).
- Marcador sobre el ancla; flecha desde el formulario al ancla (usando `getScreenCTM`).
- Zoom automático por `bbox` del elemento con margen; controles `+`, `−`, `Todo`.
- Mantener radio buttons, validación con alias y puntuación 1 / 0,5 / 0.

**Criterio de aceptación**: en las 50 preguntas posibles, el marcador queda sobre el elemento resaltado y la flecha apunta al marcador tras zoom, resize y scroll.

### Fase 4 — Tests automáticos
- **Integridad SVG ↔ dataset** (vitest): 50 elementos (45 ríos + 5 lagos); ids únicos; todo elemento del meta tiene path; vertiente y tipo válidos; recuentos por vertiente = 8 / 26 / 16; y que el conjunto de ids coincide exactamente con la lista del libro.
- **Ancla sobre el trazado**: el punto ancla pertenece al path (por muestreo, tolerancia < 0,5 unidades del `viewBox`).
- **Bbox**: dentro del `viewBox`.
- Mantener los tests existentes de alias, parejas parecidas y puntuación.
- Test de componente: al cambiar de pregunta se aplica `is-target` a un único elemento.

### Fase 5 — Validación visual contra el libro
- Página `RiverMapDebug.vue` (solo en desarrollo) que dibuja los 50 elementos con su rótulo.
- Checklist: para cada uno, comprobar contra la foto del libro (a) que es el río correcto, (b) que nace/desemboca donde indica el libro, (c) que la vertiente es la correcta, (d) que el marcador cae sobre el trazado.
- Confirmar que no sobra ni falta ningún río respecto a los rotulados en el mapa del libro (50 elementos).

**Criterio de aceptación**: checklist completa sin discrepancias abiertas.

### Fase 6 — Limpieza y cierre
- Eliminar código y estilos de la capa de puntos proyectados (`.target-ring` basado en `%`, conversión lon/lat).
- Actualizar este documento con el estado final.
- `npm run validate` y `npm run build` en verde.

---

## 8. Riesgos y decisiones abiertas

| # | Riesgo / decisión | Mitigación |
| --- | --- | --- |
| R1 | El relieve actual no trae ríos separables (Ruta B/C). | Fase 0 decide pronto; no se invierte en etiquetar antes de auditar. |
| R2 | Ríos cortos o muy tapados por el relieve se ven poco al resaltarlos. | Trazo resaltado con contorno claro y zoom mínimo; `data-anchor` ajustable. |
| R3 | Doble línea azul (río del relieve + río trazado) si se redibuja (Ruta B). | Eliminar del fondo los ríos sustituidos; revisión en Fase 5. |
| R4 | Spoilers: el nombre del río está en `data-name` del DOM. | Aceptable en una app de estudio escolar; si se quisiera evitar, el componente puede quitar `data-name` del DOM inyectado y leerlo del JSON. **Decisión pendiente.** |
| R5 | Afluentes que comparten tramo visual con el principal. | Path independiente por río; el resaltado del afluente se dibuja por encima (orden en `#hydrography`: principales primero, afluentes después). |
| R6 | Licencia del relieve / datos de origen. | Anotar procedencia y licencia en `data-sources/README.md` en la Fase 0. |

---

## 9. Verificación y comandos

- **Construir mapa y dataset**: `node scripts/build-rivers-svg.mjs`
- **Tests unitarios**: `npm run test:unit`
- **Validación completa**: `npm run validate` (incluye `type-check`, `lint`, `format:check` y `test:unit`)
- **Compilación de producción**: `npm run build`
- **Revisión visual**: abrir `RiverMapDebug` en modo desarrollo y recorrer la checklist de la Fase 5.
