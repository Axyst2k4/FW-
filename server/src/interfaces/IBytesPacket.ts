export enum IPacketType {
  DATA = 0xf1,
  CMD = 0xf2,
  RESPDATA = 0xf3,
  RESPCMD = 0xf4,
  REG = 0xf5,
  RESPREG = 0xf6
}

export enum ResponseStatus {
  OK = 0x01,
  ERR = 0x00
}

export enum IDataType {
  PERIODICALLY = 0x01,
  NETWORK_READY = 0x02,
  SEND_STATUS = 0x03,
  REGISTER = 0x04,
  CALIBRATION = 0x05,
  LATEST = 0x06,
  CALIB_FINAL = 0x07,
  MBA_STATUS = 0x08,
  STEP_MOTOR_LIMIT = 0x09
}

export enum IPacketStatus {
  OK = 0x01,
  ERR = 0x02
}

export enum ICmd {
  // Server -> Node
  PREPARE_CALIB = 0x01,
  START_CALIB = 0x02,
  SWITCH_TRANSFORMER = 0x07,
  STEP_MOTOR_CONTROL = 0x08,

  // Node -> Server
  CALIBRATE = 0x03,
  GET_STATUS = 0x04,
  SLEEP = 0x05,
  WAKEUP = 0x06,
  GET_SENSOR_DATA = 0x0a,
  GET_STATION_DATA = 0x0b,
  SYNC_SENSOR = 0x0c
}

export interface IBytesPacket {
  node_id: number
  type: IPacketType
  data: Uint8Array
  id: string
}
