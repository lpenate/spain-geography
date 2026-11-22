import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { RiverDataset, RiverItem } from '@/types/river'
import {
  EXAM_RIVER_IDS,
  asksVertiente,
  filterExamRivers,
  isRiverAnswerCorrect,
  pickRiverRound,
} from '@/utils/riverSession'

const dataset = JSON.parse(
  readFileSync(path.resolve(process.cwd(), 'public/data/spain-rios.json'), 'utf8'),
) as RiverDataset

const svg = readFileSync(path.resolve(process.cwd(), 'public/maps/spain-rios.svg'), 'utf8')

const VIEWBOX_WIDTH = 1183.412
const VIEWBOX_HEIGHT = 1015.165

// Rótulos del mapa «Ríos de España» del libro (unidad U2), ver doc/rios-mapa-libro.jpg
const BOOK_ELEMENTS = [
  'Eo',
  'Navia',
  'Narcea',
  'Nalón',
  'Saja',
  'Nervión',
  'Bidasoa',
  'Lagos de Covadonga',
  'Tambre',
  'Miño',
  'Sil',
  'Duero',
  'Esla',
  'Pisuerga',
  'Adaja',
  'Tormes',
  'Lago de Sanabria',
  'Laguna Negra',
  'Tajo',
  'Alagón',
  'Tiétar',
  'Alberche',
  'Jarama',
  'Henares',
  'Guadiana',
  'Zújar',
  'Jabalón',
  'Cigüela',
  'Záncara',
  'Lagunas de Ruidera',
  'Guadalquivir',
  'Genil',
  'Odiel',
  'Tinto',
  'Almanzora',
  'Guadalhorce',
  'Guadalfeo',
  'Segura',
  'Júcar',
  'Cabriel',
  'Turia',
  'Ebro',
  'Jalón',
  'Aragón',
  'Gállego',
  'Cinca',
  'Segre',
  'Laguna de Gallocanta',
  'Llobregat',
  'Ter',
]

const sample = (name: string): RiverItem => {
  const item = dataset.items.find((entry) => entry.name === name)
  if (!item) throw new Error(`Falta el elemento ${name}`)
  return item
}

describe('riverSession', () => {
  it('contiene exactamente los 45 ríos y 5 lagos del mapa del libro', () => {
    const names = dataset.items.map((item) => item.name).sort((a, b) => a.localeCompare(b, 'es'))

    expect(names).toEqual([...BOOK_ELEMENTS].sort((a, b) => a.localeCompare(b, 'es')))
    expect(dataset.items.filter((item) => item.type === 'rio')).toHaveLength(45)
    expect(dataset.items.filter((item) => item.type === 'lago')).toHaveLength(5)
  })

  it('reparte los elementos por vertiente como el libro (8 / 26 / 16)', () => {
    const byVertiente = (vertiente: string) =>
      dataset.items.filter((item) => item.vertiente === vertiente).length

    expect(byVertiente('cantabrica')).toBe(8)
    expect(byVertiente('atlantica')).toBe(26)
    expect(byVertiente('mediterranea')).toBe(16)
  })

  it('tiene ids únicos y un trazado en el SVG para cada elemento', () => {
    const ids = dataset.items.map((item) => item.id)
    const svgIds = [...svg.matchAll(/data-river="([^"]+)"/g)].map((match) => match[1])

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(svgIds)).toEqual(new Set(ids))
  })

  it('marca un único cauce principal por río para el slider', () => {
    for (const item of dataset.items.filter((entry) => entry.type === 'rio')) {
      const courses = svg.match(new RegExp(`data-river="${item.id}" data-course=`, 'g')) ?? []
      expect(courses, item.name).toHaveLength(1)
    }
  })

  it('no revela nombres en el SVG servido', () => {
    expect(svg).not.toMatch(/data-name|data-aliases/)
  })

  it('sitúa ancla y caja dentro del mapa, con el ancla dentro de su caja', () => {
    for (const item of dataset.items) {
      const { bbox, anchor } = item
      expect(bbox.x0).toBeGreaterThanOrEqual(0)
      expect(bbox.y0).toBeGreaterThanOrEqual(0)
      expect(bbox.x1).toBeLessThanOrEqual(VIEWBOX_WIDTH)
      expect(bbox.y1).toBeLessThanOrEqual(VIEWBOX_HEIGHT)
      expect(anchor.x).toBeGreaterThanOrEqual(bbox.x0 - 0.01)
      expect(anchor.x).toBeLessThanOrEqual(bbox.x1 + 0.01)
      expect(anchor.y).toBeGreaterThanOrEqual(bbox.y0 - 0.01)
      expect(anchor.y).toBeLessThanOrEqual(bbox.y1 + 0.01)
      expect(item.label.x).toBeCloseTo((anchor.x / VIEWBOX_WIDTH) * 100, 1)
      expect(item.label.y).toBeCloseTo((anchor.y / VIEWBOX_HEIGHT) * 100, 1)
    }
  })

  it('asigna 100% de puntos (1.0) si acierta nombre y vertiente', () => {
    const tajo = sample('Tajo')
    const result = isRiverAnswerCorrect(tajo, 'tejo', 'atlantica')

    expect(result.isCorrect).toBe(true)
    expect(result.nameCorrect).toBe(true)
    expect(result.vertienteCorrect).toBe(true)
    expect(result.score).toBe(1)
  })

  it('asigna 50% de puntos (0.5) si acierta el nombre pero falla la vertiente', () => {
    const tajo = sample('Tajo')
    const result = isRiverAnswerCorrect(tajo, 'Tajo', 'mediterranea')

    expect(result.isCorrect).toBe(false)
    expect(result.nameCorrect).toBe(true)
    expect(result.vertienteCorrect).toBe(false)
    expect(result.score).toBe(0.5)
  })

  it('asigna 0 puntos si falla el nombre, aunque acierte la vertiente', () => {
    const tajo = sample('Tajo')
    const result = isRiverAnswerCorrect(tajo, 'Ebro', 'atlantica')

    expect(result.isCorrect).toBe(false)
    expect(result.nameCorrect).toBe(false)
    expect(result.vertienteCorrect).toBe(true)
    expect(result.score).toBe(0)
  })

  it('a los lagos solo les pregunta el nombre, sin vertiente', () => {
    const lake = sample('Lago de Sanabria')

    expect(asksVertiente(lake)).toBe(false)
    expect(asksVertiente(sample('Duero'))).toBe(true)
    expect(isRiverAnswerCorrect(lake, 'Sanabria', null).score).toBe(1)
    expect(isRiverAnswerCorrect(lake, 'Sanabria', 'mediterranea').score).toBe(1)
    expect(isRiverAnswerCorrect(lake, 'Ruidera', null).score).toBe(0)
  })

  it('acepta alias y variantes de ríos y lagos', () => {
    expect(isRiverAnswerCorrect(sample('Miño'), 'Minho', 'atlantica').score).toBe(1)
    expect(isRiverAnswerCorrect(sample('Júcar'), 'xuquer', 'mediterranea').score).toBe(1)
    expect(isRiverAnswerCorrect(sample('Lago de Sanabria'), 'Sanabria', 'atlantica').score).toBe(1)
    expect(
      isRiverAnswerCorrect(sample('Lagos de Covadonga'), 'Covadonga', 'cantabrica').score,
    ).toBe(1)
    expect(isRiverAnswerCorrect(sample('Lagunas de Ruidera'), 'Ruidera', 'atlantica').score).toBe(1)
    expect(
      isRiverAnswerCorrect(sample('Laguna Negra'), 'laguna negra de urbion', 'atlantica').score,
    ).toBe(1)
    expect(isRiverAnswerCorrect(sample('Nervión'), 'Nerbioi', 'cantabrica').score).toBe(1)
  })

  it('no confunde nombres cortos parecidos', () => {
    expect(isRiverAnswerCorrect(sample('Tiétar'), 'Tajo', 'atlantica').nameCorrect).toBe(false)
    expect(isRiverAnswerCorrect(sample('Tajo'), 'Ter', 'atlantica').nameCorrect).toBe(false)
    expect(isRiverAnswerCorrect(sample('Eo'), 'Deva', 'cantabrica').nameCorrect).toBe(false)
    expect(isRiverAnswerCorrect(sample('Navia'), 'Narcea', 'cantabrica').nameCorrect).toBe(false)
  })

  it('prepara una ronda aleatoria con ríos y lagos sin duplicados', () => {
    const round = pickRiverRound(dataset.items, 8, () => 0.5)

    expect(round).toHaveLength(8)
    expect(new Set(round.map((item) => item.id)).size).toBe(8)
    expect(round.some((item) => item.type === 'lago')).toBe(true)
  })

  it('filtra el examen a los 22 ríos de los apuntes y los 5 lagos', () => {
    const exam = filterExamRivers(dataset.items)

    expect(exam).toHaveLength(EXAM_RIVER_IDS.size)
    const rivers = exam.filter((item) => item.type === 'rio')
    expect(rivers).toHaveLength(22)
    expect(exam.filter((item) => item.type === 'lago')).toHaveLength(5)
    const byVertiente = (v: string) => rivers.filter((item) => item.vertiente === v).length
    expect(byVertiente('cantabrica')).toBe(7)
    expect(byVertiente('atlantica')).toBe(7)
    expect(byVertiente('mediterranea')).toBe(8)
  })
})
