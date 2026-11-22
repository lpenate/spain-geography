// Proyección del mapa de ríos, lagos y mares de Europa. La comparten el generador del SVG y
// la herramienta que reproyecta el relieve de fondo, para que ambos encajen al píxel.

import { geoAzimuthalEqualArea } from 'd3-geo'

export const EUROPE_RIVERS_VIEWBOX = { width: 1000, height: 860 }

// Acimutal equivalente centrada en Europa (como la ETRS89-LAEA), ajustada para que entren
// Islandia, la Península Ibérica, los Urales y el Caspio.
const FRAME_POINTS = [
  [-24.5, 64.5],
  [-10.5, 35.2],
  [-6, 33.5],
  [36, 33],
  [59.5, 38.5],
  [61, 66],
  [27, 71.5],
]

export const europeRiversProjection = () =>
  geoAzimuthalEqualArea()
    .rotate([-18, -53])
    .fitExtent(
      [
        [12, 12],
        [EUROPE_RIVERS_VIEWBOX.width - 12, EUROPE_RIVERS_VIEWBOX.height - 12],
      ],
      { type: 'MultiPoint', coordinates: FRAME_POINTS },
    )
    .clipExtent([
      [0, 0],
      [EUROPE_RIVERS_VIEWBOX.width, EUROPE_RIVERS_VIEWBOX.height],
    ])
