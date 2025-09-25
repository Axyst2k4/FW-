import mongoose from 'mongoose'

export enum SYSTEM_STATE {
  OK,
  WARN,
  CALIBRATE
}

export enum CALIB_STATE {
  NONE = 'none',
  PREPARE = 'preparing',
  READY = 'ready',
  CALIBRATING = 'calibrating',
  DONE = 'done',
  ERROR = 'error',
  WARN = 'warning'
}

export interface INodeRequest {
  hash: string
  meta?: any
  retries?: number
  timer?: NodeJS.Timeout
  promise: Promise<any>
}

const State = new mongoose.Schema({
  key: String,
  value: String
})

export default mongoose.model<{ key: string; value: string }>('State', State)
