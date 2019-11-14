import { useEffect, useState } from 'react'
import { App, GlobalState } from 'reapex'
import { SagaIterator, Task } from 'redux-saga'
import { call, cancel, delay, fork, put, select } from 'redux-saga/effects'

import {
  DataLoaderProps,
  LoaderStatus,
  Meta,
  LoaderData,
  IntervalFunction,
  DataLoaderState,
  DataLoaderChildren,
  OptionalProps,
} from './dataloader.types'
import { defaultDataKeyFunc, isDataValid } from './utils'
import { init, start, loadSuccess, loadFailure } from './DataLoader.mutations'

const initialState: DataLoaderState = {
  data: {},
}

const defaultProps: OptionalProps = {
  cacheExpiresIn: 0,
  autoLoad: true,
  onSuccess: () => true,
  onFailure: () => true,
  interval: 0,
  shouldInterval: () => true,
  params: undefined,
  dataPersister: undefined,
  lazyLoad: false,
  dataKey: () => 'default',
}

const plugin = (app: App, namespace: string = '@@dataloader') => {
  const dataloader = app.model(namespace, initialState)

  const [mutations] = dataloader.mutations({
    init,
    start,
    loadSuccess,
    loadFailure,
  })

  const [effects] = dataloader.effects(
    {},
    {
      load: {
        *takeEvery(meta: Meta) {
          if (meta.interval) {
            yield call(runInInterval, fetchData, meta)
          } else {
            yield call(fetchData, meta)
          }
        },
      },
    }
  )

  function* runInInterval(func: IntervalFunction, meta: Meta): SagaIterator {
    const task: Task = yield fork(func, meta)
    yield delay(meta.interval)

    // cancel task if task is still running after interval
    if (task.isRunning()) {
      yield cancel(task)
    }

    if (meta.shouldInterval && meta.shouldInterval(task.result())) {
      yield call(runInInterval, func, meta)
    }
  }

  function* fetchData(meta: Meta) {
    const name = meta.name
    const key = meta.dataKey(meta.name, meta.params)

    let data: LoaderData = yield select(dataloader.selectors.data)
    const id = `${name}/${key}`

    const status = data[id]
    if (data && isDataValid(status, meta)) {
      return data
    }

    yield put(mutations.start(meta))

    try {
      if (meta.dataPersister) {
        data = meta.dataPersister.getItem(key, meta)
      }

      // when it's lazy load(data retrieved from cache, for example, localstorage)
      // then set data to state immediately
      if (data && meta.lazyLoad) {
        yield call(handleData, data, meta, false)
      }

      data = yield call(meta.apiCall, meta.params)
      yield call(handleData, data, meta, true)

      if (meta.dataPersister) {
        yield call(meta.dataPersister.setItem, key, data, meta)
      }
    } catch (e) {
      yield put(mutations.loadFailure(meta, e))

      if (meta.onFailure) {
        yield call(meta.onFailure, e)
      }
    }
    return data
  }

  function* handleData(data: any, meta: Meta, isFresh: boolean) {
    yield put(mutations.loadSuccess(meta, data, isFresh))

    if (meta.onSuccess) {
      yield call(meta.onSuccess, data)
    }
  }

  const getLoaderStatus = (state: GlobalState, ownProps: DataLoaderProps) => {
    const data = dataloader.selectors.data(state)
    const name = ownProps.name
    // TODO: refactor dataKey to use a string
    const key = ownProps.dataKey
      ? ownProps.dataKey(name, ownProps.params)
      : defaultDataKeyFunc(name, ownProps.params)
    const dataKey = `${name}/${key}`

    return {
      loaderStatus: data[dataKey],
    }
  }

  function useDataLoader<TData = any, TParams = any>(
    ownProps: DataLoaderProps
  ) {
    const [loaderStatus, setLoaderStatus] = useState<LoaderStatus<TData>>({
      data: null,
      loading: false,
      error: null,
    })
    const meta: Meta = { ...defaultProps, ...ownProps }
    useEffect(() => {
      function subscribeToStore() {
        const state = app.store.getState()
        const { loaderStatus: currentLoaderStatus } = getLoaderStatus(
          state,
          ownProps
        )
        if (loaderStatus !== currentLoaderStatus) {
          setLoaderStatus(currentLoaderStatus)
        }
      }

      const unsubscribe = app.store.subscribe(subscribeToStore)
      if (ownProps.autoLoad) {
        app.store.dispatch(mutations.init(meta))
      } else {
        app.store.dispatch(effects.load(meta))
      }

      return unsubscribe
    }, [])

    const load = (params?: TParams) =>
      params
        ? app.store.dispatch(effects.load({ ...meta, params }))
        : app.store.dispatch(effects.load({ ...meta }))

    return [loaderStatus, load] as [LoaderStatus, typeof load]
  }

  function DataLoader<TData = any, TParams = any>(
    ownProps: DataLoaderProps<TData, TParams> &
      DataLoaderChildren<TData, TParams>
  ) {
    const { children, ...props } = ownProps
    const [loaderStatus, load] = useDataLoader(props)
    return children && children({ ...loaderStatus, load })
  }

  return {
    DataLoader,
    mutations,
    load: effects.load,
    model: dataloader,
    useDataLoader,
  }
}

export default plugin
