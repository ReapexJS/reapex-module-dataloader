import { LoaderStatus, Meta } from './dataloader.types'

export const isDataValid = (data: LoaderStatus, meta: Meta): boolean => {
  const ttl = meta.ttl ? meta.ttl : 0
  if (data && Date.now() - data.lastUpdateTime! < ttl) {
    return true
  }
  return false
}

export const defaultDataKeyFunc = (name: string, params?: any) =>
  `${name}/${params ? queryString(params) : 'default'}`

export const queryString = (params: any) => {
  if (Object.prototype.toString.call(params) === '[object Object]') {
    return Object.keys(params)
      .map(key => {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
      })
      .join('&')
  }
  return encodeURIComponent(params)
}
