
import { Schema, model, Document } from 'mongoose';

export interface ISystemEvent {
  type: string;
  data: any;
  createdAt: Date;
}

export enum SystemEventType {
  NODE_CONNECTED = 'NODE_CONNECTED',
  NODE_DISCONNECTED = 'NODE_DISCONNECTED',
  NODE_FAILED = 'NODE_FAILED',
  NODE_PENDING = 'NODE_PENDING',
  NODE_CALIBRATED = 'NODE_CALIBRATED',
  NODE_CALIBRATION_FAILED = 'NODE_CALIBRATION_FAILED',
  NODE_CALIBRATION_TIMEOUT = 'NODE_CALIBRATION_TIMEOUT',

  NODE_DATA = 'NODE_DATA',
  NODE_DATA_ERROR = 'NODE_DATA_ERROR',

  PREPARE_CALIBRATION = 'PREPARE_CALIBRATION',
  START_CALIBRATION = 'START_CALIBRATION',
  END_CALIBRATION = 'END_CALIBRATION',
  CALIBRATION_STOPPED = 'CALIBRATION_STOPPED',

  SYSTEM_STATE_CHANGED = 'SYSTEM_STATE_CHANGED',
}

const SystemEventSchema = new Schema({
  type: {
    type: String,
    required: true,
    index: true,
  },
  data: {
    type: Object,
    required: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

export default model<ISystemEvent & Document>('SystemEvent', SystemEventSchema);
