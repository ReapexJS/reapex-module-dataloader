import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'

import app, { DataLoader, useDataLoader } from './app'
import { Loader } from '../src/dataloader.types'

interface GithubItem {
  full_name: string
  url: string
}

interface GithubSearchResult {
  items: GithubItem[]
}

const mockApi = () => {
  return new Promise(resolve => {
    setTimeout(() => resolve(Math.random()), 1000)
  })
}

const searchGithubRepo = async (query: string) => {
  const res = await fetch(
    `https://api.github.com/search/repositories?q=${query.split(' ').join('+')}`
  )
  return res.json()
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
      <p>
        <b>DataLoader basic example</b>
      </p>
      <DataLoader name="api1" apiCall={searchGithubRepo} params="react">
        {(loader: Loader<GithubSearchResult>) => {
          if (loader.loading) {
            return <div>loading...</div>
          }
          if (loader.error) {
            console.log(loader.error)
            return <div>Error!!!</div>
          }
          if (!loader.data) {
            return 'no data'
          }
          return (
            <div>
              {loader.data.items.slice(0, 10).map(item => {
                return <p>{item.full_name}</p>
              })}
              <div>
                <button onClick={() => loader.load()}>reload</button>
              </div>
            </div>
          )
        }}
      </DataLoader>
      <hr />
      <p>
        <b>DataLoader hook example</b>
      </p>
      <LoaderWithHook />
    </>
  </Provider>,
  document.getElementById('root')
)
