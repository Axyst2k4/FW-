import { Router, Request, Response, NextFunction } from 'express'
import { Container } from 'typedi'
import { Logger } from 'winston'
import { IRegistryStore } from '@/loaders/store'
import { error, success } from '@/utils'
import { NodeController } from '@/services/processor'
import { NodeService } from '@/services/node'
import { IStationWithNodes, SensorMode } from '@/models/node'
const route = Router()

export default (app: Router) => {
  app.use('/node', route)

  route.get('/', (req: Request, res: Response, next: NextFunction) => {
    const logger: Logger = Container.get('logger')
    try {
      const store = Container.get<IRegistryStore>('store')
      return res.json(success(store.getState().getStations()))
    } catch (e) {
      logger.error('🔥 error: %o', e)
      return next(e)
    }
  })

  route.post('/register', (req: Request, res: Response, next: NextFunction) => {
    const logger: Logger = Container.get('logger')
    try {
      const { id, nodes }: { id: number; nodes: { id: number; valueType: number }[] } = req.body
      const store = Container.get<IRegistryStore>('store')
      const station: IStationWithNodes = {
        id: +id,
        current: 0,
        voltage: 0,
        rtc: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        nodes: nodes.map((n: any) => ({
          id: +n.id,
          value: 0,
          status: 0,
          valueType: +n.valueType,
          parent: +id,
          rtc: 0,
          battery: 0,
          mode: SensorMode.UNKNOWN,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      }
      store.getState().registerStation(station);
      return res.json(success(null))
    } catch (e) {
      logger.error('🔥 error: %o', e)
      return next(e)
    }
  })

  route.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
    const logger: Logger = Container.get('logger')
    try {
      const id = +req.params.id
      const store = Container.get<IRegistryStore>('store')
      store.getState().deleteStation(id)
      return res.json(success(null))
    } catch (e) {
      logger.error('🔥 error: %o', e)
      return next(e)
    }
  })

  route.get('/group', async (req: Request, res: Response, next: NextFunction) => {
    const logger: Logger = Container.get('logger')
    try {
      const nodeService = Container.get(NodeService)
      return res.json(success(await nodeService.getAllStationGroups()))
    } catch (e) {
      logger.error('🔥 error: %o', e)
      return next(e)
    }
  })

  route.post('/group/add', async (req: Request, res: Response, next: NextFunction) => {
    const logger: Logger = Container.get('logger')
    try {
      const groupName = req.body.name
      const stationIds = req.body.stationIds
      // TODO: validate groupName and stationIds

      const nodeService = Container.get(NodeService)
      await nodeService.addStationGroup(groupName, stationIds)
      return res.json(success(null))
    } catch (e) {
      logger.error('🔥 error: %o', e)
      return next(e)
    }
  })

  route.post('/group/remove', async (req: Request, res: Response, next: NextFunction) => {
    const logger: Logger = Container.get('logger')
    try {
      const groupName = req.body.name
      const stationId = req.body.stationId

      const nodeService = Container.get(NodeService)
      await nodeService.removeStationFromGroup(groupName, stationId)
      return res.json(success(null))
    } catch (e) {
      logger.error('🔥 error: %o', e)
      return next(e)
    }
  })

  route.post('/group/delete', async (req: Request, res: Response, next: NextFunction) => {
    const logger: Logger = Container.get('logger')
    try {
      const groupName = req.body.name
      const nodeService = Container.get(NodeService)
      await nodeService.deleteStationGroup(groupName)
      return res.json(success(null))
    } catch (e) {
      logger.error('🔥 error: %o', e)
      return next(e)
    }
  })

  route.post('/cmd/switch_transformer', (req: Request, res: Response, next: NextFunction) => {
    const logger: Logger = Container.get('logger')
    try {
      const id = req.body.id
      const state = req.body.state
      // TODO: validate id and state

      const store = Container.get<IRegistryStore>('store')
      const controller = Container.get(NodeController)
      controller.onOffTransformerState(id, state)
      return res.json(success(null))
    } catch (e) {
      logger.error('🔥 error: %o', e)
      return next(e)
    }
  })

  route.post('/cmd/control_step_motor', (req: Request, res: Response, next: NextFunction) => {
    const logger: Logger = Container.get('logger')
    try {
      const id = +req.body.id
      const direction = '' + req.body.direction
      const value = +req.body.value
      const unit = '' + req.body.unit

      if (value < 0) {
        return res.json(error('Value must be positive'))
      }
      if (direction !== 'inc' && direction !== 'dec') {
        return res.json(error('Direction must be inc or desc'))
      }

      if (unit !== 'step' && unit !== 'percent') {
        return res.json(error('Unit must be step or percent'))
      }

      const controller = Container.get(NodeController)
      controller.controlStepMotor(id, value, direction, unit)

      return res.json(success(null))
    } catch (e) {
      logger.error('🔥 error: %o', e)
      return next(e)
    }
  })

  route.post(
    '/cmd/control_step_motor/direct',
    (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger')
      try {
        const id = +req.body.id
        const value = +req.body.value
        const controller = Container.get(NodeController)
        controller.controlDirectStepMotor(id, value)
        return res.json(success(null))
      } catch (e) {
        logger.error('🔥 error: %o', e)
        return next(e)
      }
    }
  )

  route.post(
    '/cmd/g/control_step_motor/direct',
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger')
      try {
        const groupName = req.body.group
        const value = +req.body.value
        const controller = Container.get(NodeController)
        const nodeService = Container.get(NodeService)

        const group = await nodeService.getGroup(groupName)
        if (!group) {
          return next(new Error('No group with name found'))
        }
        for (const station of group.stationIds) {
          controller.controlDirectStepMotor(station, value)
        }
        return res.json(success(null))
      } catch (e) {
        logger.error('🔥 error: %o', e)
        return next(e)
      }
    }
  )

  route.post(
    '/cmd/g/switch_transformer',
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger')
      try {
        const state = req.body.state
        const groupName = req.body.group
        const nodeService = Container.get(NodeService)

        const group = await nodeService.getGroup(groupName)
        if (!group) {
          return next(new Error('No group with name found'))
        }
        // TODO: validate id and state

        const controller = Container.get(NodeController)
        for (const station of group.stationIds) {
          controller.onOffTransformerState(station, state)
        }
        return res.json(success(null))
      } catch (e) {
        logger.error('🔥 error: %o', e)
        return next(e)
      }
    }
  )

  route.post(
    '/cmd/g/control_step_motor',
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger')
      try {
        const groupName = req.body.group
        const direction = '' + req.body.direction
        const value = +req.body.value
        const unit = '' + req.body.unit

        if (value < 0) {
          return res.json(error('Value must be positive'))
        }
        if (direction !== 'inc' && direction !== 'dec') {
          return res.json(error('Direction must be inc or desc'))
        }

        if (unit !== 'step' && unit !== 'percent') {
          return res.json(error('Unit must be step or percent'))
        }

        const nodeService = Container.get(NodeService)
        const group = await nodeService.getGroup(groupName)
        if (!group) {
          return next(new Error('No group with name found'))
        }
        const controller = Container.get(NodeController)
        for (const station of group.stationIds) {
          controller.controlStepMotor(station, value, direction, unit)
        }

        return res.json(success(null))
      } catch (e) {
        logger.error('🔥 error: %o', e)
        return next(e)
      }
    }
  )
}
