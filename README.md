### Reapex dataloader plugin

```typescript
import { App } from 'reapex'
import dataloaderPlugin from 'reapex-plugin-dataloader'

const app = new App()

// 1. register the plugin
export const {DataLoader, mutations, effects, model} = app.use(dataloaderPlugin)

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
