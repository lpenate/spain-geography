"""Paso 2 de la reproyección del relieve de Europa.

Toma el relieve sombreado de Natural Earth (dominio público, sin textos):
  https://naciscdn.org/naturalearth/50m/raster/NE1_50M_SR_W.zip  (10800x5400, -180..180 / 90..-90)
y lo remuestrea (bilineal) sobre la rejilla [lon, lat] del paso 1.

Uso: python3 scripts/tools/europe-relief.py <NE1_50M_SR_W.zip> <rejilla.bin> <ancho> <alto> <salida.jpg>
Necesita Pillow y numpy.
"""

import io
import sys
import zipfile

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

zip_path, grid_path, width, height, output = sys.argv[1:6]
width, height = int(width), int(height)

with zipfile.ZipFile(zip_path) as archive:
    name = next(n for n in archive.namelist() if n.lower().endswith('.tif'))
    raster = np.asarray(Image.open(io.BytesIO(archive.read(name))).convert('RGB'), dtype=np.float32)

rows, cols = raster.shape[:2]
grid = np.fromfile(grid_path, dtype=np.float32).reshape(height, width, 2)
lon, lat = grid[..., 0], grid[..., 1]
outside = np.isnan(lon)

# Coordenadas continuas en el raster (centro del píxel = +0.5)
x = (np.nan_to_num(lon) + 180.0) / 360.0 * cols - 0.5
y = (90.0 - np.nan_to_num(lat)) / 180.0 * rows - 0.5
x0 = np.clip(np.floor(x).astype(int), 0, cols - 2)
y0 = np.clip(np.floor(y).astype(int), 0, rows - 2)
fx = np.clip(x - x0, 0, 1)[..., None]
fy = np.clip(y - y0, 0, 1)[..., None]

top = raster[y0, x0] * (1 - fx) + raster[y0, x0 + 1] * fx
bottom = raster[y0 + 1, x0] * (1 - fx) + raster[y0 + 1, x0 + 1] * fx
image = top * (1 - fy) + bottom * fy
image[outside] = 255

Image.fromarray(np.clip(image, 0, 255).astype(np.uint8)).save(
    output, quality=82, optimize=True, progressive=True
)
print(f'europe-relief: {width}x{height} -> {output}')
