import { Document, Model } from 'mongoose'
import { IUser } from '@/interfaces/IUser'
import { IRole } from '@/interfaces/IRole'
import { INode } from '@/models/node'
import { IStation } from '@/models/station'
import { ISensorMetric, IStationMetric } from '@/models/metrics'
import { ICalibrationModel, ICalibrationDataModel } from '@/models/calibration'
declare global {
  namespace Express {
    export interface Request {
      currentUser: IUser & Document
    }
  }

  namespace Models {
    export type UserModel = Model<IUser & Document>
    export type NodeModel = Model<INode & Document>
    export type StationModel = Model<IStation & Document>
    export type RoleModel = Model<IRole & Document>
    export type WhitelistModel = Model<{ email: string; addedBy: string } & Document>
    export type StationMetricModel = Model<IStationMetric & Document>
    export type SensorMetricModel = Model<ISensorMetric & Document>
    export type CalibrationModel = Model<ICalibrationModel & Document>
    export type CalibrationDataModel = Model<ICalibrationDataModel & Document>
    export type StationGroupModel = Model<{ stationIds: number[]; name: string } & Document>
  }
}
