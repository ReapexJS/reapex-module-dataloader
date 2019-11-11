import {LoaderStatus, Meta} from './dataloader.types';

export const isDataValid = (data: LoaderStatus, meta: Meta): boolean => {
  const cacheExpiresIn = meta.cacheExpiresIn ? meta.cacheExpiresIn : 0
  if (data && (Date.now() - data.lastUpdateTime!) < cacheExpiresIn) {
    return true
  }
  return false
}

export const defaultDataKeyFunc = (_: string, __?: any) => `default`
