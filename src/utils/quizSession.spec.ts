import { describe, expect, it } from 'vitest'
import {
  countCorrectAnswers,
  evaluateAnswers,
  pickHiddenItems,
  sortItemsNorthToSouth,
} from '@/utils/quizSession'
import type { QuizItem } from '@/types/quiz'

const sampleItems: QuizItem[] = [
  {
    id: 'andalucia',
    name: 'Andalucía',
    aliases: ['andalucia'],
    svgPathId: 'andalucia',
    label: { x: 10, y: 20 },
  },
  {
    id: 'aragon',
    name: 'Aragón',
    aliases: ['aragon'],
    svgPathId: 'aragon',
    label: { x: 30, y: 40 },
  },
  {
    id: 'asturias',
    name: 'Asturias',
    aliases: ['asturias'],
    svgPathId: 'asturias',
    label: { x: 50, y: 60 },
  },
]

describe('quizSession', () => {
  it('oculta exactamente el número pedido de elementos', () => {
    const session = pickHiddenItems(sampleItems, 2)
    const hiddenCount = session.filter((item) => item.isHidden).length

    expect(hiddenCount).toBe(2)
    expect(session).toHaveLength(sampleItems.length)
  })

  it('evalúa respuestas con coincidencia aproximada', () => {
    const session = sampleItems.map((item, index) => ({
      ...item,
      isHidden: index < 2,
    }))

    const results = evaluateAnswers(session, {
      andalucia: 'andalucia',
      aragon: 'zaragoza',
    })

    expect(countCorrectAnswers(results)).toBe(1)
    expect(results.find((result) => result.itemId === 'andalucia')?.isCorrect).toBe(true)
    expect(results.find((result) => result.itemId === 'aragon')?.isCorrect).toBe(false)
  })

  it('ordena elementos de norte a sur por posición en el mapa', () => {
    const ordered = sortItemsNorthToSouth([
      { id: 'sur', label: { x: 40, y: 80 } },
      { id: 'norte', label: { x: 50, y: 20 } },
      { id: 'centro', label: { x: 45, y: 50 } },
    ])

    expect(ordered.map((item) => item.id)).toEqual(['norte', 'centro', 'sur'])
  })
})
