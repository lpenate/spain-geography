import { describe, expect, it } from 'vitest'
import { isApproximateMatch, normalizeAnswer } from '@/utils/textMatch'

describe('textMatch', () => {
  it('normaliza mayúsculas y acentos', () => {
    expect(normalizeAnswer('  Córdoba ')).toBe('cordoba')
  })

  it('acepta coincidencias aproximadas', () => {
    expect(isApproximateMatch('sevilla', ['Sevilla'])).toBe(true)
    expect(isApproximateMatch('sevila', ['Sevilla'])).toBe(true)
    expect(isApproximateMatch('pais vasco', ['País Vasco', 'Euskadi'])).toBe(true)
  })

  it('rechaza respuestas claramente incorrectas', () => {
    expect(isApproximateMatch('barcelona', ['Sevilla'])).toBe(false)
  })
})
