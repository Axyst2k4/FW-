export enum NodeValueType {
  VP = 0x01,
  VNA = 0x02
}

export enum NodeStatus {
  PENDING = 0x00,
  CONNECTED = 0x01,
  DISCONNECTED = 0x02,
  FAILED = 0x03
}

export enum SensorMode {
  SLEEP = 0x00,
  AWAKE = 0x01,
  CALIBRATING = 0x02,
  UNKNOWN = 0xf
}

export interface INode {
  id: number
  value: number
  status: NodeStatus
  valueType: NodeValueType
  parent: number
  rtc: number
  battery: number
  mode: SensorMode

  createdAt: Date
  updatedAt: Date
}

export enum MotorBound {
  NONE = 0,
  MIN = 1,
  MAX = 2
}

export interface IStation {
  id: number
  name?: string
  location?: string
  current: number
  voltage: number
  rtc: number

  contactor?: boolean
  motorBound?: MotorBound

  createdAt?: Date
  updatedAt: Date
}

export interface IStationWithNodes extends IStation {
  nodes: INode[]
}
