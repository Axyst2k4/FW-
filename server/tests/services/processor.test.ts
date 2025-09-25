import mongoose from 'mongoose'
import MQTTService from '../../src/services/mqtt'
import { StationMetric, SensorMetric } from '../../src/models/metrics'
import crc32 from 'crc-32'
import { TOPICS } from '../../src/utils'
import { createRegistryStore } from '../../src/loaders/store'
import { NodeProcessor } from '../../src/services/processor'
import { IDataType, IPacketType } from '../../src/interfaces/IBytesPacket'

const mockMqttClient = {
  publish: jest.fn()
}

describe('mqtt_process_incoming', () => {
  it('should forward incoming register message', async () => {
    const mqttService = new MQTTService(console as any, mockMqttClient as any)
    const ts = Math.floor(new Date().getTime() / 1000)
    const tsbuf = Buffer.alloc(4)
    tsbuf.writeInt32LE(ts, 0)
    const mainData = Buffer.from([
      0x01, // node id
      IPacketType.REG, // type (register)
      IDataType.REGISTER, // data type (register)
      0x09, // data length
      0x01, // station id
      0x00,
      0xaa, // current
      0x00,
      0xaa, // voltage
      0x51, // sensor id
      0x64, // battery
      0x00,
      0x52, // sensor id
      0x64, // battery
      0x01,
      ...tsbuf
    ])
    const crc = crc32.buf(mainData)
    const crcbuf = Buffer.alloc(4)
    crcbuf.writeInt32LE(crc, 0)
    const REG_MSG = Buffer.from([0x7b, ...mainData, ...crcbuf, 0x7b])
    const registerHandler = jest.fn()
    ;(mqttService as any).on('register', registerHandler)

    const res = await mqttService.processIncomingMessage(TOPICS.SVR_IN, REG_MSG)
    expect(res).toBe(true)

    expect(registerHandler).toBeCalledTimes(1)
    expect(registerHandler).toBeCalledWith({
      id: crc.toString(16),
      node_id: 1,
      type: IPacketType.REG,
      data: new Uint8Array([
        0x04,
        0x09,
        0x01,
        0x00,
        0xaa,
        0x00,
        0xaa,
        0x51,
        0x64,
        0x00,
        0x52,
        0x64,
        0x01,
        ...tsbuf
      ])
    })
  })

  it('should forward incoming data message', async () => {
    const mqttService = new MQTTService(console as any, mockMqttClient as any)
    const ts = Math.floor(new Date().getTime() / 1000)
    const tsbuf = Buffer.alloc(4)
    tsbuf.writeInt32LE(ts, 0)
    const mainData = Buffer.from([
      0x01, // node id
      IPacketType.DATA, // type (data)
      IDataType.PERIODICALLY, // data type (data)
      0x09, // data length
      0x01, // station id
      0x00,
      0xaa, // current
      0x00,
      0xaa, // voltage
      0x51, // sensor id
      0x64, // battery
      0x00,
      0x52, // sensor id
      0x64, // battery
      0x01,
      ...tsbuf
    ])
    const crc = crc32.buf(mainData)
    const crcbuf = Buffer.alloc(4)
    crcbuf.writeInt32LE(crc, 0)
    const REG_MSG = Buffer.from([0x7b, ...mainData, ...crcbuf, 0x7b])
    const dataHandler = jest.fn()
    ;(mqttService as any).on('data', dataHandler)

    const res = await mqttService.processIncomingMessage(TOPICS.SVR_IN, REG_MSG)
    expect(res).toBe(true)

    expect(dataHandler).toBeCalledTimes(1)
    expect(dataHandler).toBeCalledWith({
      id: crc.toString(16),
      node_id: 1,
      type: IPacketType.DATA,
      data: new Uint8Array([
        IDataType.PERIODICALLY,
        0x09,
        0x01,
        0x00,
        0xaa,
        0x00,
        0xaa,
        0x51,
        0x64,
        0x00,
        0x52,
        0x64,
        0x01,
        ...tsbuf
      ])
    })
  })
})

describe('node_processor', () => {
  let nodeStore: any
  let nodeProcessor: NodeProcessor

  const eventEmitterMock = {
    on: jest.fn(),
    emit: jest.fn()
  }
  beforeAll(async () => {
    await mongoose.connect(globalThis.__MONGO_URI__, {
      useNewUrlParser: true,
      useUnifiedTopology: false
    })
    nodeStore = createRegistryStore()
    nodeProcessor = new NodeProcessor(
      eventEmitterMock as any,
      StationMetric,
      SensorMetric,
      console as any,
      nodeStore
    )
  })

  afterAll(async () => {
    nodeStore = null
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
  })

  it('should register node', async () => {
    const ts = Math.floor(new Date().getTime() / 1000)
    const tsbuf = Buffer.alloc(4)
    tsbuf.writeInt32LE(ts, 0)

    const registerPayload = {
      id: '1234',
      node_id: 1,
      type: IPacketType.REG,
      data: new Uint8Array([
        0x04,
        0x09,
        0x01,
        0x00,
        0xaa,
        0x00,
        0xaa,
        0x51,
        0x64,
        0x00,
        0x52,
        0x64,
        0x01,
        ...tsbuf
      ])
    }

    await nodeProcessor.processRegisterMsg(registerPayload)

    const state = nodeStore.getState()
    expect(state.stations).toHaveProperty('1')
    expect(state.stations[1].nodes).toHaveLength(2)
    expect(state.stations[1].nodes[0]).toMatchObject({
      id: 81,
      battery: 100,
      valueType: 0
    })
    expect(state.stations[1].nodes[1]).toMatchObject({
      id: 82,
      battery: 100,
      valueType: 1
    })
    expect(state.getNode(1, 81)).toMatchObject({
      id: 81,
      battery: 100
    })
  })

  it('should update node', async () => {
    const ts = Math.floor(new Date().getTime() / 1000)
    const tsbuf = Buffer.alloc(4)
    tsbuf.writeInt32LE(ts, 0)

    const registerPayload = {
      id: '1234',
      node_id: 1,
      type: IPacketType.REG,
      data: new Uint8Array([
        0x04,
        0x09,
        0x01,
        0x00,
        0xaa,
        0x00,
        0xaa,
        0x51,
        0x64,
        0x00,
        0x52,
        0x64,
        0x01,
        ...tsbuf
      ])
    }

    await nodeProcessor.processRegisterMsg(registerPayload)

    const dataPayload = {
      id: '1234',
      node_id: 1,
      type: IPacketType.DATA,
      data: new Uint8Array([
        IDataType.PERIODICALLY,
        0x09,
        0x01,
        0x00,
        0xaa,
        0x00,
        0xaa,
        0x51,
        0x64,
        0xbb,
        0x00,
        0x52,
        0x64,
        0xbb,
        0x00,
        ...tsbuf
      ])
    }

    await nodeProcessor.processDataMsg(dataPayload)

    const state = nodeStore.getState()
    expect(state.stations).toHaveProperty('1')
    expect(state.stations[1].nodes).toHaveLength(2)
    expect(state.stations[1].nodes[0]).toMatchObject({
      id: 81,
      battery: 100,
      value: 187,
      valueType: 0
    })
    expect(state.stations[1].nodes[1]).toMatchObject({
      id: 82,
      battery: 100,
      value: 187,
      valueType: 1
    })
    expect(state.getNode(1, 81)).toMatchObject({
      id: 81,
      battery: 100,
      value: 187,
      valueType: 0
    })

    const sensorMetrics = await SensorMetric.find({}).lean().exec()
    expect(sensorMetrics).toHaveLength(2)
    expect(sensorMetrics[0]).toMatchObject({
      v: 187,
      meta: {
        id: "81",
        v_type: 0
      }
    })
    expect(sensorMetrics[1]).toMatchObject({
      v: 187,
      meta: {
        id: "82",
        v_type: 1
      }
    })
  })
})
