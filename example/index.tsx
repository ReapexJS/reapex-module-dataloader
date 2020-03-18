import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'

import app, { useDataLoader, useLazyDataLoader } from './app'

interface GithubItem {
  full_name: string
  url: string
}

interface GithubSearchResult {
  items: GithubItem[]
}

const mockApi = () => {
  return new Promise<number>(resolve => {
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
  const loaderStatus = useDataLoader({
    name: 'api2',
    apiCall: mockApi,
    interval: 300000,
  })

  if (loaderStatus.loading) {
    return <div>loading...</div>
  }
  if (loaderStatus.error) {
    return <div>Error!!!</div>
  }
  return <div>{loaderStatus.data ? loaderStatus.data : 'No Data!'}</div>
}

const LoaderWithManualCall: React.FC = () => {
  const [loaderStatus, load] = useLazyDataLoader<GithubSearchResult, string>({
    name: 'api1',
    apiCall: searchGithubRepo,
    params: 'react',
    interval: 3000,
  })

  return (
    <div>
      {loaderStatus.data?.items.slice(0, 10).map(item => {
        return <p>{item.full_name}</p>
      })}
      {loaderStatus.error && <div>Error!!!</div>}
      {loaderStatus.loading && <div>loading...</div>}
      <div>
        <button onClick={() => load('react')}>reload</button>
      </div>
    </div>
  )
}

const store = app.createStore()
render(
  <Provider store={store}>
    <>
      <p>
        <b>DataLoader basic example</b>
      </p>
      <LoaderWithManualCall />
      <hr />
      <p>
        <b>DataLoader hook example</b>
      </p>
      <LoaderWithHook />
    </>
  </Provider>,
  document.getElementById('root')
)
