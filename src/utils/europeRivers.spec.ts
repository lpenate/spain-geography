import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { RiverDataset, RiverItem } from '@/types/river'
import { asksVertiente, isRiverAnswerCorrect } from '@/utils/riverSession'

const read = (file: string) => readFileSync(path.resolve(process.cwd(), file), 'utf8')
const dataset = JSON.parse(read('public/data/europe-rios.json')) as RiverDataset
const svg = read('public/maps/europe-rios.svg')

const byName = (name: string): RiverItem => {
  const item = dataset.items.find((candidate) => candidate.name === name)
  if (!item) throw new Error(`No existe ${name}`)
  return item
}

describe('mapa de ríos, lagos y mares de Europa', () => {
  it('tiene los 21 ríos, 3 lagos y 9 mares del mapa de clase', () => {
    const count = (type: string) => dataset.items.filter((item) => item.type === type).length

    expect(count('rio')).toBe(21)
    expect(count('lago')).toBe(3)
    expect(count('mar')).toBe(9)
    expect(dataset.items.map((item) => item.name)).toEqual(
      expect.arrayContaining([
        'Volga',
        'Danubio',
        'Dvina Septentrional',
        'Lago Ladoga',
        'Lago Lemán',
        'Mar Caspio',
        'Mar Cantábrico',
        'Mar Mediterráneo',
      ]),
    )
  })

  it('dibuja un trazado por elemento y un cauce recorrible por río, sin nombres en el SVG', () => {
    for (const item of dataset.items) {
      expect(svg).toContain(`data-river="${item.id}"`)
      if (item.type === 'rio') {
        expect(svg).toMatch(new RegExp(`data-river="${item.id}" data-course=""`))
      }
    }
    expect(svg).not.toContain('<text')
  })

  it('coloca cada ancla dentro del mapa', () => {
    for (const item of dataset.items) {
      expect(item.label.x).toBeGreaterThan(0)
      expect(item.label.x).toBeLessThan(100)
      expect(item.label.y).toBeGreaterThan(0)
      expect(item.label.y).toBeLessThan(100)
    }
  })

  it('no pregunta la vertiente: solo cuenta el nombre', () => {
    expect(dataset.items.some(asksVertiente)).toBe(false)
    expect(isRiverAnswerCorrect(byName('Rin'), 'Rhin', null).score).toBe(1)
    expect(isRiverAnswerCorrect(byName('Mar Negro'), 'negro', null).score).toBe(1)
    expect(isRiverAnswerCorrect(byName('Mar Báltico'), 'mar baltico', null).score).toBe(1)
    expect(isRiverAnswerCorrect(byName('Lago Lemán'), 'Lago de Ginebra', null).score).toBe(1)
    expect(isRiverAnswerCorrect(byName('Dniéper'), 'Dniester', null).score).toBe(0)
    expect(isRiverAnswerCorrect(byName('Elba'), 'Ebro', null).score).toBe(0)
  })
})
