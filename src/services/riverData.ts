import type { RiverDataset } from '@/types/river'
import { assetUrl } from '@/utils/assetUrl'

export const fetchRiverDataset = async (): Promise<RiverDataset> => {
  const response = await fetch(assetUrl('/data/spain-rios.json'))

  if (!response.ok) {
    throw new Error('No se pudo cargar el mapa de ríos')
  }

  return response.json() as Promise<RiverDataset>
}
