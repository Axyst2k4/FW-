import mongoose from 'mongoose'
import { NodeValueType } from './node'

export interface IStationMetric {
  current: number
  voltage: number
  ts: Date
  meta: {
    id: string
  }
}

export interface ISensorMetric {
  battery: number
  v: number
  ts: Date
  meta: {
    id: string
    v_type: NodeValueType
  }
}

const StationMetricSchema = new mongoose.Schema(
  {
    current: Number,
    voltage: Number,
    ts: Date,
    meta: {
      id: String
    }
  },
  {
    timeseries: {
      timeField: 'ts',
      metaField: 'meta',
      granularity: 'hours'
    }
  }
)

const SensorMetricSchema = new mongoose.Schema(
  {
    battery: Number,
    v: Number,
    ts: Date,
    meta: {
      id: String,
      v_type: Number
    }
  },
  {
    timeseries: {
      timeField: 'ts',
      metaField: 'meta',
      granularity: 'hours'
    }
  }
)

export const StationMetric = mongoose.model<IStationMetric & mongoose.Document>('StationMetric', StationMetricSchema)
export const SensorMetric = mongoose.model<ISensorMetric & mongoose.Document>('SensorMetric', SensorMetricSchema)
