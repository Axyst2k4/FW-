import { IRegistryStore } from '@/loaders/store'
import { CALIB_STATE } from '@/models/state'
import { CalibProcessor } from '@/services/processor'
import { error, success } from '@/utils'
import { currentTime } from '@influxdata/influxdb-client'
import { NextFunction, Request, Response, Router } from 'express'
import Container from 'typedi'
import { Logger } from 'winston'

const route = Router()
export default (app: Router) => {
  app.use('/calibration', route)

  route.get('/status', async (req: Request, res: Response, next: NextFunction) => {
    const logger: Logger = Container.get('logger')
    try {
      const store = Container.get<IRegistryStore>('store')
      return res.json(
        success({
          state: store.getState().calibState,
          id: store.getState().calibrationId,
          history: store.getState().calibrationHistory
        })
      )
    } catch (e) {
      logger.error('🔥 error: %o', e)
      return next(e)
    }
  })

  route.delete('/RESET_CALIBRATION', async (req: Request, res: Response, next: NextFunction) => {
    const logger: Logger = Container.get('logger')
    try {
      const processor = Container.get(CalibProcessor)
      processor.reset()
      return res.json(success(null))
    } catch (e) {
      logger.error('🔥 error: %o', e)
      return next(e)
    }
  })

  route.get('/latest', async (req: Request, res: Response, next: NextFunction) => {
    const logger: Logger = Container.get('logger')
    try {
      const model = Container.get<Models.CalibrationModel>('calibrationModel')
      // todo: add pagination
      const data = await model.find().sort({ createdAt: -1 }).limit(1)
      if (!data.length) {
        return res.json(success(null))
      }
      const values = await Container.get<Models.CalibrationDataModel>('calibrationDataModel').find({
        calibrationId: data[0]._id
      })

      return res.json(
        success({
          ...data[0],
          values
        })
      )
    } catch (e) {
      logger.error('🔥 error: %o', e)
      return next(e)
    }
  })

  route.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    const logger: Logger = Container.get('logger')
    try {
      const id = req.params.id

      const model = Container.get<Models.CalibrationModel>('calibrationModel')
      // todo: add pagination
      const data = await model.findOne({ _id: id })
      if (!data) {
        return res.json(success(null))
      }
      const values = await Container.get<Models.CalibrationDataModel>('calibrationDataModel').find({
        calibrationId: data._id
      })

      return res.json(
        success({
          ...data,
          values
        })
      )
    } catch (e) {
      logger.error('🔥 error: %o', e)
      return next(e)
    }
  })

  route.post('/prepare', async (req: Request, res: Response, next: NextFunction) => {
    const logger: Logger = Container.get('logger')
    try {
      const store = Container.get<IRegistryStore>('store')
      if (store.getState().calibrationId || store.getState().calibState !== CALIB_STATE.NONE) {
        return res.json(error("Calibration can't be started, existing calibration is in progress"))
      }
      // if (!store.getState().isAllSensorNodesSleep()) {
      //   const awakeNodes = store.getState().getAwakeSensorNodes()
      //   return res.json(
      //     error(
      //       "Calibration can't be started, not all sensor nodes are sleep: " +
      //         awakeNodes.map((v) => v.id).join(', ')
      //     )
      //   )
      // }
      const processor = Container.get(CalibProcessor)
      const data = processor.prepare()

      return res.json(success(data))
    } catch (e) {
      logger.error('🔥 error: %o', e)
      return next(e)
    }
  })

  route.post('/start', async (req: Request, res: Response, next: NextFunction) => {
    const logger: Logger = Container.get('logger')
    try {
      const processor = Container.get(CalibProcessor)
      const store = Container.get<IRegistryStore>('store')
      if (store.getState().calibState !== CALIB_STATE.READY) {
        return res.json(error("Calibration isn't ready"))
      }
      const data = processor.start()

      return res.json(success(data))
    } catch (e) {
      logger.error('🔥 error: %o', e)
      return next(e)
    }
  })

  route.post('/finish', async (req: Request, res: Response, next: NextFunction) => {
    const logger: Logger = Container.get('logger')
    try {
      const { current } = req.body
      const processor = Container.get(CalibProcessor)

      const store = Container.get<IRegistryStore>('store')
      if (store.getState().calibState !== CALIB_STATE.DONE) {
        return res.json(error("Calibration isn't done"))
      }
      const data = processor.finalize(+current)

      return res.json(success(data))
    } catch (e) {
      logger.error('🔥 error: %o', e)
      return next(e)
    }
  })
}
