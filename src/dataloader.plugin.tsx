import { App, GlobalState } from 'reapex'
import {DataLoaderComponent, defaultProps} from './DataLoader';
import {DataLoaderProps, DispatchProps, LoaderStatus, Meta, StateProps} from './dataloader.types';
import {SagaIterator, Task} from 'redux-saga';
import {call, cancel, delay, fork, put, select} from 'redux-saga/effects';
import {defaultDataKeyFunc, isDataValid} from './utils';
import {useEffect, useState} from 'react';

import {connect} from 'react-redux';

type IntervalFunction = (meta: Meta) => any

export interface DataLoaderState {
  [key: string]: LoaderStatus
}

const initialState = {
  data: {} as DataLoaderState
}

const plugin = (app: App, namespace: string = '@@dataloader') => {
  const dataloader = app.model(namespace, initialState)

  const [mutations] = dataloader.mutations({
    init: (meta: Meta) => s => {
      const name = meta.name
      const key = meta.dataKey(name, meta.params)
      const updated = update(name, key, s.data, {
        data: null,
        loading: false,
        error: null,
      })
      return s.set('data', updated)
    },
    start: (meta: Meta) => s => {
      const name = meta.name
      const key = meta.dataKey(name, meta.params)
      const updated = update(name, key, s.data, { loading: true })
      return s.set('data', updated)
    },
    loadSuccess: (meta: Meta, data: any, isFresh: boolean) => s => {
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
    },
    loadFailure: (meta: Meta, error: Error) => s => {
      const name = meta.name
      const key = meta.dataKey(name, meta.params)

      const updated = update(name, key, s.data, {
        error,
        loading: false,
        lastErrorTime: Date.now(),
      })
      return s.set('data', updated)
    },
  })

  const [effects] = dataloader.effects({}, {
    load: {
      *takeEvery(meta: Meta) {
        if (meta.interval) {
          yield call(runInInterval, fetchData, meta)
        } else {
          yield call(fetchData, meta)
        }
      }
    }
  })

  function update (name: string, key: string, state: DataLoaderState, data: Partial<LoaderStatus>): DataLoaderState {
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

    let data: DataLoaderState = yield select(dataloader.selectors.data)
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

  const mapStateToProps = (state: GlobalState, ownProps: DataLoaderProps) => {
    const data = dataloader.selectors.data(state)
    const name = ownProps.name
    // TODO: refactor dataKey to use a string
    const key = ownProps.dataKey ? ownProps.dataKey(name, ownProps.params) : defaultDataKeyFunc(name, ownProps.params)
    const dataKey = `${name}/${key}`

    return {
      loaderStatus: data[dataKey],
    }
  }

  const mergeProps = (stateProps: StateProps, dispatchProps: DispatchProps, ownProps: DataLoaderProps) => {
    return {
      ...stateProps,
      ...dispatchProps,
      ...ownProps,
      dataKey: ownProps.dataKey || defaultDataKeyFunc,
    }
  }

  const DataLoader = connect(mapStateToProps, { load: effects.load, init: mutations.init }, mergeProps)(DataLoaderComponent)

  function useDataLoader<TData = any, TParams = any>(ownProps: DataLoaderProps) {
    const [loaderStatus, setLoaderStatus] = useState<LoaderStatus<TData>>({data: null, loading: false, error: null})
    const meta: Meta = { ...defaultProps, ...ownProps }
    useEffect(() => {
      function subscribeToStore() {
        const state = app.store.getState()
        const {loaderStatus: currentLoaderStatus} = mapStateToProps(state, ownProps)
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

    const load = (params: TParams) => app.store.dispatch(effects.load({ ...meta, params }))

    return [loaderStatus, load] as [LoaderStatus, typeof load]
  }

  return {
    DataLoader,
    mutations,
    effects,
    model: dataloader,
    useDataLoader,
  }
}


export default plugin
