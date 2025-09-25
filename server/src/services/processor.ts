import {
  IBytesPacket,
  ICmd,
  IDataType,
  IPacketType,
  ResponseStatus
} from '@/interfaces/IBytesPacket'
import { CALIB_STATE, INodeRequest } from '@/models/state'
import { createHash } from 'crypto'
import { Inject, Service } from 'typedi'
import MQTTService from './mqtt'
import {
  INode,
  NodeStatus,
  IStationWithNodes,
  IStation,
  MotorBound,
  SensorMode
} from '@/models/node'
import { int2uint8arr, uint32touint8arr, uint8arr2int } from '@/utils'
import { Logger } from 'winston'
import StateMachine from 'javascript-state-machine'
import { IRegistryStore } from '@/loaders/store'
import { ICalibrationData } from '@/models/calibration'
import { set } from 'lodash'

@Service()
export class NodeSender {
  constructor(private mqttService: MQTTService, @Inject('logger') private logger: Logger) {}

  sendCmd(nodeId: number, cmd: ICmd, data?: Uint8Array) {
    const sendData = new Uint8Array([cmd, ...(data || [])])
    this.mqttService.send(nodeId, IPacketType.CMD, sendData)
  }

  broadcastCmd(cmd: ICmd, data?: Uint8Array) {
    const sendData = new Uint8Array([cmd, ...(data || [])])
    this.mqttService.broadcast(IPacketType.CMD, sendData)
  }

  sendData(nodeId: number, dataType: IDataType, data?: Uint8Array) {
    const sendData = new Uint8Array([dataType, ...(data || [])])
    this.mqttService.send(nodeId, IPacketType.DATA, sendData)
  }

  broadcastData(dataType: IDataType, data?: Uint8Array) {
    const sendData = new Uint8Array([dataType, ...(data || [])])
    this.mqttService.broadcast(IPacketType.DATA, sendData)
  }

  request(nodeId: number, cmd: ICmd, data?: Uint8Array, options?: { timeout?: number }) {
    const request = new Promise((resolve, reject) => {
      this.sendCmd(nodeId, cmd, data)
      const timer = setTimeout(() => {
        reject(new Error('Request timeout'))
      }, options?.timeout || 5 * 1000)

      this.mqttService.on('cmd:resp', (payload: IBytesPacket) => {
        const status = payload.data[0]
        const cmdType = payload.data[1] as ICmd
        if (cmdType === cmd) {
          if (status === ResponseStatus.ERR) {
            return reject(payload)
          }
          this.logger.info('Received response from %s', payload.node_id)
          clearTimeout(timer)
          if (payload.data.length > 2) {
            resolve(payload.data.slice(2))
          } else {
            resolve(1)
          }
        }
      })
    })
    return request
  }
}

@Service()
export class NodeController {
  constructor(private nodeSender: NodeSender, @Inject('logger') private logger: Logger) {}

  onOffTransformerState = (nodeId: number, state: boolean) => {
    this.logger.info('Switching transformer of station %s to %s', nodeId, state ? 'ON' : 'OFF')
    const data = new Uint8Array([state ? 0x01 : 0x02])
    this.nodeSender.sendCmd(nodeId, ICmd.SWITCH_TRANSFORMER, data)
  }

  controlStepMotor = (
    nodeId: number,
    step: number,
    direction: 'inc' | 'dec',
    unit: 'percent' | 'step'
  ) => {
    this.logger.info('Control step motor of station %s', nodeId)
    const directionByte = direction === 'inc' ? 0x01 : 0x02
    const unitByte = unit === 'percent' ? 0x01 : 0x02
    const value = int2uint8arr(step, 2)
    console.log(nodeId, directionByte, unitByte, value)
    this.nodeSender.sendCmd(
      nodeId,
      ICmd.STEP_MOTOR_CONTROL,
      new Uint8Array([directionByte, unitByte, ...value])
    )
  }

  controlDirectStepMotor = (nodeId: number, directvalue: number) => {
    this.logger.info('Control direct step motor of station %s', nodeId)
    const value = int2uint8arr(directvalue, 2)
    this.nodeSender.sendCmd(nodeId, ICmd.STEP_MOTOR_CONTROL, new Uint8Array([0x03, 0x03, ...value]))
  }

  calibFinalize = (current: number) => {
    const value = int2uint8arr(current, 2)
    this.nodeSender.broadcastData(IDataType.CALIB_FINAL, new Uint8Array([...value]))
  }

  syncSensor = () => {
    const wakeTs = new Date().getTime() / 1000 + 5
    console.log('Sync sensor', new Date(wakeTs * 1000).toLocaleString())
    this.nodeSender.broadcastCmd(ICmd.SYNC_SENSOR, uint32touint8arr(wakeTs))
    // Note: try send duplicate to prevent missing packages for station (just a hack, should find another way)
    setTimeout(() => {
      this.nodeSender.broadcastCmd(ICmd.SYNC_SENSOR, uint32touint8arr(wakeTs))
    }, 1000)
  }
}

export interface IFsmContext {
  transition: string
  from: string
  to: string
  fsm: IRegistryStore
}

@Service()
export class CalibProcessor {
  private _fsm: StateMachine
  private _readyNodes: Set<number> = new Set()
  private _readyStations: Set<number> = new Set()
  private _readyTimeout: NodeJS.Timeout
  private _calibTimeout: NodeJS.Timeout
  private _calibNodes: Set<number> = new Set()

  constructor(
    private nodeSender: NodeSender,
    private mqttService: MQTTService,
    private nodeController: NodeController,
    @Inject('calibrationModel') private calibrationModel: Models.CalibrationModel,
    @Inject('logger') private logger: Logger,
    @Inject('store') private registryStore: IRegistryStore
  ) {}

  init = () => {
    this._fsm = new StateMachine({
      init: CALIB_STATE.NONE,
      transitions: [
        { name: 'prepare', from: CALIB_STATE.NONE, to: CALIB_STATE.PREPARE },
        { name: 'trigger', from: [CALIB_STATE.PREPARE, CALIB_STATE.NONE], to: CALIB_STATE.READY },
        { name: 'calibrate', from: CALIB_STATE.READY, to: CALIB_STATE.CALIBRATING },
        { name: 'stop', from: CALIB_STATE.CALIBRATING, to: CALIB_STATE.NONE },
        { name: 'throw', from: '*', to: CALIB_STATE.ERROR },
        { name: 'warn', from: '*', to: CALIB_STATE.WARN },
        { name: 'reset', from: '*', to: CALIB_STATE.NONE },
        { name: 'finish', from: CALIB_STATE.CALIBRATING, to: CALIB_STATE.DONE }
      ],
      methods: {
        onPrepare: this.onPrepare,
        onCalibrate: this.startCalib,
        onReady: this.onReady,
        onStop: this.onStop,
        onError: this.onError,
        onWarn: this.onWarn,
        onReset: this.onReset,
        onDone: this.onDone
      }
    })

    // this.registryStore.subscribe((state) => state.calibState)

    this.mqttService.on('calib:ready', this.processCalibReady)
    this.mqttService.on('calib:data', this.processCalibData)
  }

  prepare = () => {
    if (this._fsm.state !== CALIB_STATE.NONE) return
    this._fsm.prepare()
  }

  start = () => {
    console.log('start', this._fsm.state)
    this._fsm.calibrate()
  }

  stop = () => {
    this._fsm.stop()
  }

  reset = () => {
    this._fsm.reset()
  }

  finalize = async (current: number) => {
    this.nodeController.calibFinalize(current)
    this.registryStore.getState().addCalibrationHistory({
      id: this.registryStore.getState().calibrationId,
      createdAt: new Date(),
      message: 'Calibration Finalized with current: ' + current + 'mA',
      transition: 'finalize'
    })
    await this.calibrationModel.updateOne(
      { _id: this.registryStore.getState().calibrationId },
      { finishedAt: new Date(), finalCurrent: current }
    )
  }

  onPrepare = () => {
    this.logger.info('Calib Processor Prepare')
    this.registryStore.getState().addCalibrationHistory({
      id: this.registryStore.getState().calibrationId,
      createdAt: new Date(),
      message: 'Calibration Prepare',
      transition: 'prepare'
    })
    this.nodeSender.broadcastCmd(ICmd.PREPARE_CALIB)
    // Note: try send duplicate to prevent missing packages for station (just a hack, should find another way)
    setTimeout(() => {
      this.nodeSender.broadcastCmd(ICmd.PREPARE_CALIB)
    }, 1000)

    this.registryStore.setState({ calibState: CALIB_STATE.PREPARE })
    this._readyTimeout = setTimeout(() => {
      const timedOutNodes = this.registryStore
        .getState()
        .getLiveStations()
        .filter((s) => !this._readyStations.has(s.id))
      this.warn('Prepare Timeout nodes: ' + timedOutNodes.map((s) => s.id).join(', '))
    }, 300 * 1000)
  }

  warn = (reason: string, meta?: any) => {
    this._fsm.warn(reason, meta)
  }

  startCalib = async () => {
    console.log('start calib now')
    this.nodeSender.broadcastCmd(
      ICmd.START_CALIB,
      uint32touint8arr(new Date().getTime() / 1000 + 5)
    )
    const calib = await this.calibrationModel.create({})
    this.registryStore.setState({ calibState: CALIB_STATE.CALIBRATING, calibrationId: calib._id })
    this._calibTimeout = setTimeout(() => {
      this.warn('CALIB_TIMEOUT', { calibNodes: this._calibNodes })
    }, 300 * 1000)
  }

  processCalibReady = (payload: IBytesPacket) => {
    this.logger.info('Calib Ready Message from %s', payload.node_id)
    console.log('calib ready', payload)
    this._readyStations.add(payload.node_id)
    const data = payload.data.slice(1)

    for (let i = 2; i < data.length; i += 2) {
      const sensorId = data[i]
      const sensorStatus = data[i + 1]
      if (sensorStatus === 0x01) {
        this._readyNodes.add(sensorId)
      }
    }
    const registeredStations = this.registryStore.getState().getLiveStations()

    console.log(
      'ready stations',
      this._readyStations.values(),
      registeredStations.map((s) => s.id)
    )

    console.log('ready nodes', this._readyNodes.values())

    if (this._readyStations.size === registeredStations.length) {
      try {
        this._fsm.trigger()
      } catch (error) {
        console.log(error)
      }

      this._readyTimeout && clearTimeout(this._readyTimeout)
    }
  }

  processCalibData = (payload: IBytesPacket) => {
    const data = payload.data.slice(1)
    const sensorBytes = data.slice(5, -4)
    for (let i = 0; i < sensorBytes.length; i += 50 * 2 + 1) {
      const sensorByte = sensorBytes.slice(i, i + 50 * 2 + 1)
      const sensorId = sensorByte[0]
      this._calibNodes.add(sensorId)
    }

    const registeredNodes = this.registryStore.getState().getLiveNodes()
    if (!(this._calibNodes.size < this._readyNodes.size)) {
      this._fsm.finish()
      this._calibTimeout && clearTimeout(this._calibTimeout)
    }
  }

  onStop = (context: IFsmContext) => {
    // this._fsm.stop()
    this.logger.info('Calib Processor Stop')

    this.registryStore.getState().addCalibrationHistory({
      id: this.registryStore.getState().calibrationId,
      createdAt: new Date(),
      message: 'Calibration Stopped',
      transition: context.transition
    })
    this.registryStore.getState().clearCalib()
  }

  onError = (context: IFsmContext, error: string) => {
    this.logger.error('Calib Processor Error')
    this.registryStore.getState().addCalibrationHistory({
      id: this.registryStore.getState().calibrationId,
      createdAt: new Date(),
      message: 'Calibration Error',
      transition: context.transition
    })
    this.calibrationModel.updateOne({ finishedAt: new Date(), error: error || 'Unknown Error' })
    this.registryStore.setState({ calibState: CALIB_STATE.ERROR })
  }

  onWarn = (context: IFsmContext, reason: string, meta?: any) => {
    this.logger.warn('Calib Processor Warn')
    this.registryStore.getState().addCalibrationHistory({
      id: this.registryStore.getState().calibrationId,
      createdAt: new Date(),
      message: reason,
      transition: context.transition
    })
    this.logger.warn(reason, meta ? JSON.stringify(meta, null, 2) : '')
    this.registryStore.setState({ calibState: CALIB_STATE.WARN })
    this.nodeController.syncSensor()
  }

  onReset = () => {
    this.logger.info('Calib Processor Reset')
    this.registryStore.getState().clearCalib()
    this._readyNodes.clear()
    this._calibNodes.clear()
    this._readyStations.clear()
    this._calibTimeout && clearTimeout(this._calibTimeout)
    this._readyTimeout && clearTimeout(this._readyTimeout)
  }

  onDone = () => {
    this.logger.info('Calib Processor Done')
    this.calibrationModel.updateOne(
      { id: this.registryStore.getState().calibrationId },
      { finishedAt: new Date() }
    )
    this.registryStore.getState().addCalibrationHistory({
      id: this.registryStore.getState().calibrationId,
      createdAt: new Date(),
      message: 'Calibration Done',
      transition: 'finish'
    })
    this._readyNodes.clear()
    this._calibNodes.clear()
    this._readyStations.clear()
    this._calibTimeout && clearTimeout(this._calibTimeout)
    this._readyTimeout && clearTimeout(this._readyTimeout)
    this.registryStore.setState({ calibState: CALIB_STATE.DONE })
  }

  onReady = () => {
    this.logger.info('Calib Processor Ready')
    this.calibrationModel.updateOne({ finishedAt: new Date() })
    this.registryStore.getState().addCalibrationHistory({
      id: this.registryStore.getState().calibrationId,
      createdAt: new Date(),
      message: 'Calibration Ready',
      transition: 'triggerReady'
    })
    this.registryStore.setState({ calibState: CALIB_STATE.READY })
    this._readyTimeout && clearTimeout(this._readyTimeout)
  }

  get fsm() {
    return this._fsm
  }

  get readyNodes() {
    return this._readyNodes
  }
}

@Service()
export class NodeProcessor {
  constructor(
    private mqttService: MQTTService,
    private nodeController: NodeController,
    private nodeSender: NodeSender,
    @Inject('stationMetricModel') private stationMetricModel: Models.StationMetricModel,
    @Inject('sensorMetricModel') private sensorMetricModel: Models.SensorMetricModel,
    @Inject('calibrationModel') private calibrationModel: Models.CalibrationModel,
    @Inject('calibrationDataModel') private calibrationDataModel: Models.CalibrationDataModel,
    @Inject('logger') private logger: Logger,
    @Inject('store') private registryStore: IRegistryStore
  ) {}

  init = () => {
    // this.mqttService.on('register', this.processRegisterMsg)
    this.mqttService.on('data', this.processDataMsg)
    this.mqttService.on('calib:data', this.processCalibData)
    this.mqttService.on('calib:ready', this.processCalibReady)
    this.mqttService.on('cmd:switch_transformer', this.processSwitchTransformerCmd)
    this.mqttService.on('cmd:step_motor_control', this.processStepMotorControlCmd)
    this.mqttService.on('cmd:get_status', this.processGetStatusCmd)
    this.mqttService.on('data:motor_limit', this.processMotorLimit)
    this.mqttService.on('cmd:get_sensor_data', this.processGetSensorsLatestData)
    this.mqttService.on('cmd:get_station_data', this.processGetStationsLatestData)
  }

  processGetSensorsLatestData = async (payload: IBytesPacket) => {
    try {
      const data = payload.data.slice(1)
      const sensorIds = data.slice(0, -11)
      const phone = data.slice(-11)
      this.logger.info('processGetSensorLatestData from %s', payload.node_id)

      let res = new Uint8Array([0x02])
      for (const sensorId of sensorIds) {
        const sensor = this.registryStore.getState().getSensorById(sensorId)
        if (!sensor) {
          this.logger.warn('Sensor Node %s not found/not registered. Skipping...', sensorId)
          continue
        }
        const sensorValue = (sensor.value + 3) * 1000
        const voltageType = sensor.valueType
        const sensorBytes = new Uint8Array([sensorId, voltageType, ...int2uint8arr(sensorValue, 2)])

        res = new Uint8Array([...res, ...sensorBytes])
      }

      console.log(res)
      this.nodeSender.sendData(payload.node_id, IDataType.LATEST, res)
    } catch (err) {
      this.logger.error(err)
    }
  }

  processGetStationsLatestData = async (payload: IBytesPacket) => {
    try {
      const data = payload.data.slice(1)
      const stationIds = data.slice(0, -11)
      const phone = data.slice(-11)
      this.logger.info('processGetStationsLatestData from %s', payload.node_id)
      console.log(stationIds)

      let res = new Uint8Array([0x01])
      for (const stationId of stationIds) {
        const station = this.registryStore.getState().getStation(stationId)
        if (!station) {
          this.logger.warn('Station Node %s not found/not registered. Skipping...', stationId)
          continue
        }
        const stationCurrent = station.current
        const stationBytes = new Uint8Array([stationId, ...int2uint8arr(stationCurrent, 2)])
        console.log(stationBytes)

        res = new Uint8Array([...res, ...stationBytes])
      }
      this.nodeSender.sendData(payload.node_id, IDataType.LATEST, res)
    } catch (err) {
      this.logger.error(err)
    }
  }

  processMotorLimit = async (payload: IBytesPacket) => {
    try {
      this.logger.info('processMotorLimit', payload)
      const limit = payload.data[1]
      this.registryStore.getState().updateStation({
        id: payload.node_id,
        motorBound: limit as MotorBound
      })
    } catch (err) {
      this.logger.error(err)
    }
  }

  processMBAStatus = async (payload: IBytesPacket) => {
    try {
      const status = payload.data[1]
      this.registryStore.getState().updateStation({
        id: payload.node_id,
        contactor: status === 0x01
      })
    } catch (err) {
      this.logger.error(err)
    }
  }

  // Calibration Data Message
  // | 1 byte Station ID | 2 bytes Current | 2 bytes Voltage | 150 bytes Sensor 1 | 150 bytes Sensor 2 | ... | 4 bytes RTC |
  // Each sensor data: 1 byte Sensor ID | 1 byte Sensor Battery | 300 bytes Sensor Values (150 values in 15 seconds, each value is 2 bytes)
  processCalibData = async (payload: IBytesPacket) => {
    this.logger.info('Calib Data Message from %s', payload.node_id)
    try {
      const data = payload.data.slice(1) // Remove first 2 bytes (data type, data length)
      const stationId = data[0]
      const current = uint8arr2int(data.slice(1, 3)) * 10
      const voltage = uint8arr2int(data.slice(3, 5)) * 10
      const sensorBytes = data.slice(5, -4)
      const ts = uint8arr2int(data.slice(-4)) * 1000
      await this.stationMetricModel.create({
        voltage,
        current,
        ts: new Date(ts),
        meta: {
          id: stationId
        }
      })

      const points: ICalibrationData[] = []
      const currentCalibrationId = this.registryStore.getState().calibrationId
      if (!currentCalibrationId) return

      console.log('sensorBytes', sensorBytes)
      for (let i = 0; i < sensorBytes.length; i += 50 * 2 + 1) {
        const sensorByte = sensorBytes.slice(i, i + 50 * 2 + 1)
        const sensorId = sensorByte[0]
        const currentSensor = this.registryStore.getState().getNode(stationId, sensorId)
        if (!currentSensor) {
          this.logger.warn('Sensor Node %s not found/not registered. Skipping...', sensorId)
          continue
        } else {
          this.logger.info('Processing Sensor Node %s found', sensorId)
        }
        const sensorValues = sensorByte.slice(1) // Total 300 bytes, each value is 2 bytes
        const sensorVType = currentSensor.valueType
        const values = []
        for (let j = 0; j < sensorValues.length; j += 2) {
          const value = parseFloat(
            ((uint8arr2int(sensorValues.slice(j, j + 2)) * 2) / 1000 - 3).toFixed(3)
          )
          values.push(value)
        }

        points.push({
          nodeId: sensorId,
          calibrationId: currentCalibrationId,
          values,
          type: sensorVType
        })
      }

      await this.calibrationDataModel.insertMany(points)

      this.responseDataWithStatus(
        payload.node_id,
        IPacketType.RESPDATA,
        payload.data[0],
        ResponseStatus.OK
      )
    } catch (err) {
      this.responseDataWithStatus(
        payload.node_id,
        IPacketType.RESPDATA,
        payload.data[0],
        ResponseStatus.ERR
      )
      this.logger.error(err)
    }
  }

  processRegisterMsg = async (payload: IBytesPacket) => {
    try {
      this.logger.info('Register Message from %s', payload.node_id)
      const data = payload.data.slice(1) // Remove first 2 bytes (data type, data length)
      const stationId = data[0]
      const current = uint8arr2int(data.slice(1, 3))
      const mbaStatus = data[3]
      const voltage = uint8arr2int(data.slice(4, 6))
      const sensorBytes = data.slice(6, -4)
      const ts = uint8arr2int(data.slice(-4)) * 1000

      await this.stationMetricModel.create({
        voltage,
        current,
        ts: new Date(ts),
        meta: {
          id: stationId
        }
      })

      const sensorObjects = []
      for (let i = 0; i < sensorBytes.length; i += 3) {
        const sensorByte = sensorBytes.slice(i, i + 3)
        const [sensorId, sensorBattery, sensorVType] = sensorByte
        const sensor: INode = {
          id: sensorId,
          status: NodeStatus.CONNECTED,
          value: 0,
          valueType: sensorVType,
          mode: SensorMode.UNKNOWN,
          rtc: ts,
          createdAt: new Date(),
          updatedAt: new Date(),
          parent: stationId,
          battery: sensorBattery
        }
        sensorObjects.push(sensor)
      }

      console.log('sensorObjects', sensorObjects)

      const stationObject: IStationWithNodes = {
        id: stationId,
        current,
        voltage,
        rtc: ts,
        contactor: mbaStatus === 0x01,
        nodes: sensorObjects,
        updatedAt: new Date(),
        createdAt: new Date()
      }
      this.registryStore.getState().registerStation(stationObject)
      this.responseDataWithStatus(
        payload.node_id,
        IPacketType.RESPREG,
        payload.data[0],
        ResponseStatus.OK
      )

      console.log(
        '------->',
        this.registryStore.getState().isFirstRegOfTheDay(),
        this.registryStore.getState().sync,
        this.registryStore.getState().isCalibrating()
      )

      if (
        this.registryStore.getState().isFirstRegOfTheDay() &&
        this.registryStore.getState().sync &&
        !this.registryStore.getState().isCalibrating()
      ) {
        this.logger.info('First Register of the day, try sleep all sensors')

        setTimeout(() => {
          this.nodeController.syncSensor()
        }, 100 * 1000)
      }
      this.registryStore.getState().setLastRegister()
    } catch (err) {
      this.logger.error(err)
      this.responseDataWithStatus(
        payload.node_id,
        IPacketType.RESPREG,
        payload.data[0],
        ResponseStatus.ERR
      )
    }
  }

  processDataMsg = async (payload: IBytesPacket) => {
    try {
      this.logger.info('DATA Message from %s', payload.node_id)
      const data = payload.data.slice(1)
      const stationId = data[0]
      const current = uint8arr2int(data.slice(1, 3)) * 10
      const mbaStatus = data[3]
      const voltage = uint8arr2int(data.slice(4, 6)) * 10
      const sensorBytes = data.slice(6, -4)
      const ts = uint8arr2int(data.slice(-4)) * 1000

      const station = this.registryStore.getState().getStation(stationId)
      if (!station) {
        this.logger.warn('Station %s not found/not registered. Skipping...', stationId)
        return
      }

      await this.stationMetricModel.create({
        voltage,
        current,
        ts: new Date(ts),
        meta: {
          id: stationId
        }
      })
      const stationObject: IStation = {
        id: stationId,
        current,
        voltage,
        contactor: mbaStatus === 0x01,
        rtc: ts,
        updatedAt: new Date()
      }
      this.registryStore.getState().updateStation(stationObject)

      const points = []
      for (let i = 0; i < sensorBytes.length; i += 5) {
        const sensorByte = sensorBytes.slice(i, i + 5)
        const [sensorId, sensorBattery] = sensorByte
        const node = this.registryStore.getState().getNode(stationId, sensorId)
        if (!node) {
          this.logger.warn('Sensor Node %s not found/not registered. Skipping...', sensorId)
          continue
        }
        const currentSensor = this.registryStore.getState().getNode(stationId, sensorId)
        const sensorValue = parseFloat(
          ((uint8arr2int(sensorBytes.slice(i + 2, i + 4)) * 2) / 1000 - 3).toFixed(3)
        )
        // y = (x * 2) / 1000 - 3 => x = (y + 3) * 1000 / 2 
        const sensorMode = sensorByte[4] as SensorMode
        const sensor: INode = {
          ...currentSensor,
          value: sensorValue,
          rtc: ts,
          updatedAt: new Date(),
          battery: sensorBattery,
          mode: sensorMode,
          status: sensorMode === SensorMode.UNKNOWN ? NodeStatus.DISCONNECTED : currentSensor.status
        }
        let point = {
          battery: sensorBattery,
          v: sensorValue,
          ts: new Date(ts),
          meta: {
            id: sensorId,
            v_type: currentSensor.valueType
          }
        }
        points.push(point)
        this.registryStore.getState().updateNode(sensorId, sensor)
      }

      await this.sensorMetricModel.insertMany(points)
      // const shouldSync =
      //   this.registryStore.getState().shouldSync() &&
      //   this.registryStore.getState().isAllSensorNodesAwake() &&
      //   !this.registryStore.getState().isCalibrating()
      // if (shouldSync) {
      //   this.nodeController.syncSensor()
      //   this.registryStore.getState().setLastWake()
      // }
      this.responseDataWithStatus(
        payload.node_id,
        IPacketType.RESPDATA,
        payload.data[0],
        ResponseStatus.OK
      )
    } catch (err) {
      this.logger.error(err)
      console.log(err)
      this.responseDataWithStatus(
        payload.node_id,
        IPacketType.RESPDATA,
        payload.data[0],
        ResponseStatus.ERR
      )
    }
  }

  processSwitchTransformerCmd = async (payload: IBytesPacket) => {
    try {
      const data = payload.data.slice(1)
      const state = data[0] === 0x01
      const phone = data.slice(-11)
      this.logger.info(
        'Switch transformer command received from %s, phone: %s',
        payload.node_id,
        Buffer.from(phone).toString()
      )

      const setTime = uint8arr2int(data.slice(-13, -11))
      const stationIdBytes = data.slice(1, -13)
      console.log(setTime, stationIdBytes)

      setTimeout(() => {
        for (const stationIdByte of stationIdBytes) {
          this.nodeController.onOffTransformerState(stationIdByte, state)
        }
      }, setTime * 1000)
    } catch (err) {
      this.logger.error(err)
    }
  }

  processStepMotorControlCmd = async (payload: IBytesPacket) => {
    try {
      const data = payload.data.slice(1)
      console.log(data)
      const direction = data[0] === 0x01 ? 'inc' : 'dec'
      const unit = data[1] === 0x01 ? 'percent' : 'step'
      const step = uint8arr2int(data.slice(2, 4))
      const phone = data.slice(-11)

      this.logger.info(
        'Step motor control command received from %s, phone: %s',
        payload.node_id,
        Buffer.from(phone).toString()
      )
      const setTime = uint8arr2int(data.slice(-13, -11))
      const stationIdBytes = data.slice(4, -13)
      setTimeout(() => {
        for (const stationIdByte of stationIdBytes) {
          this.nodeController.controlStepMotor(stationIdByte, step, direction, unit)
        }
      }, setTime * 1000)
    } catch (err) {
      this.logger.error(err)
    }
  }

  processGetStatusCmd = async (payload: IBytesPacket) => {
    try {
      const phone = payload.data
      const status = this.registryStore.getState().getStatus()
      this.logger.info('Get status command received from %s', payload.node_id)

      const data = new Uint8Array([
        status.activeStations,
        status.nonActiveStations,
        status.activeSensors,
        status.nonActiveSensors
      ])

      this.nodeSender.sendData(payload.node_id, IDataType.SEND_STATUS, data)
    } catch (err) {
      this.logger.error(err)
    }
  }

  processCalibReady = async (payload: IBytesPacket) => {
    try {
      this.logger.info('Calib ready command received from %s', payload.node_id)
      this.responseDataWithStatus(
        payload.node_id,
        IPacketType.RESPDATA,
        IDataType.NETWORK_READY,
        0x01
      )
    } catch (err) {
      this.logger.error(err)
    }
  }

  responseDataWithStatus = (
    nodeId: number,
    type: IPacketType,
    datatype: IDataType,
    status: number
  ) => {
    const data = new Uint8Array([status, datatype])
    this.mqttService.send(nodeId, type, data)
  }

  responseCmdWithStatus = (nodeId: number, cmd: ICmd, status: number) => {
    const data = new Uint8Array([status, cmd])
    console.log('Responsed with status', data)
    this.mqttService.send(nodeId, IPacketType.RESPCMD, data)
  }
}
