import type { GentilicioDataset } from '@/types/gentilicio'
import { assetUrl } from '@/utils/assetUrl'

export const fetchGentilicioDataset = async (): Promise<GentilicioDataset> => {
  const response = await fetch(assetUrl('/data/spain-gentilicios.json'))

  if (!response.ok) {
    throw new Error('No se pudo cargar el dataset de gentilicios')
  }

  return response.json() as Promise<GentilicioDataset>
}
