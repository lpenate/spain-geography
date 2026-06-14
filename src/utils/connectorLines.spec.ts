import { describe, expect, it } from 'vitest'
import { shortenLineFromEnd } from '@/utils/connectorLines'

describe('connectorLines', () => {
  it('acorta la línea antes del marcador del mapa', () => {
    const segment = shortenLineFromEnd({ x: 100, y: 50 }, { x: 40, y: 50 }, 20)

    expect(segment.end.x).toBe(60)
    expect(segment.end.y).toBe(50)
  })
})
