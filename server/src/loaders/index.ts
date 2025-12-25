import expressLoader from './express'
import dependencyInjectorLoader from './dependencyInjector'
import mongooseLoader from './mongoose'
import mqttLoader from './mqtt'
import socketLoader from './socketio'
import processorLoader from './processors'
import Logger from './logger'
//We have to import at least all the events once so they can be triggered
import './events'
import Container from 'typedi'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default async function ({ expressApp, httpServer }) {
  const mongoConnection = await mongooseLoader()
  Logger.info('✌️ DB loaded and connected!')

  /**
   * We are injecting the mongoose models into the DI container.
   * I know this is controversial but will provide a lot of flexibility at the time
   * of writing unit tests, just go and check how beautiful they are!
   */
  const userModel = {
    name: 'userModel',
    // Notice the require syntax and the '.default'
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    model: require('../models/user').default
  }

  const whitelistModel = {
    name: 'whitelistModel',
    // Notice the require syntax and the '.default'
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    model: require('../models/whitelist').default
  }

  const roleModel = {
    name: 'roleModel',
    // Notice the require syntax and the '.default'
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    model: require('../models/role').default
  }

  const stationMetricModel = {
    name: 'stationMetricModel',
    model: require('../models/metrics').StationMetric
  }

  const sensorMetricModel = {
    name: 'sensorMetricModel',
    model: require('../models/metrics').SensorMetric
  }

  const calibrationModel = {
    name: 'calibrationModel',
    model: require('../models/calibration').CalibrationModel
  }

  const calibrationDataModel = {
    name: 'calibrationDataModel',
    model: require('../models/calibration').CalibrationDataModel
  }

  const stationGroupModel = {
    name: 'stationGroupModel',
    model: require('../models/stationGroup').StationGroup
  }

  // It returns the agenda instance because it's needed in the subsequent loaders
  const { mqtt, io } = dependencyInjectorLoader({
    mongoConnection,
    models: [
      userModel,
      roleModel,
      whitelistModel,
      stationMetricModel,
      sensorMetricModel,
      calibrationModel,
      calibrationDataModel,
      stationGroupModel
    ],
    httpServer
  })
  Logger.info('✌️ Dependency Injector loaded')

  // jobsLoader({ agenda });
  Logger.info('✌️ Jobs loaded')

  expressLoader({ app: expressApp })
  Logger.info('✌️ Express loaded')

  mqttLoader({ client: mqtt })
  Logger.info('✌️ MQTT loaded')

  processorLoader()
  Logger.info('✌️ Processors loaded')

  socketLoader({ io })
  Logger.info('✌️ Socket loaded')
}
