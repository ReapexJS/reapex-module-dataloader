import {DataLoaderComponentProps, DispatchProps, OptionalProps, StateProps} from './dataloader.types';

import React from 'react'

export const defaultProps: OptionalProps = {
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

export class DataLoaderComponent<TData = any, TParams = any> extends React.PureComponent<DataLoaderComponentProps<TData, TParams> & StateProps<TData> & DispatchProps<TData, TParams>, {}> {
  static defaultProps = defaultProps

  componentWillMount() {
    const { load, init, loaderStatus, children, ...meta } = this.props;
    if (meta.autoLoad) {
      load(meta)
    } else {
      init(meta)
    }
  }

  render() {
    const { load, init, loaderStatus, children, ...meta } = this.props
    if (loaderStatus) {
      // TODO: pass params to load()
      return children({ ...loaderStatus, load: () => load(meta) })
    }
    return null
  }
}
