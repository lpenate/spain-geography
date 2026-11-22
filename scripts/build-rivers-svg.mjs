// Construye el mapa de ríos y lagos a partir de una sola fuente de geometría.
//
// Entradas (data-sources/):
//   - spain-rios.source.svg: relieve, costa, fronteras e hidrografía de contexto
//   - rios.meta.json: los 50 elementos del libro (nombre, alias, vertiente, fuente)
//   - osm/rios-lagos-nominatim*.json: geometrías de OpenStreetMap (ODbL)
//   - osm/calibracion-proyeccion.json: lon/lat -> coordenadas del viewBox
//
// Salidas:
//   - public/maps/spain-rios.svg: SVG con un <path data-river="id"> por elemento (sin nombres)
//   - public/data/spain-rios.json: índice con nombre, alias, vertiente, bbox y ancla
//
// Uso: node scripts/build-rivers-svg.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = (...parts) => path.join(rootDir, 'data-sources', ...parts)

const VIEWBOX = { width: 1183.412, height: 1015.165 }
const VERTIENTES = ['cantabrica', 'atlantica', 'mediterranea']
const EXPECTED = { total: 50, rio: 45, lago: 5, cantabrica: 8, atlantica: 26, mediterranea: 16 }
const RIVER_TOLERANCE = 0.35 // simplificación Douglas-Peucker en unidades del viewBox
const LAKE_MIN_SIZE = 7 // los lagos reales miden 1-2 unidades: se agrandan para que se vean

const errors = []
const fail = (message) => errors.push(message)

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))

// ---------------------------------------------------------------- proyección

const calibration = readJson(src('osm', 'calibracion-proyeccion.json'))
const [originLon, originLat] = calibration.origin
const [coefX, coefY] = calibration.C

const project = ([lon, lat]) => {
  const u = lon - originLon
  const w = lat - originLat
  const terms = [1, u, w, u * u, u * w, w * w]
  const dot = (coefs) => coefs.reduce((sum, c, i) => sum + c * terms[i], 0)
  return [dot(coefX), dot(coefY)]
}

// ---------------------------------------------------------------- geometría

const osmIndex = new Map()
for (const file of ['rios-lagos-nominatim.json', 'rios-lagos-nominatim-extra.json']) {
  for (const results of Object.values(readJson(src('osm', file)))) {
    for (const result of results) {
      osmIndex.set(`${result.osm_type}/${result.osm_id}`, result.geojson)
    }
  }
}

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

const MERGE_GAP = 8 // huecos (embalses, tramos sin cartografiar) que se cosen, en unidades del viewBox

// Une tramos por sus extremos más cercanos (hasta MERGE_GAP) para obtener recorridos continuos
const mergeLines = (input, gap = MERGE_GAP) => {
  const lines = input.filter((line) => line.length > 1).map((line) => [...line])
  const distance = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1])

  for (;;) {
    let best = null
    for (let i = 0; i < lines.length; i += 1) {
      for (let j = i + 1; j < lines.length; j += 1) {
        const a = lines[i]
        const b = lines[j]
        const options = [
          [distance(a.at(-1), b[0]), () => [...a, ...b]],
          [distance(a.at(-1), b.at(-1)), () => [...a, ...[...b].reverse()]],
          [distance(a[0], b.at(-1)), () => [...b, ...a]],
          [distance(a[0], b[0]), () => [...[...b].reverse(), ...a]],
        ]
        for (const [d, join] of options) {
          if (d <= gap && (!best || d < best.d)) best = { d, i, j, join }
        }
      }
    }
    if (!best) return lines
    lines[best.i] = best.join()
    lines.splice(best.j, 1)
  }
}

const simplify = (points, tolerance) => {
  if (points.length < 3) return points
  const [x1, y1] = points[0]
  const [x2, y2] = points.at(-1)
  const length = Math.hypot(x2 - x1, y2 - y1) || 1e-9
  let index = 0
  let maxDistance = 0
  for (let k = 1; k < points.length - 1; k += 1) {
    const [x, y] = points[k]
    const distance = Math.abs((x2 - x1) * (y1 - y) - (x1 - x) * (y2 - y1)) / length
    if (distance > maxDistance) {
      index = k
      maxDistance = distance
    }
  }
  if (maxDistance <= tolerance) return [points[0], points.at(-1)]
  return [
    ...simplify(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(index), tolerance),
  ]
}

const fmt = (n) => Number(n.toFixed(2)).toString()

// Catmull-Rom -> Bézier cúbica: curvas suaves, sin segmentos rectos
const smoothPath = (points, closed = false) => {
  if (points.length < 3) return `M${points.map((p) => p.map(fmt).join(',')).join('L')}`
  const ring = closed
    ? [points.at(-1), ...points, points[0], points[1]]
    : [points[0], ...points, points.at(-1)]
  const last = closed ? points.length : points.length - 1
  let d = `M${fmt(points[0][0])},${fmt(points[0][1])}`
  for (let i = 1; i <= last; i += 1) {
    const [p0, p1, p2, p3] = [ring[i - 1], ring[i], ring[i + 1], ring[i + 2]]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${fmt(c1[0])},${fmt(c1[1])} ${fmt(c2[0])},${fmt(c2[1])} ${fmt(p2[0])},${fmt(p2[1])}`
  }
  return closed ? `${d}Z` : d
}

const polylineLength = (points) =>
  points
    .slice(1)
    .reduce((sum, p, i) => sum + Math.hypot(p[0] - points[i][0], p[1] - points[i][1]), 0)

const pointAlong = (points, fraction) => {
  const target = polylineLength(points) * fraction
  let walked = 0
  for (let i = 1; i < points.length; i += 1) {
    const segment = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1])
    if (walked + segment >= target) {
      const r = segment === 0 ? 0 : (target - walked) / segment
      return [
        points[i - 1][0] + (points[i][0] - points[i - 1][0]) * r,
        points[i - 1][1] + (points[i][1] - points[i - 1][1]) * r,
      ]
    }
    walked += segment
  }
  return points.at(-1)
}

const bboxOf = (lines) => {
  const all = lines.flat()
  const xs = all.map((p) => p[0])
  const ys = all.map((p) => p[1])
  return {
    x0: Math.min(...xs),
    y0: Math.min(...ys),
    x1: Math.max(...xs),
    y1: Math.max(...ys),
  }
}

// Puntos absolutos (vértices) de un atributo d con comandos M/L/C/S/H/V
const parsePathVertices = (d) => {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? []
  const arity = { M: 2, L: 2, C: 6, S: 4, H: 1, V: 1, Z: 0 }
  const lines = []
  let current = []
  let x = 0
  let y = 0
  let command = null
  let i = 0
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) {
      command = tokens[i]
      i += 1
      if (command.toUpperCase() === 'Z') continue
      continue
    }
    const upper = command.toUpperCase()
    const relative = command !== upper
    const args = tokens.slice(i, i + arity[upper]).map(Number)
    i += arity[upper]
    if (upper === 'M' || upper === 'L') {
      x = (relative ? x : 0) + args[0]
      y = (relative ? y : 0) + args[1]
    } else if (upper === 'C' || upper === 'S') {
      x = (relative ? x : 0) + args.at(-2)
      y = (relative ? y : 0) + args.at(-1)
    } else if (upper === 'H') {
      x = (relative ? x : 0) + args[0]
    } else if (upper === 'V') {
      y = (relative ? y : 0) + args[0]
    }
    if (upper === 'M') {
      if (current.length) lines.push(current)
      current = []
      command = relative ? 'l' : 'L'
    }
    current.push([x, y])
  }
  if (current.length) lines.push(current)
  return lines
}

// ---------------------------------------------------------------- SVG fuente

const sourceSvg = fs.readFileSync(src('spain-rios.source.svg'), 'utf8')
const hydroMatch = sourceSvg.match(/<g id="hydrography">([\s\S]*?)<\/g>/)
if (!hydroMatch) throw new Error('El SVG fuente no tiene <g id="hydrography">')

const sourcePaths = new Map()
for (const match of hydroMatch[1].matchAll(/<path id="([^"]+)"[^>]*?\sd="([^"]*)"/g)) {
  sourcePaths.set(match[1], match[2].replace(/\s+/g, ' ').trim())
}

// Contexto: embalses y ríos de Portugal, Francia y Marruecos (atenuados por CSS)
const contextPaths = [...hydroMatch[1].matchAll(/<path class="hydro hydro--context"[^>]*\/>/g)].map(
  (match) => match[0],
)

// ---------------------------------------------------------------- elementos

const meta = readJson(src('rios.meta.json'))
const items = []
const svgElements = []
const ids = new Set()

for (const element of meta.elementos) {
  const { id, name, aliases, vertiente, type } = element

  if (ids.has(id)) fail(`id duplicado: ${id}`)
  ids.add(id)
  if (!VERTIENTES.includes(vertiente)) fail(`${id}: vertiente no válida (${vertiente})`)
  if (!['rio', 'lago'].includes(type)) fail(`${id}: tipo no válido (${type})`)
  if (!/^(rio|lago)-[a-z0-9-]+$/.test(id)) fail(`${id}: id fuera de la convención rio-*/lago-*`)

  let lines = []
  let d = ''

  if (element.source?.svg) {
    for (const pathId of element.source.svg) {
      const pathD = sourcePaths.get(pathId)
      if (!pathD) {
        fail(`${id}: no existe el trazado ${pathId} en el SVG fuente`)
        continue
      }
      d += pathD
      lines.push(...parsePathVertices(pathD))
    }
  } else if (element.source?.osm) {
    const raw = []
    for (const key of element.source.osm) {
      const geometry = osmIndex.get(key)
      if (!geometry) fail(`${id}: no hay geometría OSM para ${key}`)
      else raw.push(...linesOf(geometry))
    }

    if (type === 'lago') {
      const rings = raw.map((ring) => ring.map(project))
      const box = bboxOf(rings)
      const size = Math.max(box.x1 - box.x0, box.y1 - box.y0)
      const factor = size < LAKE_MIN_SIZE ? LAKE_MIN_SIZE / size : 1
      const cx = (box.x0 + box.x1) / 2
      const cy = (box.y0 + box.y1) / 2
      // Los anillos ya vienen simplificados de Nominatim (pocos vértices): no se vuelven a simplificar
      lines = rings.map((ring) =>
        ring.map(([x, y]) => [cx + (x - cx) * factor, cy + (y - cy) * factor]),
      )
      d = lines
        .filter((ring) => ring.length > 2)
        .map((ring) => smoothPath(ring.slice(0, -1), true))
        .join('')
    } else {
      lines = mergeLines(raw.map((line) => line.map(project)))
        .map((line) => simplify(line, RIVER_TOLERANCE))
        .filter((line) => polylineLength(line) > 3)
      d = lines.map((line) => smoothPath(line)).join('')
    }
  } else {
    fail(`${id}: sin fuente de geometría`)
  }

  if (!lines.length || !d) {
    fail(`${id}: geometría vacía`)
    continue
  }

  // Sentido nacimiento -> desembocadura, para que el slider del cauce recorra el río aguas abajo
  if (element.reverse && type === 'rio') {
    lines = lines.map((line) => simplify([...line].reverse(), RIVER_TOLERANCE)).reverse()
    d = lines.map((line) => smoothPath(line)).join('')
  }

  const bbox = bboxOf(lines)
  let anchor
  if (type === 'lago') {
    anchor = [(bbox.x0 + bbox.x1) / 2, (bbox.y0 + bbox.y1) / 2]
  } else {
    const main = lines.reduce((best, line) =>
      polylineLength(line) > polylineLength(best) ? line : best,
    )
    anchor = pointAlong(main, element.anchor ?? 0.5)
  }

  if (bbox.x0 < 0 || bbox.y0 < 0 || bbox.x1 > VIEWBOX.width || bbox.y1 > VIEWBOX.height) {
    fail(`${id}: bbox fuera del viewBox`)
  }

  const round2 = (n) => Number(n.toFixed(2))
  items.push({
    id,
    name,
    aliases,
    vertiente,
    type,
    label: {
      x: round2((anchor[0] / VIEWBOX.width) * 100),
      y: round2((anchor[1] / VIEWBOX.height) * 100),
    },
    anchor: { x: round2(anchor[0]), y: round2(anchor[1]) },
    bbox: { x0: round2(bbox.x0), y0: round2(bbox.y0), x1: round2(bbox.x1), y1: round2(bbox.y1) },
  })

  if (type === 'lago') {
    svgElements.push({
      type,
      markup: `<path class="hydro hydro--lago" data-river="${id}" d="${d}"/>`,
    })
  } else if (element.source?.svg && !element.reverse) {
    // Trazado original del SVG fuente: se usa tal cual como cauce
    svgElements.push({
      type,
      markup: `<path class="hydro hydro--rio" data-river="${id}" data-course="" d="${d}"/>`,
    })
  } else {
    // Cauce principal (el recorrido más largo) en su propio path: es lo que recorre el slider.
    // Brazos secundarios (deltas, canales, tramos sueltos) en otro path con el mismo data-river.
    const main = lines.indexOf(
      lines.reduce((best, line) => (polylineLength(line) > polylineLength(best) ? line : best)),
    )
    const branches = lines.filter((_, i) => i !== main)
    svgElements.push({
      type,
      markup: `<path class="hydro hydro--rio" data-river="${id}" data-course="" d="${smoothPath(lines[main])}"/>`,
    })
    if (branches.length) {
      svgElements.push({
        type,
        markup: `<path class="hydro hydro--rio" data-river="${id}" d="${branches.map((line) => smoothPath(line)).join('')}"/>`,
      })
    }
  }
}

// ---------------------------------------------------------------- validación

const count = (predicate) => items.filter(predicate).length
const checks = {
  total: items.length,
  rio: count((item) => item.type === 'rio'),
  lago: count((item) => item.type === 'lago'),
  cantabrica: count((item) => item.vertiente === 'cantabrica'),
  atlantica: count((item) => item.vertiente === 'atlantica'),
  mediterranea: count((item) => item.vertiente === 'mediterranea'),
}
for (const [key, expected] of Object.entries(EXPECTED)) {
  if (checks[key] !== expected) fail(`recuento ${key}: ${checks[key]} (se esperaban ${expected})`)
}

if (errors.length) {
  console.error(`build-rivers-svg: ${errors.length} errores\n - ${errors.join('\n - ')}`)
  process.exit(1)
}

// ---------------------------------------------------------------- salida

// Ríos primero y lagos encima, para que los lagos no queden tapados
const hydrography = [
  ...contextPaths,
  ...svgElements.filter((el) => el.type === 'rio').map((el) => el.markup),
  ...svgElements.filter((el) => el.type === 'lago').map((el) => el.markup),
].join('\n')

const DEFAULT_HYDRO_STYLE = `<style>
.hydro--rio, .hydro--context { fill: none; stroke: #0978ab; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
.hydro--context { opacity: 0.35; }
.hydro--lago { fill: #6fc3ec; stroke: #0978ab; stroke-width: 1.5; }
</style>`

const outputSvg = sourceSvg
  .replace(/<\?xml[^>]*>\s*/, '')
  .replace(/<!--[\s\S]*?-->\s*/g, '')
  .replace(/<!DOCTYPE[^>]*>\s*/, '')
  .replace(/<metadata[\s\S]*?<\/metadata>/, '')
  .replace(/ xmlns:c2pa="[^"]*"/, '')
  .replace(hydroMatch[0], `<g id="hydrography">\n${hydrography}\n</g>`)
  // Estilo por defecto de los trazados: sin él, un <img> (miniatura del índice) pinta los ríos
  // como polígonos negros rellenos. El quiz lo sobrescribe con reglas más específicas.
  .replace(/(<svg\b[^>]*>)/, `$1\n${DEFAULT_HYDRO_STYLE}`)
  // Fuera los límites de comunidades autónomas (gris fino); se mantienen las fronteras de país (gris grueso)
  .replace(
    /<(polyline|polygon|path)\b[^>]*stroke="#646464"[^>]*stroke-width="1\.4173"[^>]*\/?>(\s*<\/\1>)?/g,
    '',
  )

const dataset = {
  id: 'rios',
  region: 'spain',
  title: 'Ríos y lagos de España',
  map: '/maps/spain-rios.svg',
  viewBox: `0 0 ${VIEWBOX.width} ${VIEWBOX.height}`,
  attribution: 'Hidrografía: © colaboradores de OpenStreetMap (ODbL). Relieve: NordNordWest.',
  items,
}

fs.writeFileSync(path.join(rootDir, 'public', 'maps', 'spain-rios.svg'), outputSvg)
fs.writeFileSync(
  path.join(rootDir, 'public', 'data', 'spain-rios.json'),
  `${JSON.stringify(dataset, null, 2)}\n`,
)

console.log(
  `build-rivers-svg: ${checks.rio} ríos + ${checks.lago} lagos ` +
    `(${checks.cantabrica} cantábrica, ${checks.atlantica} atlántica, ${checks.mediterranea} mediterránea), ` +
    `SVG ${(outputSvg.length / 1024).toFixed(0)} KB`,
)
