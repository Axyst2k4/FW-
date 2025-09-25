import { IRegistryStore } from '@/loaders/store'
import { NodeController } from '@/services/processor'
import { Router } from 'express'
import Container from 'typedi'

const route = Router()

export default (app: Router) => {
  app.use('/system', route)

  route.get('/health', (req, res) => {
    res.json({
      status: 'ok'
    })
  })

  route.get('/states', (req, res) => {
    const store = Container.get<IRegistryStore>('store')
    return res.json(store.getState())
  })

  route.delete('/RESET_ALL', (req, res) => {
    const store = Container.get<IRegistryStore>('store')
    store.getState().clear()
    return res.json({
      status: 'ok'
    })
  })

  route.post('/SYNC', (req, res) => {
    const store = Container.get<IRegistryStore>('store')
    const { value } = req.body
    store.getState().setSync(value)
    return res.json({
      status: 'ok'
    })
  })

  route.get('/SYNC', (req, res) => {
    const store = Container.get<IRegistryStore>('store')
    return res.json({
      sync: store.getState().sync
    })
  })

  route.post('/RESET_LAST_WAKE', (req, res) => {
    const store = Container.get<IRegistryStore>('store')
    store.getState().clearLastRegister()
    return res.json({
      status: 'ok'
    })
  })

  route.post('/SYNC/NOW', (req, res) => {
    const controller = Container.get(NodeController)
    controller.syncSensor()
    return res.json({
      status: 'ok'
    })
  })
}
