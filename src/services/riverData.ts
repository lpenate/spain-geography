import type { RiverDataset } from '@/types/river'
import { assetUrl } from '@/utils/assetUrl'

export const fetchRiverDataset = async (dataUrl: string): Promise<RiverDataset> => {
  const response = await fetch(assetUrl(dataUrl))

  if (!response.ok) {
    throw new Error('No se pudo cargar el mapa de ríos')
  }

  return response.json() as Promise<RiverDataset>
}
