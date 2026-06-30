/** Microestados con área SVG diminuta: aceptan clic en el país anfitrión. */
export const MICROSTATE_CLICK_ALIASES: Record<string, readonly string[]> = {
  andorra: ['espana', 'francia'],
  liechtenstein: ['suiza', 'austria'],
  'ciudad-del-vaticano': ['italia'],
  monaco: ['francia'],
}

export const MICROSTATE_SVG_PATH_IDS = new Set(Object.keys(MICROSTATE_CLICK_ALIASES))

export const MICROSTATE_PROXIMITY_RADIUS_PERCENT = 4

export const isMicrostateSvgPathId = (svgPathId: string): boolean =>
  MICROSTATE_SVG_PATH_IDS.has(svgPathId)

export const isClickQuizAnswerCorrect = (
  targetSvgPathId: string,
  clickedPathId: string,
): boolean => {
  if (clickedPathId === targetSvgPathId) return true

  const hostCountries = MICROSTATE_CLICK_ALIASES[targetSvgPathId]
  return hostCountries?.includes(clickedPathId) ?? false
}
