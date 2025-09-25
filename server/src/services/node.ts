import { Inject, Service } from 'typedi'

Service()
export class NodeService {
  constructor(@Inject('stationGroupModel') private _stationGroupModel: Models.StationGroupModel) {}

  async getAllStationGroups() {
    return this._stationGroupModel.find({}).lean()
  }

  async addStationGroup(name: string, stationIds: string[]) {
    const existed = await this._stationGroupModel.findOne({ name })
    if (existed) {
      existed.updateOne({ $addToSet: { stationIds: stationIds } })
    } else {
      this._stationGroupModel.create({ name, stationIds })
    }
  }

  async removeStationFromGroup(name: string, stationId: string) {
    const existed = await this._stationGroupModel.findOne({ name })
    if (existed) {
      existed.updateOne({ $pull: { stationIds: stationId } })
    }
  }

  async deleteStationGroup(name: string) {
    return this._stationGroupModel.deleteOne({ name })
  }

  async getGroup(name: string) {
    return this._stationGroupModel.findOne({ name }).lean();
  }
}
