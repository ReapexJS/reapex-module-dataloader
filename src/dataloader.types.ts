export interface DataPersister {
  getItem: (key: string, meta?: Meta) => any
  setItem: (key: string, value: any, meta?: Meta) => void
  removeItem: (key: string, meta?: Meta) => void
}

export interface MandatoryProps<TParams = any> {
  name: string
  apiCall: (params?: TParams) => Promise<any>
}

export interface OptionalProps<TData = any, TParams = any> {
  cacheExpiresIn: number
  autoLoad: boolean
  onSuccess: (data?: TData) => any
  onFailure: (error?: Error) => any
  interval: number
  shouldInterval: (data?: TData) => boolean
  params: TParams
  dataPersister: DataPersister | undefined
  lazyLoad: boolean
  dataKey: (name: string, params?: TParams) => string
}

export interface Meta<TData = any, TParams = any>
  extends MandatoryProps<TParams>,
    OptionalProps<TData, TParams> {}

export interface LoaderStatus<TData = any> {
  data: TData | null
  loading: boolean
  error: Error | null
  lastUpdateTime?: number
  lastErrorTime?: number
}

export interface Loader<TData = any, TParams = any>
  extends LoaderStatus<TData> {
  load: (params?: TParams) => any
}

export type DataLoaderProps<TData = any, TParams = any> = MandatoryProps<
  TParams
> &
  Partial<OptionalProps<TData, TParams>>

export interface StateProps<TData = any> {
  loaderStatus?: LoaderStatus<TData>
}

export interface DispatchProps<TData = any, TParams = any> {
  load: (meta: Meta<TData, TParams>) => any
  init: (meta: Meta<TData, TParams>) => any
}

export interface DataLoaderComponentProps<TData = any, TParams = any>
  extends MandatoryProps<TParams>,
    OptionalProps<TData, TParams> {
  children: (loader: Loader<TData, TParams>) => React.ReactNode
}
