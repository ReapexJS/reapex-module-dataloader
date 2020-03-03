import { State } from 'reapex'

import {
  DataLoaderState,
  LoaderData,
  LoaderStatus,
  Meta,
} from './dataloader.types'

export const init = (meta: Meta) => (s: State<{ data: LoaderData }>) => {
  const key = meta.dataKey(meta.name, meta.params)
  const updated = update(key, s.data, {
    data: null,
    loading: false,
    error: null,
  })
  return s.set('data', updated)
}

export const start = (meta: Meta) => (s: State<DataLoaderState>) => {
  const key = meta.dataKey(meta.name, meta.params)
  const updated = update(key, s.data, { loading: true })
  return s.set('data', updated)
}

export const loadSuccess = (meta: Meta, data: any, isFresh: boolean) => (
  s: State<DataLoaderState>
) => {
  const key = meta.dataKey(meta.name, meta.params)

  let status: Partial<LoaderStatus> = {
    data,
    error: null,
    lastUpdateTime: Date.now(),
  }

  if (isFresh) {
    status = {
      ...status,
      loading: false,
    }
  }

  const updated = update(key, s.data, status)
  return s.set('data', updated)
}

export const loadFailure = (meta: Meta, error: Error) => (
  s: State<DataLoaderState>
) => {
  const key = meta.dataKey(meta.name, meta.params)

  const updated = update(key, s.data, {
    error,
    loading: false,
    lastErrorTime: Date.now(),
  })
  return s.set('data', updated)
}

function update(
  key: string,
  state: LoaderData,
  data: Partial<LoaderStatus>
): LoaderData {
  let dataStorage = state[key]
  // initialize with default values if data NOT exist
  if (!dataStorage) {
    dataStorage = {
      data: null,
      loading: false,
      error: null,
    }
  }

  // update the state with data
  dataStorage = {
    ...dataStorage,
    ...data,
  }

  return { ...state, [key]: dataStorage }
}
