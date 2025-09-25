import mqtt from 'mqtt'
import config from '../../src/config'
import { TOPICS, int2uint8arr, uint32touint8arr, uint8arr2int } from '../../src/utils'
import { IBytesPacket, IPacketStatus, IPacketType } from '../../src/interfaces/IBytesPacket'
import crc32 from 'crc-32'

const NODEID = 4
const CHILD1 = 81
const CHILD2 = 82
console.log('NODEID:', NODEID)
console.log('MQTT URL:', config.mqttURL)

const mqttClient = mqtt.connect(config.mqttURL!, {
  clientId: `STATION_${NODEID}`,
  // clean: false
  username: 'admin',
  password: 'password'
})

const INTERVAL_MS = 15_000

const nodeInfo = {
  nid: NODEID,
  type: 0xff, // 0xff is a station
  status: 0
}

function unpackMessage(bytes: Uint8Array): IBytesPacket {
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

function packMessage(node_id: number, package_type: IPacketType, data: Uint8Array) {
  const payload = new Uint8Array([node_id, package_type, ...data])
  const checksum = crc32.buf(payload) >>> 0
  const bytes = new Uint8Array([...payload, ...uint32touint8arr(checksum)])
  return { bytes, checksum }
}

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min //The maximum is exclusive and the minimum is inclusive
}

function toSensorValue(value: number) {
  // x = (y + 3) * 1000 / 2
  return ((value + 3) * 1000) / 2
}

const zero = int2uint8arr(toSensorValue(0), 2)

function sendPing(node) {
  const current = int2uint8arr(0, 2)
  const voltage = int2uint8arr(0, 2)
  const time = int2uint8arr(Math.floor(new Date().getTime() / 1000), 4)

  const data = Buffer.from([
    0x01, // Data type: Periodically
    node.nid,
    ...current,
    0x00,
    ...voltage,
    CHILD1,
    84,
    ...zero,
    0,
    CHILD2,
    84,
    ...zero,
    0,
    ...time
  ])
  const packet = packMessage(node.nid, IPacketType.DATA, data)
  mqttClient.publish(TOPICS.SVR_IN, Buffer.from(packet.bytes), () => {
    console.log('published DATA')
  })
}

function sendReady(node) {
  const data = Buffer.from([
    0x02, // Data type: Network ready
    0x01, // Status: OK
    CHILD1,
    0x01,
    CHILD2,
    0x01
  ])
  const packet = packMessage(node.nid, IPacketType.DATA, data)
  console.log(packet)
  mqttClient.publish(TOPICS.SVR_IN, Buffer.from(packet.bytes), () => {
    console.log('published DATA')
  })
}

function sendCalibrationValue(node) {
  const samples1 = [...Array(50)].map(() =>
    int2uint8arr(toSensorValue(getRandomInt(-2300, -200) / 1000), 2)
  )
  const samples2 = [...Array(50)].map(() =>
    int2uint8arr(toSensorValue(getRandomInt(-2300, -200) / 1000), 2)
  )
  const samples1Buffer = Buffer.concat(samples1)
  const samples2Buffer = Buffer.concat(samples2)
  console.log(samples1Buffer.length, samples2Buffer.length)

  const time = int2uint8arr(Math.floor(new Date().getTime() / 1000), 4)
  const data = Buffer.from([
    0x05, // Data type: Calibration
    node.nid,
    0x00,
    0x00, // Current
    0x00,
    0x00, // Voltage
    CHILD1,
    ...samples1Buffer,
    CHILD2,
    ...samples2Buffer,
    ...time
  ])
  const packet = packMessage(node.nid, IPacketType.DATA, data)
  console.log(packet)
  mqttClient.publish(TOPICS.SVR_IN, Buffer.from(packet.bytes), () => {
    console.log('published CALIB')
  })
}

mqttClient.on('connect', function (connack) {
  console.log('MQTT Client connected: %o', connack)
  // subscribe to topic SVR_OUT
  mqttClient.subscribe(TOPICS.SVR_OUT, (err, granted) => {
    if (!err) {
      console.log('Subscribed to topic "svr/out"')
      // Send INFO packet every 20 seconds
      setInterval(() => {
        sendPing(nodeInfo)
      }, INTERVAL_MS)
    }
  })
})

mqttClient.on('message', (topic, message, packet) => {
  if (topic !== TOPICS.SVR_OUT) {
    return
  }
  // unpack the message, If receive a CMD packet with type 0x00, send a DATA packet after received timestamp in CMD packet
  const bytes = new Uint8Array(message)
  const packetInfo = unpackMessage(bytes)
  if (packetInfo.type === IPacketType.CMD) {
    switch (packetInfo.data[0]) {
      case 0x01:
        console.log('CMD 0x01: Prepare calibration')
        setTimeout(() => {
          sendReady(nodeInfo)
        }, 5000)
        break
      case 0x02:
        console.log('CMD 0x02: Start calibration')
        setTimeout(() => {
          sendCalibrationValue(nodeInfo)
        }, 5000)
        break
      default:
        console.log(packetInfo)
    }
  }
})
