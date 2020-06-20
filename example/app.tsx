import { App } from 'reapex'
import { createLogger } from 'redux-logger'

import dataloader from '../src'

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
} = app.use(dataloader)

export default app
