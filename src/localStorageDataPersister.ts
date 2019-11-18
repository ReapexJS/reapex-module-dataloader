import { DataPersister } from './dataloader.types'

export const LocalStorageDataPersister = (): DataPersister => {
  const getItem = (key: string) => {
    const data = localStorage.getItem(key)
    return data && JSON.parse(data)
  }

  const setItem = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value))
  }

  const removeItem = (key: string) => {
    localStorage.removeItem(key)
  }

  return {
    getItem,
    setItem,
    removeItem,
  }
}
