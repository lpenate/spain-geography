const ACCENT_MAP: Record<string, string> = {
  á: 'a',
  à: 'a',
  ä: 'a',
  â: 'a',
  é: 'e',
  è: 'e',
  ë: 'e',
  ê: 'e',
  í: 'i',
  ì: 'i',
  ï: 'i',
  î: 'i',
  ó: 'o',
  ò: 'o',
  ö: 'o',
  ô: 'o',
  ú: 'u',
  ù: 'u',
  ü: 'u',
  û: 'u',
  ñ: 'n',
  ç: 'c',
}

export const normalizeAnswer = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[áàäâéèëêíìïîóòöôúùüûñç]/g, (char) => ACCENT_MAP[char] ?? char)
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const levenshteinDistance = (left: string, right: string): number => {
  const matrix = Array.from({ length: left.length + 1 }, () =>
    Array<number>(right.length + 1).fill(0),
  )

  for (let row = 0; row <= left.length; row += 1) matrix[row][0] = row
  for (let col = 0; col <= right.length; col += 1) matrix[0][col] = col

  for (let row = 1; row <= left.length; row += 1) {
    for (let col = 1; col <= right.length; col += 1) {
      const substitutionCost = left[row - 1] === right[col - 1] ? 0 : 1
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + substitutionCost,
      )
    }
  }

  return matrix[left.length][right.length]
}

const similarityRatio = (left: string, right: string): number => {
  if (!left.length && !right.length) return 1
  const distance = levenshteinDistance(left, right)
  const maxLength = Math.max(left.length, right.length)
  return 1 - distance / maxLength
}

const matchesCandidate = (userAnswer: string, candidate: string, threshold: number): boolean => {
  const normalizedUser = normalizeAnswer(userAnswer)
  const normalizedCandidate = normalizeAnswer(candidate)

  if (!normalizedUser || !normalizedCandidate) return false
  if (normalizedUser === normalizedCandidate) return true

  const ratio = similarityRatio(normalizedUser, normalizedCandidate)
  if (ratio >= threshold) return true

  return (
    normalizedCandidate.includes(normalizedUser) || normalizedUser.includes(normalizedCandidate)
  )
}

export const isApproximateMatch = (
  userAnswer: string,
  expectedAnswers: string[],
  threshold = 0.82,
): boolean =>
  expectedAnswers.some((candidate) => matchesCandidate(userAnswer, candidate, threshold))

export const isCloseMatch = (
  userAnswer: string,
  expectedAnswers: string[],
  threshold = 0.82,
): boolean => {
  const normalizedUser = normalizeAnswer(userAnswer)
  if (!normalizedUser) return false

  return expectedAnswers.some((candidate) => {
    const normalizedCandidate = normalizeAnswer(candidate)
    if (!normalizedCandidate) return false
    if (normalizedUser === normalizedCandidate) return true

    // Evita confusiones entre lugares cercanos (p. ej. Palencia / Valencia).
    if (normalizedUser[0] !== normalizedCandidate[0]) return false

    return similarityRatio(normalizedUser, normalizedCandidate) >= threshold
  })
}
