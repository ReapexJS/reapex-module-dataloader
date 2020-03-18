import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { App } from 'reapex'
import { SagaIterator, Task } from 'redux-saga'
import { call, cancel, delay, fork, put, select } from 'redux-saga/effects'

import { init, loadFailure, loadSuccess, start } from './DataLoader.mutations'
import {
  DataLoaderProps,
  DataLoaderState,
  LoaderData,
  LoaderStatus,
  Meta,
  OptionalProps,
} from './dataloader.types'
import { defaultDataKeyFunc, isDataValid } from './utils'

const initialState: DataLoaderState = {
  data: {},
}

const defaultProps: OptionalProps = {
  ttl: 0,
  onSuccess: () => true,
  onFailure: () => true,
  interval: 0,
  shouldInterval: () => true,
  params: undefined,
  dataPersister: undefined,
  lazyLoad: false,
  dataKey: defaultDataKeyFunc,
}

const plugin = (app: App, namespace: string = '@@dataloader') => {
  const dataloader = app.model(namespace, initialState)
  const tasks: Record<string, Task> = {}

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
          // cancel the existing task to avoid racing condition
          if (tasks[meta.name] && tasks[meta.name].isRunning()) {
            tasks[meta.name].cancel()
          }
          const task: Task = yield fork(runFetch, meta)
          tasks[meta.name] = task
        },
      },
    }
  )

  function* runFetch(meta: Meta): SagaIterator {
    const task: Task = yield fork(fetchData, meta)
    if (meta.interval) {
      yield delay(meta.interval)

      // cancel task if task is still running after interval
      if (task.isRunning()) {
        yield cancel(task)
      }

      if (meta.shouldInterval && meta.shouldInterval(task.result())) {
        yield fork(runFetch, meta)
      }
    }
  }

  function* fetchData(meta: Meta) {
    const key = meta.dataKey(meta.name, meta.params)

    let data: LoaderData = yield select(dataloader.selectors.data)

    const status = data[key]
    if (data && isDataValid(status, meta)) {
      return data
    }

    yield put(mutations.start(meta))

    try {
      if (meta.dataPersister) {
        data = yield call(meta.dataPersister.getItem, key, meta)
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

  function useDataLoader<TData, TParams = never>(
    ownProps: DataLoaderProps<TData, TParams>
  ) {
    const meta: Meta = { ...defaultProps, ...ownProps }
    const dispatch = useDispatch()
    const data = useSelector(dataloader.selectors.data)

    const key = ownProps.dataKey
      ? ownProps.dataKey(ownProps.name, ownProps.params)
      : defaultDataKeyFunc(ownProps.name, ownProps.params)
    const loaderStatus: LoaderStatus<TData> = data[key] || {
      data: null,
      loading: false,
      error: null,
    }

    useEffect(() => {
      dispatch(effects.load(meta))
    }, [key])

    return loaderStatus
  }

  function useLazyDataLoader<TData, TParams = never>(
    ownProps: DataLoaderProps<TData, TParams>
  ) {
    const meta: Meta = { ...defaultProps, ...ownProps }
    const dispatch = useDispatch()
    const data = useSelector(dataloader.selectors.data)

    const key = ownProps.dataKey
      ? ownProps.dataKey(ownProps.name, ownProps.params)
      : defaultDataKeyFunc(ownProps.name, ownProps.params)
    const loaderStatus: LoaderStatus<TData> = data[key] || {
      data: null,
      loading: false,
      error: null,
    }

    const load = useCallback(
      (params?: TParams) => {
        // keep meta.params if manual function call didn't pass params
        if (params) {
          return dispatch(effects.load({ ...meta, params }))
        } else {
          return dispatch(effects.load(meta))
        }
      },
      [key]
    )
    return [loaderStatus, load] as [LoaderStatus<TData>, typeof load]
  }

  return {
    mutations,
    load: effects.load,
    model: dataloader,
    useDataLoader,
    useLazyDataLoader,
  }
}

export default plugin
