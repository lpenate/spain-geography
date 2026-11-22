# Geometría de ríos y lagos (OpenStreetMap)

- `rios-lagos-nominatim*.json`: respuesta de Nominatim (OSM) para los 45 ríos y 5 lagos del libro, descargada una sola vez el 22-11-2026 a 1 petición/s. Datos © colaboradores de OpenStreetMap, licencia ODbL 1.0.
- `calibracion-proyeccion.json`: transformación lon/lat → coordenadas del `viewBox` de `spain-physical.svg` (polinomio de 2.º grado, origen −3,7 / 40,0). Ajustada por ICP con 13 ríos ya trazados en el SVG; error medio ≈ 0,5 unidades.
- Calibración reproducible con `python3 scripts/tools/rivers-calib.py && python3 scripts/tools/rivers-calib2.py` (desde la raíz). Se excluyeron del ajuste los trazados mal identificados (Guadiana, Turia, Genil) y se descartan puntos con error > 4 unidades.
- El mapa final lo genera `node scripts/build-rivers-svg.mjs`.
