// Paso 1 de la reproyección del relieve de Europa: calcula [lon, lat] de cada píxel del fondo
// con la misma proyección que el mapa (scripts/lib/europe-projection.mjs).
//
// Uso: node scripts/tools/europe-relief-grid.mjs <salida.bin> [factor=2]
// Salida: Float32 [lon, lat] por píxel, fila a fila (NaN fuera de la proyección).
// Paso 2: scripts/tools/europe-relief.py

import fs from 'node:fs'
import { EUROPE_RIVERS_VIEWBOX, europeRiversProjection } from '../lib/europe-projection.mjs'

const [output, factorArg = '2'] = process.argv.slice(2)
if (!output) {
  console.error('Uso: node scripts/tools/europe-relief-grid.mjs <salida.bin> [factor]')
  process.exit(1)
}

const factor = Number(factorArg)
const width = EUROPE_RIVERS_VIEWBOX.width * factor
const height = EUROPE_RIVERS_VIEWBOX.height * factor
const projection = europeRiversProjection()
const grid = new Float32Array(width * height * 2)

for (let row = 0; row < height; row += 1) {
  for (let col = 0; col < width; col += 1) {
    const point = projection.invert([(col + 0.5) / factor, (row + 0.5) / factor])
    const offset = (row * width + col) * 2
    grid[offset] = point ? point[0] : NaN
    grid[offset + 1] = point ? point[1] : NaN
  }
}

fs.writeFileSync(output, Buffer.from(grid.buffer))
console.log(`europe-relief-grid: ${width}x${height} píxeles -> ${output}`)
