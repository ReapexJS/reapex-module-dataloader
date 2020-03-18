import { App } from 'reapex'
import { createLogger } from 'redux-logger'

import dataloaderPlugin from '../src'

const logger = createLogger({
  stateTransformer: (state: any) => state.toJS(),
})

const app = new App({ middlewares: [logger] })

export const {
  mutations,
  load,
  model,
  useDataLoader,
  useLazyDataLoader,
} = app.plugin(dataloaderPlugin)

export default app
