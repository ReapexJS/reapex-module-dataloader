### Reapex modal plugin

```typescript
import { App } from 'reapex'
import modalPlugin from 'reapex-plugin-modal'

const app = new App()

// 1. register the plugin
const modal = app.plugin(modalPlugin, '@@modals')

// 2. add the modal component to your React application root
<Provider store={store}>
  <modal.Component />
</Provider>

// show/hide any component
store.dispatch(modal.mutations.show('modal1', SomeComponent, props))
store.dispatch(modal.mutations.hide('modal1'))
```
