// Extrae de Natural Earth (dominio público) solo lo que necesita el mapa de ríos, lagos y mares
// de Europa, para no versionar los ficheros completos (decenas de MB).
//
// Descarga previa (GeoJSON de https://github.com/nvkelso/natural-earth-vector/tree/master/geojson):
//   ne_10m_rivers_lake_centerlines, ne_10m_rivers_europe, ne_10m_lakes,
//   ne_10m_geography_marine_polys, ne_50m_admin_0_countries
//
// Uso: node scripts/tools/extract-natural-earth-europe.mjs <carpeta-con-los-geojson>
// Salida: data-sources/natural-earth/europa.json

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const neDir = process.argv[2]
if (!neDir) {
  console.error('Uso: node scripts/tools/extract-natural-earth-europe.mjs <carpeta-natural-earth>')
  process.exit(1)
}

// Zona del mapa con margen: [lonMin, latMin, lonMax, latMax]
const REGION = [-32, 28, 72, 78]

const read = (name) =>
  JSON.parse(fs.readFileSync(path.join(neDir, `${name}.geojson`), 'utf8')).features

const meta = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'data-sources', 'europa-rios.meta.json'), 'utf8'),
)
const wanted = (type) =>
  new Set(meta.elementos.filter((el) => el.type === type).flatMap((el) => el.ne))

const round = (value) => Number(value.toFixed(3))
const roundCoords = (coords) =>
  typeof coords[0] === 'number' ? coords.map(round) : coords.map(roundCoords)

const bounds = (coords, acc = [Infinity, Infinity, -Infinity, -Infinity]) => {
  if (typeof coords[0] === 'number') {
    acc[0] = Math.min(acc[0], coords[0])
    acc[1] = Math.min(acc[1], coords[1])
    acc[2] = Math.max(acc[2], coords[0])
    acc[3] = Math.max(acc[3], coords[1])
  } else {
    coords.forEach((c) => bounds(c, acc))
  }
  return acc
}

const inRegion = (geometry) => {
  const [x0, y0, x1, y1] = bounds(geometry.coordinates)
  return x1 >= REGION[0] && x0 <= REGION[2] && y1 >= REGION[1] && y0 <= REGION[3]
}

const pick = (features, names) =>
  features
    .filter((f) => names.has(f.properties.name) && f.geometry && inRegion(f.geometry))
    .map((f) => ({
      type: 'Feature',
      properties: { name: f.properties.name, featurecla: f.properties.featurecla },
      geometry: { type: f.geometry.type, coordinates: roundCoords(f.geometry.coordinates) },
    }))

const riverNames = wanted('rio')
const output = {
  source: 'Natural Earth (dominio público): 1:10m ríos, lagos y mares; 1:50m países',
  countries: read('ne_50m_admin_0_countries')
    .filter((f) => inRegion(f.geometry))
    .map((f) => ({
      type: 'Feature',
      properties: { name: f.properties.NAME },
      geometry: { type: f.geometry.type, coordinates: roundCoords(f.geometry.coordinates) },
    })),
  rivers: [
    ...pick(read('ne_10m_rivers_lake_centerlines'), riverNames),
    ...pick(read('ne_10m_rivers_europe'), riverNames),
  ],
  lakes: pick(read('ne_10m_lakes'), wanted('lago')),
  seas: pick(read('ne_10m_geography_marine_polys'), wanted('mar')),
}

const missing = [...riverNames, ...wanted('lago'), ...wanted('mar')].filter(
  (name) =>
    ![...output.rivers, ...output.lakes, ...output.seas].some((f) => f.properties.name === name),
)
if (missing.length) {
  console.error(`Faltan en Natural Earth: ${missing.join(', ')}`)
  process.exit(1)
}

const outDir = path.join(rootDir, 'data-sources', 'natural-earth')
fs.mkdirSync(outDir, { recursive: true })
const json = JSON.stringify(output)
fs.writeFileSync(path.join(outDir, 'europa.json'), json)
console.log(
  `extract-natural-earth-europe: ${output.countries.length} países, ${output.rivers.length} tramos de río, ` +
    `${output.lakes.length} lagos, ${output.seas.length} mares (${(json.length / 1024).toFixed(0)} KB)`,
)
