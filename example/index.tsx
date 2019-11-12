import app, { DataLoader, useDataLoader } from './app'

import {Loader} from '../src/dataloader.types';
import { Provider } from 'react-redux';
import React from 'react'
import { render } from 'react-dom';

const mockApi = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(Math.random()), 1000)
  })
}

const LoaderWithHook: React.FC = () => {
  const [loaderStatus] = useDataLoader<number>({
    name: 'api2',
    apiCall: mockApi,
    interval: 3000,
  })

  if (loaderStatus.loading) {
    return <div>loading...</div>
  }
  if (loaderStatus.error) {
    return <div>Error!!!</div>
  }
  return <div>{loaderStatus.data ? loaderStatus.data : 'No Data!'}</div>
}

const store = app.createStore()
render(
  <Provider store={store}>
    <>
      <DataLoader name="api1" apiCall={mockApi} interval={3000}>
      {
        (loader: Loader<number>) => {
          if (loader.loading) {
            return <div>loading...</div>
          }
          if (loader.error) {
            return <div>Error!!!</div>
          }
          return <div>{loader.data ? loader.data : 'No Data!'}</div>
        }
      }
      </DataLoader>
      <p>DataLoader hook example</p>
      <LoaderWithHook />
    </>
  </Provider>,
  document.getElementById('root')
)
