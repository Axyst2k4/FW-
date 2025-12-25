import mongoose, { Schema } from 'mongoose'

export interface IStationGroup {
  stationIds: number[]
  name: string
}

export interface IStationGroupDocument extends IStationGroup, mongoose.Document {}

const StationGroupSchema = new Schema({
  stationIds: [Number],
  name: {
    index: true,
    unique: true,
    type: String
  }
})

export const StationGroup = mongoose.model<IStationGroupDocument>(
  'StationGroup',
  StationGroupSchema
)
