import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { GentilicioDataset, GentilicioItem, GentilicioMistakes } from '@/types/gentilicio'
import { normalizeAnswer } from '@/utils/textMatch'
import {
  GENTILICIO_MISTAKES_KEY,
  GENTILICIO_ROUND_SIZE,
  applyGentilicioResults,
  countGentilicioScore,
  evaluateGentilicioAnswers,
  formatExpectedAnswer,
  gentilicioAnswerCandidates,
  isGentilicioAnswerCorrect,
  pickGentilicioRound,
  readGentilicioMistakes,
  writeGentilicioMistakes,
} from '@/utils/gentilicioSession'

const dataset = JSON.parse(
  readFileSync(path.resolve(process.cwd(), 'public/data/spain-gentilicios.json'), 'utf8'),
) as GentilicioDataset

const item = (id: string, name = id, aliases: string[] = []): GentilicioItem => ({
  id,
  kind: 'ciudad',
  name,
  aliases,
  gentilicio: id,
})

const memoryStorage = () => {
  const data = new Map<string, string>()

  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
  }
}

const findItem = (id: string): GentilicioItem => {
  const match = dataset.items.find((entry) => entry.id === id)
  if (!match) throw new Error(`No está el gentilicio ${id}`)
  return match
}

const candidateSet = (entry: GentilicioItem): Set<string> =>
  new Set(gentilicioAnswerCandidates(entry).map((answer) => normalizeAnswer(answer)))

describe('gentilicioSession', () => {
  it('usa solo el catálogo del PDF de gentilicios', () => {
    expect(dataset.items.length).toBeGreaterThan(GENTILICIO_ROUND_SIZE)

    const ids = dataset.items.map((entry) => entry.id)
    const gentilicios = dataset.items.map((entry) => entry.gentilicio)

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(gentilicios).size).toBe(gentilicios.length)
    expect(dataset.items.every((entry) => entry.name && entry.gentilicio)).toBe(true)

    expect(findItem('cercedilla').gentilicio).toBe('parrao')
    expect(findItem('jaen').gentilicio).toBe('jienense')
    expect(findItem('palma-de-mallorca').gentilicio).toBe('mallorquín')
    expect(dataset.items.some((entry) => entry.gentilicio === 'chicharrero')).toBe(false)
  })

  it('no da por buena la respuesta de otro lugar distinto', () => {
    dataset.items.forEach((entry) => {
      expect(isGentilicioAnswerCorrect(entry.name, entry)).toBe(true)

      dataset.items.forEach((other) => {
        if (other.id === entry.id) return

        const shared = [...candidateSet(entry)].some((answer) => candidateSet(other).has(answer))
        if (shared) return

        gentilicioAnswerCandidates(entry).forEach((answer) => {
          expect(isGentilicioAnswerCorrect(answer, other)).toBe(false)
        })
      })
    })
  })

  it('acepta el nombre oficial, alias y alguna errata', () => {
    expect(isGentilicioAnswerCorrect('Sevilla', findItem('sevilla-sevillano'))).toBe(true)
    expect(isGentilicioAnswerCorrect('sevila', findItem('sevilla-hispalense'))).toBe(true)
    expect(isGentilicioAnswerCorrect('Euskadi', findItem('pais-vasco'))).toBe(true)
    expect(isGentilicioAnswerCorrect('Comunidad de Madrid', findItem('madrid'))).toBe(true)
    expect(isGentilicioAnswerCorrect('León', findItem('leon'))).toBe(true)
    expect(isGentilicioAnswerCorrect('Castilla y León', findItem('leon'))).toBe(false)
    expect(isGentilicioAnswerCorrect('Gerona', findItem('girona-gerundense'))).toBe(true)
    expect(isGentilicioAnswerCorrect('Villalba', findItem('collado-villalba'))).toBe(true)
    expect(isGentilicioAnswerCorrect('', findItem('sevilla-sevillano'))).toBe(false)
  })

  it('muestra las dos respuestas cuando ciudad y comunidad comparten gentilicio', () => {
    expect(formatExpectedAnswer(findItem('madrid'))).toBe('Madrid o Comunidad de Madrid')
    expect(formatExpectedAnswer(findItem('sevilla-sevillano'))).toBe('Sevilla')
  })

  it('prioriza los fallos y completa el test hasta 10', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'].map((id) =>
      item(id),
    )
    const round = pickGentilicioRound(items, { a: 1, b: 3 }, GENTILICIO_ROUND_SIZE, () => 0)
    const ids = round.map((entry) => entry.id)

    expect(ids).toHaveLength(GENTILICIO_ROUND_SIZE)
    expect(new Set(ids).size).toBe(GENTILICIO_ROUND_SIZE)
    expect(ids).toEqual(expect.arrayContaining(['a', 'b']))
  })

  it('si hay más de 10 fallos se queda con los más repetidos', () => {
    const items = Array.from({ length: 15 }, (_, index) =>
      item(`id-${String(index).padStart(2, '0')}`),
    )
    const mistakes = Object.fromEntries(items.map((entry, index) => [entry.id, index + 1]))
    const ids = pickGentilicioRound(items, mistakes, GENTILICIO_ROUND_SIZE, () => 0).map(
      (entry) => entry.id,
    )

    expect(ids).toHaveLength(GENTILICIO_ROUND_SIZE)
    expect(ids).toContain('id-14')
    expect(ids).toContain('id-05')
    expect(ids).not.toContain('id-00')
    expect(ids).not.toContain('id-04')
  })

  it('puntúa los aciertos sobre las 10 respuestas y guarda solo los fallos', () => {
    const round = [findItem('sevilla-sevillano'), findItem('andalucia')]
    const results = evaluateGentilicioAnswers(round, {
      'sevilla-sevillano': 'Málaga',
      andalucia: 'Andalucía',
    })

    expect(countGentilicioScore(results)).toBe(1)
    expect(results[0]?.isCorrect).toBe(false)
    expect(results[0]?.expectedAnswer).toBe('Sevilla')
    expect(results[1]?.isCorrect).toBe(true)

    const stored = applyGentilicioResults(
      { 'sevilla-sevillano': 1, andalucia: 2 },
      results,
    )

    expect(stored).toEqual({ 'sevilla-sevillano': 2 })
  })

  it('persiste los fallos para el siguiente test', () => {
    const storage = memoryStorage()
    const mistakes: GentilicioMistakes = { sevilla: 2 }

    writeGentilicioMistakes(mistakes, storage)

    expect(storage.getItem(GENTILICIO_MISTAKES_KEY)).toContain('sevilla')
    expect(readGentilicioMistakes(storage)).toEqual(mistakes)
    expect(readGentilicioMistakes({ getItem: () => '{mal' })).toEqual({})
  })
})
