import Store from 'electron-store'
export const store = new Store({
  schema: {
    settings: {
      type: 'object',
      properties: {
        calibControlFactor: {
          type: 'number',
          default: 1
        }
      }
    }
  }
})
store.set('settings.calibControlFactor', 1)
Store.initRenderer()
