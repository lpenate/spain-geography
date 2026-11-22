// Utilidades de geometría compartidas por los generadores de mapas hidrográficos.
// Todas trabajan con polilíneas [[x, y], ...] en unidades del viewBox.

// Une tramos por sus extremos más cercanos (hasta `gap`) para obtener recorridos continuos
export const mergeLines = (input, gap) => {
  const lines = input.filter((line) => line.length > 1).map((line) => [...line])
  const distance = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1])

  for (;;) {
    let best = null
    for (let i = 0; i < lines.length; i += 1) {
      for (let j = i + 1; j < lines.length; j += 1) {
        const a = lines[i]
        const b = lines[j]
        const options = [
          [distance(a.at(-1), b[0]), () => [...a, ...b]],
          [distance(a.at(-1), b.at(-1)), () => [...a, ...[...b].reverse()]],
          [distance(a[0], b.at(-1)), () => [...b, ...a]],
          [distance(a[0], b[0]), () => [...[...b].reverse(), ...a]],
        ]
        for (const [d, join] of options) {
          if (d <= gap && (!best || d < best.d)) best = { d, i, j, join }
        }
      }
    }
    if (!best) return lines
    lines[best.i] = best.join()
    lines.splice(best.j, 1)
  }
}

export const simplify = (points, tolerance) => {
  if (points.length < 3) return points
  const [x1, y1] = points[0]
  const [x2, y2] = points.at(-1)
  const length = Math.hypot(x2 - x1, y2 - y1) || 1e-9
  let index = 0
  let maxDistance = 0
  for (let k = 1; k < points.length - 1; k += 1) {
    const [x, y] = points[k]
    const distance = Math.abs((x2 - x1) * (y1 - y) - (x1 - x) * (y2 - y1)) / length
    if (distance > maxDistance) {
      index = k
      maxDistance = distance
    }
  }
  if (maxDistance <= tolerance) return [points[0], points.at(-1)]
  return [
    ...simplify(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(index), tolerance),
  ]
}

export const fmt = (n) => Number(n.toFixed(2)).toString()

// Catmull-Rom -> Bézier cúbica: curvas suaves, sin segmentos rectos
export const smoothPath = (points, closed = false) => {
  if (points.length < 3) return `M${points.map((p) => p.map(fmt).join(',')).join('L')}`
  const ring = closed
    ? [points.at(-1), ...points, points[0], points[1]]
    : [points[0], ...points, points.at(-1)]
  const last = closed ? points.length : points.length - 1
  let d = `M${fmt(points[0][0])},${fmt(points[0][1])}`
  for (let i = 1; i <= last; i += 1) {
    const [p0, p1, p2, p3] = [ring[i - 1], ring[i], ring[i + 1], ring[i + 2]]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${fmt(c1[0])},${fmt(c1[1])} ${fmt(c2[0])},${fmt(c2[1])} ${fmt(p2[0])},${fmt(p2[1])}`
  }
  return closed ? `${d}Z` : d
}

export const polylineLength = (points) =>
  points
    .slice(1)
    .reduce((sum, p, i) => sum + Math.hypot(p[0] - points[i][0], p[1] - points[i][1]), 0)

export const pointAlong = (points, fraction) => {
  const target = polylineLength(points) * fraction
  let walked = 0
  for (let i = 1; i < points.length; i += 1) {
    const segment = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1])
    if (walked + segment >= target) {
      const r = segment === 0 ? 0 : (target - walked) / segment
      return [
        points[i - 1][0] + (points[i][0] - points[i - 1][0]) * r,
        points[i - 1][1] + (points[i][1] - points[i - 1][1]) * r,
      ]
    }
    walked += segment
  }
  return points.at(-1)
}

export const bboxOf = (lines) => {
  const all = lines.flat()
  const xs = all.map((p) => p[0])
  const ys = all.map((p) => p[1])
  return {
    x0: Math.min(...xs),
    y0: Math.min(...ys),
    x1: Math.max(...xs),
    y1: Math.max(...ys),
  }
}
