import { App } from 'reapex'
import dataloaderPlugin from '../src'

const app = new App()

export const {DataLoader, mutations, effects, model, useDataLoader} = app.plugin(dataloaderPlugin)

export default app
