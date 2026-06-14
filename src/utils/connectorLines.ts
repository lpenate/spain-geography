export interface ConnectorPoint {
  x: number
  y: number
}

export interface ConnectorSegment {
  start: ConnectorPoint
  end: ConnectorPoint
}

export const MARKER_LINE_CLEARANCE = 20

export const shortenLineFromEnd = (
  start: ConnectorPoint,
  end: ConnectorPoint,
  offset = MARKER_LINE_CLEARANCE,
): ConnectorSegment => {
  const deltaX = end.x - start.x
  const deltaY = end.y - start.y
  const distance = Math.hypot(deltaX, deltaY)

  if (distance <= offset) {
    return { start, end }
  }

  const ratio = (distance - offset) / distance

  return {
    start,
    end: {
      x: start.x + deltaX * ratio,
      y: start.y + deltaY * ratio,
    },
  }
}
