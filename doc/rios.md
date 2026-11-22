# Test de ríos y lagos de España

Estado actualizado a noviembre de 2026. La funcionalidad está implementada y verificada en el proyecto. Este documento recoge los requisitos acordados, las decisiones de diseño gráfico e interacción, el inventario completo y la arquitectura técnica.

La foto original del libro de texto escolar de partida se encuentra en [`rios-mapa-libro.jpg`](rios-mapa-libro.jpg) (unidad U2 del libro, «Los lagos y las lagunas» / «Ríos de España»).

---

## Decisiones clave de diseño

### 1. Mapa físico de fondo sin nombres («no dibujar ríos»)
- **Capa base de relieve**: En lugar de dibujar formas planas o vectores estilizados de ríos que no coincidían con el terreno, se utiliza el mapa físico de relieve mudo de la Península Ibérica ([`public/maps/spain-physical.svg`](../public/maps/spain-physical.svg), con dimensiones `1183.412 × 1015.165` y proyección equirrectangular estandarizada).
- **Sin trazados artificiales**: El mapa físico ya contiene dibujada la hidrografía natural en azul. No se sobreimprimen líneas vectoriales de ríos para evitar desajustes visuales y mantener la estética cartográfica limpia.
- **Puntos objetivos**: Cada río y lago se define por un punto exacto `[lon, lat]` situado en su curso, proyectado a porcentaje `{ x, y }` sobre el mapa.

### 2. Marcador objetivo y flecha desde el formulario
- **Punto objetivo**: Sobre el río o lago preguntado se sitúa un marcador visual pulsante con anillo y núcleo (`.target-ring`, `.target-core`).
- **Flecha dinámica**: Un overlay SVG (`.river-quiz__connectors-layer`) dibuja una flecha discontinua desde el formulario del panel lateral apuntando directamente al punto en el mapa. La flecha se recalcula automáticamente con zoom, resize y scroll.
- **Zoom automático**: Al cambiar de pregunta, el mapa se acerca y centra automáticamente en el punto (`MAP_FOCUS_ZOOM: 3`), con controles manuales para acercar (`+`), alejar (`−`) o ver completo (`Todo`).

### 3. Entrada de nombre y radio buttons de vertiente
- **Nombre**: Input de texto (`#river-answer`) que valida contra el nombre oficial y sus alias mediante `isApproximateMatch` (insensible a mayúsculas, tildes, signos y con tolerancia a erratas leves).
- **Vertiente (radio buttons obligatorios)**: Tres opciones mediante botones de opción nativos (`<input type="radio" name="vertiente">` en un `<fieldset>` accesible):
  - **Cantábrica**
  - **Atlántica**
  - **Mediterránea**

### 4. Sistema de puntuación y feedback
- **100% de puntos (1,0 pto)**: Si se acierta tanto el nombre del río/lago como su vertiente correspondiente.
- **50% de puntos (0,5 ptos)**: Si se acierta el nombre del río/lago pero se falla la vertiente.
- **0% de puntos (0 ptos)**: Si se falla el nombre del río/lago (aunque se haya seleccionado la vertiente correcta).
- **Feedback visual**: Al pulsar «Comprobar»:
  - El marcador y la flecha cambian de color (verde para acierto completo, ámbar para 50%, rojo para 0%).
  - Se muestra la tarjeta de texto con el desglose exacto (puntos obtenidos, nombre revelado y vertiente correcta).
  - Al terminar la ronda de 8 preguntas, se presenta el resumen final con la puntuación acumulada y el porcentaje de acierto.

---

## Inventario final del dataset (58 elementos)

El dataset incluye los 53 ríos del mapa escolar y los 5 lagos y lagunas más importantes:

### Vertiente cantábrica (9 elementos)
- **Ríos**: Eo, Navia, Narcea, Nalón, Sella, Deva, Nervión, Bidasoa.
- **Lagos**: Lagos de Covadonga (Enol y Ercina).

### Vertiente atlántica (28 elementos)
- **Galicia**: Tambre, Ulla, Miño, Sil, Limia.
- **Cuenca del Duero**: Duero, Esla, Pisuerga, Adaja, Tormes.
- **Lago de la cuenca del Duero**: Lago de Sanabria.
- **Cuenca del Tajo**: Tajo, Alagón, Tiétar, Alberche, Jarama, Henares.
- **Cuenca del Guadiana**: Guadiana, Zújar, Jabalón, Cigüela, Záncara.
- **Lagunas del Guadiana**: Lagunas de Ruidera.
- **Cuenca del Guadalquivir**: Guadalquivir, Guadalimar, Genil, Guadiana Menor.
- **Suroeste**: Odiel, Tinto, Guadalete.

### Vertiente mediterránea (21 elementos)
- **Sur / Levante**: Almanzora, Guadalhorce, Guadalfeo, Segura, Júcar, Cabriel, Turia, Mijares.
- **Cuenca del Ebro**: Ebro, Jalón, Aragón, Gállego, Cinca, Segre.
- **Laguna del Ebro**: Laguna de Gallocanta.
- **Humedal costero**: Albufera de Valencia.
- **Cataluña**: Llobregat, Ter, Fluvià.

### Alias y variantes aceptadas

El validador acepta prefijos habituales («río», «rio», «lago», «laguna», «el», «la») y variantes lingüísticas/ortográficas:

| Elemento | Alias admitidos |
| --- | --- |
| Miño | Minho, Río Miño |
| Duero | Douro, Río Duero |
| Tajo | Tejo, Río Tajo |
| Júcar | Xúquer, Xuquer, Río Júcar |
| Nervión | Nerbioi, Ría de Bilbao, Ría del Nervión |
| Navia | Ría de Navia |
| Eo | Ría del Eo, Ría de Eo |
| Fluvià | Fluvia, Río Fluvià |
| Cigüela | Gigüela, Ciguela, Giguela |
| Tiétar | Tietar |
| Mijares | Millars |
| Turia | Guadalaviar |
| Tinto | Río Tinto |
| Lago de Sanabria | Sanabria, Lago Sanabria |
| Lagos de Covadonga | Covadonga, Lagos Covadonga, Enol, Ercina, Lago Enol, Lago Ercina |
| Laguna de Gallocanta | Gallocanta, Laguna Gallocanta |
| Lagunas de Ruidera | Ruidera, Lagunas Ruidera |
| Albufera de Valencia | Albufera, L'Albufera, Albufera Valencia, La Albufera |

---

## Arquitectura de archivos y componentes

| Archivo | Función |
| --- | --- |
| `data-sources/iberian-rivers.geojson` | GeoJSON con los 58 elementos hidrográficos (propiedades: `id`, `name`, `aliases`, `vertiente`, `type: 'rio' \| 'lago'`, coordenadas). |
| `scripts/generate-rivers.mjs` | Proyecta coordenadas a porcentaje del viewBox físico (`1183.412 × 1015.165`) y genera `spain-rios.svg` y `spain-rios.json`. |
| `public/maps/spain-physical.svg` | Mapa de fondo físico y de relieve mudo de España. |
| `public/maps/spain-rios.svg` | SVG base servido en la app con la capa física. |
| `public/data/spain-rios.json` | Dataset JSON con los puntos y metadatos de los 58 elementos. |
| `src/types/river.ts` | Tipos TypeScript: `RiverItem`, `RiverDataset`, `RiverVertiente`, `RiverAnswerResult`, opciones y etiquetas. |
| `src/services/riverData.ts` | Servicio que carga `/data/spain-rios.json` vía `assetUrl`. |
| `src/utils/riverSession.ts` | Lógica de sesión: `pickRiverRound` (selecciona 8 elementos garantizando presencia de lagos y ríos) e `isRiverAnswerCorrect` (cálculo de 100%, 50% o 0%). |
| `src/utils/riverSession.spec.ts` | Tests unitarios con vitest para el dataset, alias, parejas parecidas y puntuación. |
| `src/components/quiz/RiverQuiz.vue` | Componente visual del ejercicio: mapa físico, marcador pulsante, flecha conectora, zoom, radio buttons y mensajes de corrección. |
| `src/views/quizzes/QuizPlayView.vue` | Enrutamiento del modo `rios` hacia `RiverQuiz.vue`. |
| `src/types/quiz.ts` y `src/utils/quizNav.ts` | Registro de la categoría en el menú y catálogo de tests de España. |

---

## Verificación y comandos

- **Regenerar mapa y dataset**: `node scripts/generate-rivers.mjs`
- **Ejecutar tests unitarios**: `npm run test:unit`
- **Validación completa del proyecto**: `npm run validate` (incluye `type-check`, `lint`, `format:check` y `test:unit`)
- **Compilación de producción**: `npm run build`
