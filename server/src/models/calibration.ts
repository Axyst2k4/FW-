import mongoose, { Document, Schema, model } from 'mongoose'

export interface ICalibration {
  _id: string
  createdAt: Date
  finishedAt: Date
  finalCurrent?: number
  error?: string
}

export interface ICalibrationModel extends ICalibration, Document {
  _id: string
}

const CalibrationSchema = new Schema(
  {
    finishedAt: {
      type: Date
    },
    error: {
      type: String
    },
    finalCurrent: {
      type: Number
    }
  },
  {
    timestamps: true
  }
)

export const CalibrationModel = model<ICalibrationModel>('Calibration', CalibrationSchema)

export interface ICalibrationData {
  nodeId: number
  calibrationId: string
  values: number[]
  type: number
}

export interface ICalibrationDataModel extends ICalibrationData, Document {}

const CalibrationDataSchema = new Schema(
  {
    nodeId: {
      type: Number,
      required: true,
      index: true
    },
    calibrationId: {
      type: mongoose.Types.ObjectId,
      ref: 'Calibration',
      required: true,
      index: true
    },
    values: {
      type: [Number],
      required: true
    },
    type: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
)

export const CalibrationDataModel = model<ICalibrationDataModel>(
  'CalibrationData',
  CalibrationDataSchema
)
