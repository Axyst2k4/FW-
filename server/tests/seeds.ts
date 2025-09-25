import mongoose from 'mongoose'
import { StationMetric, SensorMetric, IStationMetric, ISensorMetric } from '../src/models/metrics'

async function main() {
  const connection = await mongoose.connect('mongodb://localhost:27017/cps', {})

  const stationMetrics: IStationMetric[] = []
  const sensorMetrics: ISensorMetric[] = []
  const now = new Date()

  for (let i = 0; i < 1000; i++) {
    const ts = new Date(now.getTime() - Math.random() * 1000 * 60 * 60 * 24)
    const stationMetric: IStationMetric = {
      ts,
      meta: {
        id: '8'
      },
      current: Math.random() * 100,
      voltage: Math.random() * 100
    }

    stationMetrics.push(stationMetric)

    for (let j = 0; j < 1000; j++) {
      const sensorMetric: ISensorMetric = {
        ts,
        meta: {
          id: `81`,
          v_type: 1
        },
        battery: Math.random() * 100,
        v: Math.random() * 100
      }

      sensorMetrics.push(sensorMetric)
    }
  }

  await StationMetric.insertMany(stationMetrics)
  await SensorMetric.insertMany(sensorMetrics)
  console.log('done')
}

main()
