// Construye el mapa de ríos, lagos y mares de Europa a partir de Natural Earth.
//
// Entradas (data-sources/):
//   - europa-rios.meta.json: los 33 elementos del mapa de clase (nombre, alias, tipo, fuente)
//   - natural-earth/europa.json: geometrías extraídas con scripts/tools/extract-natural-earth-europe.mjs
//   - europe-relief.jpg: relieve sombreado de Natural Earth (sin textos) ya reproyectado con
//     scripts/tools/europe-relief-grid.mjs + europe-relief.py; se incrusta en el SVG
//
// Salidas:
//   - public/maps/europe-rios.svg: SVG con un <path data-river="id"> por elemento (sin nombres)
//   - public/data/europe-rios.json: índice con nombre, alias, tipo, bbox y ancla
//
// Uso: node scripts/build-europe-rivers-svg.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { geoPath } from 'd3-geo'
import { EUROPE_RIVERS_VIEWBOX, europeRiversProjection } from './lib/europe-projection.mjs'
import {
  bboxOf,
  fmt,
  mergeLines,
  pointAlong,
  polylineLength,
  simplify,
  smoothPath,
} from './lib/hydro-geometry.mjs'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = (...parts) => path.join(rootDir, 'data-sources', ...parts)
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))

const VIEWBOX = EUROPE_RIVERS_VIEWBOX
const EXPECTED = { total: 33, rio: 21, lago: 3, mar: 9 }
const RIVER_TOLERANCE = 0.3 // simplificación Douglas-Peucker en unidades del viewBox
const MERGE_GAP = 6 // huecos entre tramos (embalses) que se cosen, en unidades del viewBox
const LAKE_MIN_SIZE = 7 // el Lemán mide ~4 unidades: se agranda para que se vea
const LAND_DIGITS = 1

const errors = []
const fail = (message) => errors.push(message)

// ---------------------------------------------------------------- proyección

const projection = europeRiversProjection()
const project = (point) => projection(point)
const pathOf = geoPath(projection).digits(LAND_DIGITS)

// ---------------------------------------------------------------- geometría

const ne = readJson(src('natural-earth', 'europa.json'))
const byName = (features) => {
  const index = new Map()
  for (const feature of features) {
    const list = index.get(feature.properties.name) ?? []
    list.push(feature)
    index.set(feature.properties.name, list)
  }
  return index
}
const riverIndex = byName(ne.rivers)
const lakeIndex = byName(ne.lakes)
const seaIndex = byName(ne.seas)

const linesOf = (geometry) => {
  switch (geometry.type) {
    case 'LineString':
      return [geometry.coordinates]
    case 'MultiLineString':
      return geometry.coordinates
    case 'Polygon':
      return [geometry.coordinates[0]]
    case 'MultiPolygon':
      return geometry.coordinates.map((polygon) => polygon[0])
    default:
      return []
  }
}

const featuresFor = (index, element) =>
  element.ne.flatMap((name) => {
    const found = index.get(name)
    if (!found) fail(`${element.id}: no hay geometría de Natural Earth para «${name}»`)
    return found ?? []
  })

// Douglas-Peucker no sirve con un anillo cerrado (extremos iguales): se simplifica en dos mitades
const simplifyRing = (ring, tolerance) => {
  const half = Math.floor(ring.length / 2)
  return [
    ...simplify(ring.slice(0, half + 1), tolerance).slice(0, -1),
    ...simplify(ring.slice(half), tolerance),
  ]
}

const clampBox = (box) => ({
  x0: Math.max(0, box.x0),
  y0: Math.max(0, box.y0),
  x1: Math.min(VIEWBOX.width, box.x1),
  y1: Math.min(VIEWBOX.height, box.y1),
})

// ---------------------------------------------------------------- elementos

const meta = readJson(src('europa-rios.meta.json'))
const items = []
const markup = { rio: [], lago: [], mar: [] }
const ids = new Set()

for (const element of meta.elementos) {
  const { id, name, aliases, type } = element

  if (ids.has(id)) fail(`id duplicado: ${id}`)
  ids.add(id)
  if (!['rio', 'lago', 'mar'].includes(type)) fail(`${id}: tipo no válido (${type})`)
  if (!new RegExp(`^${type}-[a-z0-9-]+$`).test(id)) fail(`${id}: id fuera de la convención`)

  let bbox
  let anchor

  if (type === 'rio') {
    const raw = featuresFor(riverIndex, element).flatMap((f) => linesOf(f.geometry))
    let lines = mergeLines(
      raw.map((line) => line.map(project)),
      MERGE_GAP,
    )
      .map((line) => simplify(line, RIVER_TOLERANCE))
      .filter((line) => polylineLength(line) > 2)
    if (!lines.length) {
      fail(`${id}: geometría vacía`)
      continue
    }

    // Cauce principal = recorrido más largo, orientado nacimiento -> desembocadura
    let main = lines.reduce((best, line) =>
      polylineLength(line) > polylineLength(best) ? line : best,
    )
    const mouth = project(element.mouth)
    const dist = (p) => Math.hypot(p[0] - mouth[0], p[1] - mouth[1])
    if (dist(main[0]) < dist(main.at(-1))) {
      lines = lines.map((line) => (line === main ? [...line].reverse() : line))
      main = [...main].reverse()
    }
    if (dist(main.at(-1)) > 25) fail(`${id}: el cauce no acaba cerca de la desembocadura`)

    const branches = lines.filter((line) => line !== main && line.join() !== main.join())
    markup.rio.push(
      `<path class="hydro hydro--rio" data-river="${id}" data-course="" d="${smoothPath(main)}"/>`,
    )
    if (branches.length) {
      markup.rio.push(
        `<path class="hydro hydro--rio" data-river="${id}" d="${branches.map((line) => smoothPath(line)).join('')}"/>`,
      )
    }
    bbox = bboxOf(lines)
    anchor = pointAlong(main, element.anchor ?? 0.5)
  } else if (type === 'lago') {
    const rings = featuresFor(lakeIndex, element)
      .flatMap((f) => linesOf(f.geometry))
      .map((ring) => ring.map(project))
    if (!rings.length) {
      fail(`${id}: geometría vacía`)
      continue
    }
    const box = bboxOf(rings)
    const size = Math.max(box.x1 - box.x0, box.y1 - box.y0)
    const factor = size < LAKE_MIN_SIZE ? LAKE_MIN_SIZE / size : 1
    const cx = (box.x0 + box.x1) / 2
    const cy = (box.y0 + box.y1) / 2
    const scaled = rings
      .map((ring) => ring.map(([x, y]) => [cx + (x - cx) * factor, cy + (y - cy) * factor]))
      .map((ring) => simplifyRing(ring, 0.25))
      .filter((ring) => ring.length > 3)
    const d = scaled.map((ring) => smoothPath(ring.slice(0, -1), true)).join('')
    markup.lago.push(`<path class="hydro hydro--lago" data-river="${id}" d="${d}"/>`)
    bbox = bboxOf(scaled)
    anchor = [cx, cy]
  } else {
    const collection = { type: 'FeatureCollection', features: featuresFor(seaIndex, element) }
    const d = pathOf(collection)
    if (!d) {
      fail(`${id}: geometría vacía`)
      continue
    }
    markup.mar.push(`<path class="hydro hydro--mar" data-river="${id}" d="${d}"/>`)
    const [[x0, y0], [x1, y1]] = pathOf.bounds(collection)
    bbox = clampBox({ x0, y0, x1, y1 })
    anchor = project(element.anchor)
  }

  if (bbox.x0 < 0 || bbox.y0 < 0 || bbox.x1 > VIEWBOX.width || bbox.y1 > VIEWBOX.height) {
    fail(`${id}: bbox fuera del viewBox`)
  }
  if (anchor[0] < 0 || anchor[1] < 0 || anchor[0] > VIEWBOX.width || anchor[1] > VIEWBOX.height) {
    fail(`${id}: ancla fuera del viewBox`)
  }

  const round2 = (n) => Number(n.toFixed(2))
  items.push({
    id,
    name,
    aliases,
    type,
    label: {
      x: round2((anchor[0] / VIEWBOX.width) * 100),
      y: round2((anchor[1] / VIEWBOX.height) * 100),
    },
    anchor: { x: round2(anchor[0]), y: round2(anchor[1]) },
    bbox: { x0: round2(bbox.x0), y0: round2(bbox.y0), x1: round2(bbox.x1), y1: round2(bbox.y1) },
  })
}

// ---------------------------------------------------------------- validación

const count = (type) => items.filter((item) => item.type === type).length
const checks = { total: items.length, rio: count('rio'), lago: count('lago'), mar: count('mar') }
for (const [key, expected] of Object.entries(EXPECTED)) {
  if (checks[key] !== expected) fail(`recuento ${key}: ${checks[key]} (se esperaban ${expected})`)
}

if (errors.length) {
  console.error(`build-europe-rivers-svg: ${errors.length} errores\n - ${errors.join('\n - ')}`)
  process.exit(1)
}

// ---------------------------------------------------------------- salida

const land = ne.countries
  .map((country) => pathOf(country))
  .filter(Boolean)
  .map((d) => `<path d="${d}"/>`)
  .join('\n')

// Incrustado en base64: el SVG se usa inline en el quiz y como <img> en el índice, y en ningún
// caso se resolvería bien una ruta relativa a la imagen
const relief = fs.readFileSync(src('europe-relief.jpg')).toString('base64')

// Estilo por defecto (también para la miniatura del índice, que carga el SVG como <img>).
// El quiz lo sobrescribe con reglas más específicas.
const style = `<style>
.borders { fill: none; stroke: #6b6250; stroke-opacity: 0.45; stroke-width: 0.6; stroke-linejoin: round; }
.hydro--mar { fill: transparent; stroke: none; }
.hydro--rio { fill: none; stroke: #0978ab; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.hydro--lago { fill: #6fc3ec; stroke: #0978ab; stroke-width: 1; }
</style>`

const outputSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX.width} ${VIEWBOX.height}" width="${VIEWBOX.width}" height="${VIEWBOX.height}">
${style}
<defs>
<g id="europe-land">
${land}
</g>
<!-- Los polígonos de los mares son toscos y se meten en tierra: solo se pintan sobre el agua -->
<mask id="europe-sea-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="${VIEWBOX.width}" height="${VIEWBOX.height}">
<rect width="${VIEWBOX.width}" height="${VIEWBOX.height}" fill="#fff"/>
<use href="#europe-land" fill="#000"/>
</mask>
</defs>
<image href="data:image/jpeg;base64,${relief}" width="${VIEWBOX.width}" height="${VIEWBOX.height}" preserveAspectRatio="none"/>
<g id="seas" mask="url(#europe-sea-mask)">
${markup.mar.join('\n')}
</g>
<use class="borders" href="#europe-land"/>
<g id="hydrography">
${[...markup.rio, ...markup.lago].join('\n')}
</g>
</svg>
`

const dataset = {
  id: 'rios-europa',
  region: 'europe',
  title: 'Ríos, lagos y mares de Europa',
  map: '/maps/europe-rios.svg',
  viewBox: `0 0 ${VIEWBOX.width} ${VIEWBOX.height}`,
  attribution: 'Cartografía y relieve: Natural Earth (dominio público).',
  items,
}

fs.writeFileSync(path.join(rootDir, 'public', 'maps', 'europe-rios.svg'), outputSvg)
fs.writeFileSync(
  path.join(rootDir, 'public', 'data', 'europe-rios.json'),
  `${JSON.stringify(dataset, null, 2)}\n`,
)

console.log(
  `build-europe-rivers-svg: ${checks.rio} ríos + ${checks.lago} lagos + ${checks.mar} mares, ` +
    `SVG ${(outputSvg.length / 1024).toFixed(0)} KB (${fmt(projection.scale())} de escala)`,
)
