import { LoaderStatus, Meta } from './dataloader.types'

export const isDataValid = (data: LoaderStatus, meta: Meta): boolean => {
  const ttl = meta.ttl ? meta.ttl : 0
  if (data && Date.now() - data.lastUpdateTime! < ttl) {
    return true
  }
  return false
}

export const defaultDataKeyFunc = (_: string, __?: any) => `default`
