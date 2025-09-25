import { IBytesPacket, ICmd, IDataType, IPacketType } from '@/interfaces/IBytesPacket'
import { MqttClient, Packet } from 'mqtt'
import { Service, Inject } from 'typedi'
import { Logger } from 'winston'
import crc32 from 'crc-32'
import { EventEmitter, IEventEmitter, TOPICS, getOutTopicFromNodeId, uint32touint8arr, uint8arr2int } from '@/utils'
import { P, match } from 'ts-pattern'

export interface IMQTTService extends IEventEmitter {
  processIncomingMessage(topic: TOPICS, message: Buffer, packet?: Packet): Promise<boolean>
  unpackMessage(bytes: Uint8Array): IBytesPacket
  packMessage(
    node_id: number,
    package_type: IPacketType,
    data: Uint8Array
  ): { bytes: Uint8Array; checksum: number }
  validateMessage(bytes: Uint8Array): boolean
  send(node_id: number, type: IPacketType, data: Uint8Array): number
  broadcast(type: IPacketType, data: Uint8Array): number
}

@Service()
export default class MQTTService extends EventEmitter implements IMQTTService {
  constructor(
    @Inject('logger') private logger: Logger,
    @Inject('mqttClient') private mqttClient: MqttClient
  ) {
    super()
  }

  async processIncomingMessage(topic: TOPICS, message: Buffer, packet?: Packet): Promise<boolean> {
    if (!Object.values(TOPICS).includes(topic)) {
      this.logger.warn('Invalid Topic received: %s', topic)
      return false
    }

    const bytes = new Uint8Array(message)
    if (topic === TOPICS.SVR_IN) {
      if (!this.validateMessage(bytes)) {
        this.logger.error('Invalid checksum message received')
        console.log(Buffer.from(bytes).toString())
        return false
      }
      const payload = this.unpackMessage(bytes)
      match([payload.type, payload.data[0]])
        .with([IPacketType.REG, IDataType.REGISTER], () => this.emit('register', payload))
        .with([IPacketType.DATA, IDataType.REGISTER], () => this.emit('register', payload))
        .with([IPacketType.DATA, IDataType.PERIODICALLY], () => this.emit('data', payload))
        .with([IPacketType.CMD, ICmd.GET_STATUS], () => {
          this.emit('cmd:get_status', payload)
        })
        .with([IPacketType.CMD, ICmd.SWITCH_TRANSFORMER], () =>
          this.emit('cmd:switch_transformer', payload)
        )
        .with([IPacketType.CMD, ICmd.STEP_MOTOR_CONTROL], () =>
          this.emit('cmd:step_motor_control', payload)
        )
        .with([IPacketType.DATA, IDataType.NETWORK_READY], () => this.emit('calib:ready', payload))
        .with([IPacketType.DATA, IDataType.CALIBRATION], () => this.emit('calib:data', payload))
        .with([IPacketType.RESPCMD, P._], () => this.emit('cmd:resp', payload))
        .with([IPacketType.DATA, IDataType.MBA_STATUS], () => this.emit('data:mba:status', payload))
        .with([IPacketType.DATA, IDataType.STEP_MOTOR_LIMIT], () => this.emit('data:motor_limit', payload))
        .with([IPacketType.CMD, ICmd.GET_SENSOR_DATA], () => this.emit('cmd:get_sensor_data', payload))
        .with([IPacketType.CMD, ICmd.GET_STATION_DATA], () => this.emit('cmd:get_station_data', payload))

        .otherwise(() => {
          this.logger.error('Invalid message type: %i', payload.type)
        })
    }
    return true
  }

  unpackMessage(bytes: Uint8Array): IBytesPacket {
    const checksum = uint8arr2int(bytes.slice(-4))
    const payload = bytes.slice(0, -4)
    const nodeId = payload[0]
    const type = payload[1] as IPacketType
    const data = payload.slice(2)
    return {
      id: checksum.toString(16),
      node_id: nodeId,
      type,
      data
    }
  }

  packMessage(node_id: number, package_type: IPacketType, data: Uint8Array) {
    const payload = new Uint8Array([node_id, package_type, ...data])
    const checksum = crc32.buf(payload) >>> 0
    const bytes = new Uint8Array([...payload, ...uint32touint8arr(checksum)])
    return { bytes, checksum }
  }

  validateMessage(bytes: Uint8Array): boolean {
    const checksum = uint8arr2int(bytes.slice(-4), true)
    const payload = new Uint8Array([...bytes.slice(0, -4)])
    const crc = crc32.buf(payload) >>> 0
    return checksum === crc
  }

  send(node_id: number, type: IPacketType, data: Uint8Array) {
    const { bytes, checksum } = this.packMessage(node_id, type, data)
    this.mqttClient.publish(getOutTopicFromNodeId(node_id), Buffer.from(bytes))
    return checksum
  }

  broadcast(type: IPacketType, data: Uint8Array) {
    const { bytes, checksum } = this.packMessage(0xff, type, data)
    this.mqttClient.publish(TOPICS.SVR_OUT, Buffer.from(bytes))
    return checksum
  }
}
