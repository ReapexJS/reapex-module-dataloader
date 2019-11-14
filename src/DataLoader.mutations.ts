import { State } from 'reapex'
import {
  Meta,
  LoaderData,
  LoaderStatus,
  DataLoaderState,
} from './dataloader.types'

export const init = (meta: Meta) => (s: State<{ data: LoaderData }>) => {
  const name = meta.name
  const key = meta.dataKey(name, meta.params)
  const updated = update(name, key, s.data, {
    data: null,
    loading: false,
    error: null,
  })
  return s.set('data', updated)
}

export const start = (meta: Meta) => (s: State<DataLoaderState>) => {
  const name = meta.name
  const key = meta.dataKey(name, meta.params)
  const updated = update(name, key, s.data, { loading: true })
  return s.set('data', updated)
}

export const loadSuccess = (meta: Meta, data: any, isFresh: boolean) => (
  s: State<DataLoaderState>
) => {
  const name = meta.name
  const key = meta.dataKey(name, meta.params)

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

  const updated = update(name, key, s.data, status)
  return s.set('data', updated)
}

export const loadFailure = (meta: Meta, error: Error) => (
  s: State<DataLoaderState>
) => {
  const name = meta.name
  const key = meta.dataKey(name, meta.params)

  const updated = update(name, key, s.data, {
    error,
    loading: false,
    lastErrorTime: Date.now(),
  })
  return s.set('data', updated)
}

function update(
  name: string,
  key: string,
  state: LoaderData,
  data: Partial<LoaderStatus>
): LoaderData {
  const id = `${name}/${key}`
  let dataStorage = state[id]
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

  return { ...state, [id]: dataStorage }
}
