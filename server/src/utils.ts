import { ICmd, IPacketStatus, IPacketType } from './interfaces/IBytesPacket'
import { AsyncParser } from '@json2csv/node'

export enum TOPICS {
  SVR_IN = 'WSL/STATION2SERVER',
  SVR_OUT = 'WSL/SERVER2STATION'
}

export function getOutTopicFromNodeId(nodeId: number) {
  return `${TOPICS.SVR_OUT}/${nodeId}`
}

export function uint8arr2int(arr: Uint8Array, unsigned?: boolean): number {
  const buff = Buffer.from(arr)
  if (unsigned) {
    return buff.readUIntBE(0, arr.length)
  }
  return buff.readIntBE(0, arr.length)
}

export function int2uint8arr(num: number, byteCount: number = 2): Uint8Array {
  const buff = Buffer.alloc(byteCount)
  buff.writeIntBE(num, 0, byteCount)
  return new Uint8Array(buff)
}

export function uint32touint8arr(num: number): Uint8Array {
  const buff = Buffer.alloc(4)
  buff.writeUInt32BE(num, 0)
  return new Uint8Array(buff)
}

export function uint8arr2uint(arr: Uint8Array): number {
  const buff = Buffer.from(arr)
  return buff.readUIntBE(0, arr.length)
}

export function getNodeKey(nid: number, type: number) {
  const keyPrefixMap = {
    0: 'ss',
    1: 'st'
  }
  const keyPrefix = keyPrefixMap[type]
  const key = `${keyPrefix}-${nid}`
  return key
}

// function flatten all values in an object
export function flattenValues(obj: any) {
  const result = []

  function runner(obj: any, res) {
    for (const value of Object.values(obj)) {
      if (typeof value === 'object') {
        runner(value, res)
      } else {
        result.push(value)
      }
    }
  }
  runner(obj, result)
  return result
}

export const PERMISSION = {
  NODE: {
    READ: 'NODE:READ',
    READ_ALL: 'NODE:READ:ALL'
  },
  USER: {
    READ: 'USER:READ',
    WRITE: 'USER:WRITE'
  },
  SYSTEM: {
    READ: 'SYSTEM:READ',
    WRITE: 'SYSTEM:WRITE'
  },
  ROLE: {
    READ: 'ROLE:READ',
    WRITE: 'ROLE:WRITE'
  }
}

export const BytePacket = {
  [0xf1]: IPacketType.DATA,
  [0xf2]: IPacketType.CMD,
  [0xf3]: IPacketType.RESPDATA,
  [0xf4]: IPacketType.RESPCMD,
  [0xf5]: IPacketType.REG
}

export const BytePacketStatus = {
  [0x01]: IPacketStatus.OK,
  [0x02]: IPacketStatus.ERR
}

export const ByteCmd = {
  [0x01]: ICmd.PREPARE_CALIB,
  [0x02]: ICmd.START_CALIB,
  [0x03]: ICmd.CALIBRATE,
  [0x04]: ICmd.GET_STATUS,
  [0x05]: ICmd.SLEEP,
  [0x06]: ICmd.WAKEUP
}

export const isStation = (nodeId: number) => nodeId <= 0x50
export const PERMLIST = flattenValues(PERMISSION)

export interface IEventEmitter {
  emit(event: string, ...args: any): void
  on(event: string, cb: any): void
  off(event: string, cb: any): void
}

export type SubscriptionStop = () => void

export class EventEmitter implements IEventEmitter {
  events: any = {}

  emit(event: string, ...args: any) {
    for (let i of this.events[event] || []) {
      i(...args)
    }
  }

  on(event: string, cb: any): SubscriptionStop {
    ;(this.events[event] = this.events[event] || []).push(cb)
    return () => {
      this.off(event, cb)
    }
  }

  off(event: string, cb: any) {
    this.events[event] = this.events[event].filter((i: any) => i !== cb)
  }
}

export function success(data?: any) {
  return {
    status: 'success',
    data: data || {}
  }
}

export function error(message: string) {
  return {
    status: 'error',
    message
  }
}

export const downloadResource = async (res, fileName, data, opts?) => {
  try {
    const parser = new AsyncParser(opts)
    res.header('Content-Type', 'text/csv')
    res.attachment(fileName)
    const csv = await parser.parse(data).promise();
    res.send(`sep=,\n${csv}`)
  } catch (e) {
    console.log('error', e)
    res.status(500).json(error('Error while downloading file'))
  }
}
