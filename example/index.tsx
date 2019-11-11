import app, { DataLoader } from './app'

import {Loader} from '../src/dataloader.types';
import { Provider } from 'react-redux';
import React from 'react'
import { render } from 'react-dom';

const mockApi = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(Math.random()), 1000)
  })
}

const store = app.createStore()
render(
  <Provider store={store}>
    <>
      <DataLoader name="api1" apiCall={mockApi}>
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
    </>
  </Provider>,
  document.getElementById('root')
)
