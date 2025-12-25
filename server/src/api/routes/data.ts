import { downloadResource, success } from '@/utils'
import { celebrate, Joi, Segments } from 'celebrate'
import { Router, Request, Response, NextFunction } from 'express'
import { Container } from 'typedi'
import { Logger } from 'winston'
const route = Router()

export default (app: Router) => {
  app.use('/data', route)

  route.get(
    '/station/all',
    celebrate({
      [Segments.QUERY]: Joi.object({
        start: Joi.string().required(),
        end: Joi.string().required()
      })
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger')
      try {
        const { start, end, page, limit } = req.query
        const model = Container.get<Models.StationMetricModel>('stationMetricModel')
        const data = await model.find({
          ts: {
            $gte: new Date(start as string),
            $lte: new Date(end as string)
          }
        })

        return res.json(success(data))
      } catch (e) {
        logger.error('🔥 error: %o', e)
        return next(e)
      }
    }
  )

  route.get(
    '/station/export',
    celebrate({
      [Segments.QUERY]: Joi.object({
        id: Joi.string(),
        start: Joi.string().required(),
        end: Joi.string().required()
      })
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger')
      try {
        const { id, start, end } = req.query
        const model = Container.get<Models.StationMetricModel>('stationMetricModel')
        const raw = await model
          .find({
            meta: {
              id
            },
            ts: {
              $gte: new Date(start as string),
              $lte: new Date(end as string)
            }
          })
          .lean()
        const filename = `station-${id}-${start}-${end}.csv`
        const data = raw.map((d) => {
          return {
            id: d.meta.id,
            current: d.current,
            voltage: d.voltage,
            ts: new Date(d.ts).toLocaleString('vi-VN')
          }
        })
        const fields = ['id', 'current', 'voltage', 'ts']

        return downloadResource(res, filename, data, { fields })
      } catch (e) {
        logger.error('🔥 error: %o', e)
        return next(e)
      }
    }
  )

  route.get(
    '/sensor/export',
    celebrate({
      [Segments.QUERY]: Joi.object({
        id: Joi.string(),
        start: Joi.string().required(),
        end: Joi.string().required()
      })
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger')
      try {
        const { id, start, end } = req.query
        const model = Container.get<Models.SensorMetricModel>('sensorMetricModel')
        const raw = await model
          .find({
            'meta.id': id,
            ts: {
              $gte: start as string,
              $lte: end as string
            }
          })
          .lean()
        const filename = `sensor-${id}-${start}-${end}.csv`

        const data = raw.map((d) => {
          return {
            id: d.meta.id,
            battery: d.battery,
            value: d.v,
            valueType: d.meta.v_type === 1 ? 'VP' : 'VNA',
            ts: new Date(d.ts).toLocaleString('vi-VN')
          }
        })

        const fields = ['id', 'battery', 'value', 'valueType', 'ts']

        return downloadResource(res, filename, data, { fields })
      } catch (e) {
        logger.error('🔥 error: %o', e)
        return next(e)
      }
    }
  )

  route.get(
    '/station',
    celebrate({
      [Segments.QUERY]: Joi.object({
        id: Joi.string(),
        start: Joi.string().required(),
        end: Joi.string().required(),
        raw: Joi.boolean()
      })
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger')
      try {
        const { id, start, end, raw } = req.query
        const model = Container.get<Models.StationMetricModel>('stationMetricModel')
        if (raw) {
          const data = await model
            .find({
              meta: {
                id
              },
              ts: {
                $gte: new Date(start as string),
                $lte: new Date(end as string)
              }
            })
            .limit(100)

          return res.json(success(data))
        } else {
          const data = await model.aggregate([
            {
              $match: {
                meta: {
                  id
                },
                ts: {
                  $gte: new Date(start as string),
                  $lte: new Date(end as string)
                }
              }
            },
            {
              $group: {
                _id: {
                  truncated: {
                    $dateTrunc: {
                      date: '$ts',
                      unit: 'minute'
                    }
                  }
                },
                current: { $avg: '$current' },
                voltage: { $avg: '$voltage' }
              }
            },
            {
              $project: {
                ts: '$_id.truncated',
                current: 1,
                voltage: 1,
                _id: 0
              }
            },
            {
              $densify: {
                field: 'ts',
                range: {
                  step: 1,
                  unit: 'minute',
                  bounds: 'full'
                }
              }
            },
            {
              $fill: {
                sortBy: { ts: 1 },
                output: {
                  current: { method: 'locf' },
                  voltage: { method: 'locf' }
                }
              }
            }
          ])

          return res.json(success(data))
        }
      } catch (e) {
        logger.error('🔥 error: %o', e)
        return next(e)
      }
    }
  )

  route.get(
    '/sensor/all',
    celebrate({
      [Segments.QUERY]: Joi.object({
        start: Joi.string().required(),
        end: Joi.string().required()
      })
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger')
      try {
        const { start, end } = req.query
        const model = Container.get<Models.SensorMetricModel>('sensorMetricModel')
        const data = await model
          .find({
            ts: {
              $gte: new Date(start as string),
              $lte: new Date(end as string)
            }
          })
          .limit(100)

        return res.json(success(data))
      } catch (e) {
        logger.error('🔥 error: %o', e)
        return next(e)
      }
    }
  )

  route.get(
    '/sensor',
    celebrate({
      [Segments.QUERY]: Joi.object({
        id: Joi.string(),
        start: Joi.string().required(),
        end: Joi.string().required(),
        raw: Joi.boolean()
      })
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger')
      try {
        const { id, start, end, raw } = req.query
        const model = Container.get<Models.SensorMetricModel>('sensorMetricModel')
        if (raw) {
          const data = await model.find({
            'meta.id': id,
            ts: {
              $gte: new Date(start as string),
              $lte: new Date(end as string)
            }
          })

          return res.json(success(data))
        } else {
          const data = await model.aggregate([
            {
              $match: {
                'meta.id': id,
                ts: {
                  $gte: new Date(start as string),
                  $lte: new Date(end as string)
                }
              }
            },
            {
              $group: {
                _id: {
                  truncated: {
                    $dateTrunc: {
                      date: '$ts',
                      unit: 'minute'
                    }
                  }
                },
                battery: { $avg: '$battery' },
                v: { $avg: '$v' }
              }
            },
            {
              $project: {
                ts: '$_id.truncated',
                battery: 1,
                v: 1,
                _id: 0
              }
            },
            {
              $densify: {
                field: 'ts',
                range: {
                  step: 1,
                  unit: 'minute',
                  bounds: 'full'
                }
              }
            },
            {
              $fill: {
                sortBy: { ts: 1 },
                output: {
                  battery: { method: 'locf' },
                  v: { method: 'locf' }
                }
              }
            }
          ])

          return res.json(success(data))
        }
      } catch (e) {
        logger.error('🔥 error: %o', e)
        return next(e)
      }
    }
  )
}
