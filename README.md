### Reapex dataloader plugin

## register the plugin

```typescript
import { App } from 'reapex'
import dataloaderPlugin from 'reapex-plugin-dataloader'

const app = new App()
// 1. register the plugin
export const {DataLoader, mutations, effects, model} = app.use(dataloaderPlugin)
```

## Option 1: Use DataLoader component
```typescript

// 2. use DataLoader component
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
```

## Option 2: Use react hooks
```typescript
const LoaderWithHook: React.FC = () => {
  const [loaderStatus] = useDataLoader<number>({
    name: 'api2',
    apiCall: mockApi,
  })

  if (loaderStatus.loading) {
    return <div>loading...</div>
  }
  if (loaderStatus.error) {
    return <div>Error!!!</div>
  }
  return <div>{loaderStatus.data ? loaderStatus.data : 'No Data!'}</div>
}
```

## API
`DataLoaderProps`: The `props` of `DataLoader` component and `useDataloader` hook function

| Property | Description | Type | Default | Required |
| --- | --- | --- | --- | --- |
| name | The key of the data stored in redux state, has to be unique if `dataKey` is not provided | `string` | - | Yes |
| apiCall | A function that returns promise | `(params?: TPramas) => Promise<any>` | - | Yes |
| autoLoad | Start to load data when component mount if `true` | `boolean` | `true` | No |
| interval | Fetch data in an interval if given a none 0(ms) number | `boolean` | `0` | No |
| params | The parameters that passed to `apiCall` function | `TParams = any` | `undefined` | No |
| dataKey | Function that compute a dynamic key based on params | `(name: string, params?: TParams) => string` | `() => 'default'` | No |
| ttl | How much time the cache will valid before making a new data fetching, default 0, no cache. The `apiCall` function will be called every time | `number` | `0` | No |
| shouldInterval | A function the returns `true/false` to determine whether the interval function call should continue or not | `(data?: TData) => boolean` | `() => true` | No |
| onSuccess | A function will get called when `apiCall` run successfully | `(data?: TData) => any` | - | No |
| onFailure | A function will get called when `apiCall` throw an exception | `(error?: Error) => any` | - | No |
| dataPersister | An object that configures how to persist the data | `DataPersister` | - | No |
| lazyLoad | if `dataPersister` is configured, it will first use the data from persister then call `apiCall` to refresh the data | `boolean` | - | No |

## `useDataLoader()` hook
```ts
useDataLoader: <TData = any, TParams = any>(props: DataLoaderProps) => [LoaderStatus, LoadActionCreator]
```

## `DataLoader` child function
```ts
(loader: LoaderStatus & {load: LoadActionCreator}) => JSX.Element | null
```


### `props: DataLoaderProps`
The `props: DataLoaderProps` are defined in the table above.

### `LoaderStatus`
| Property | Description | Type |
| --- | --- | --- |
| data | The data that reuturned by `apiCall` | `TData` |
| loading | `true` when data is loading, otherwise `false` | `boolean` |
| error | An `Error` object if `apiCall` threw exception | `Error` |
| lastUpdateTime | The timestamp of last time when receiving the data from `apiCall` | `number` | undefined` |
| lastErrorTime | The timestamp of last time when `apiCall` threw an exception | `number` | undefined` |

### `LoadActionCreator`
```ts
load: (params?: TParams) => any
```
A function to call with `params` which will trigger the `apiCall`

## DataPersister
```ts
export interface DataPersister {
  getItem: (key: string, meta?: Meta) => any
  setItem: (key: string, value: any, meta?: Meta) => any
  removeItem: (key: string, meta?: Meta) => any
}
```

For example, localStorage data persister:
```ts
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
```
