const QUIZ_COLOR_PALETTE = [
  '#e11d48',
  '#ea580c',
  '#d97706',
  '#ca8a04',
  '#65a30d',
  '#16a34a',
  '#0d9488',
  '#0891b2',
  '#2563eb',
  '#4f46e5',
  '#7c3aed',
  '#9333ea',
  '#c026d3',
  '#db2777',
  '#be123c',
]

const shuffle = <T>(values: T[]): T[] => [...values].sort(() => Math.random() - 0.5)

export const assignQuizItemColors = (itemIds: string[]): Record<string, string> => {
  const palette = shuffle(QUIZ_COLOR_PALETTE)

  return Object.fromEntries(
    itemIds.map((itemId, index) => [itemId, palette[index % palette.length]]),
  )
}

export const withAlpha = (hexColor: string, alpha: number): string => {
  const normalized = hexColor.replace('#', '')
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized

  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}
