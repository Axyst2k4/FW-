import { createStore, StoreApi } from 'zustand/vanilla'
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware'
import StateModel, { CALIB_STATE, SYSTEM_STATE } from '@/models/state'
import { IStation, IStationWithNodes, SensorMode } from '@/models/node'
import { INode } from '@/models/node'

const MongoStorage: StateStorage = {
  getItem: async (key: string) => {
    return (await StateModel.findOne({ key }).lean().exec()).value
  },
  setItem: async (key: string, value: string) => {
    StateModel.updateOne({ key }, { value }, { upsert: true }).exec()
  },
  removeItem: async (key: string) => {
    StateModel.deleteOne({ key }).exec()
  }
}

export interface ICalibrationHistory {
  id: string
  transition?: string
  state?: CALIB_STATE
  message: string
  createdAt: Date
}

export interface IRegistryStoreState {
  stations: { [id: number]: IStationWithNodes }
  systemState: SYSTEM_STATE
  calibState: CALIB_STATE
  calibrationId: string
  calibrationHistory: ICalibrationHistory[]
  lastWake: Date | null
  lastRegister: Date | null
  sync: boolean
  setSync: (sync: boolean) => void
  getStations: () => { [id: number]: IStationWithNodes }
  getStation: (id: number) => IStationWithNodes
  deleteStation: (id: number) => void
  getLiveStations: () => IStationWithNodes[]
  getLiveNodes: () => INode[]
  shouldSync: () => boolean
  setLastWake: () => void
  setLastRegister: () => void
  clearLastRegister: () => void
  resetLastWake: () => void
  countAwakeSensorNodes: () => number
  isAllSensorNodesAwake: () => boolean
  isAllSensorNodesSleep: () => boolean
  isCalibrating: () => boolean
  isFirstRegOfTheDay: () => boolean
  getAwakeSensorNodes: () => INode[]
  registerStation: (station: IStationWithNodes) => void
  updateStation: (station: Partial<IStation>) => void
  updateNode: (nodeId: number, data: INode) => void
  getNode: (stationId: number, nodeId: number) => INode
  getSensorById: (id: number) => INode
  addCalibrationHistory: (history: ICalibrationHistory) => void
  clearCalibrationHistory: () => void
  getStatus: () => {
    activeStations: number
    nonActiveStations: number
    activeSensors: number
    nonActiveSensors: number
  }
  clear: () => void
  clearCalib: () => void
}

export type IRegistryStore = StoreApi<IRegistryStoreState>

export const createRegistryStore = () => {
  return createStore<IRegistryStoreState>()(
    persist(
      (set, get) => ({
        systemState: SYSTEM_STATE.OK,
        calibState: CALIB_STATE.NONE,
        calibrationId: '',
        lastRegister: null,
        calibrationHistory: [],
        calibrationReason: '',
        stations: {},
        lastWake: null,
        sync: false,
        shouldSync: () => {
          if (!get().sync) return false
          const { lastWake } = get()
          if (!lastWake) return true

          const diff = new Date().getTime() - new Date(lastWake).getTime()
          const SIX_HOURS = 6 * 60 * 60 * 1000
          return diff > SIX_HOURS
        },

        isFirstRegOfTheDay: () => {
          // Should account for timezone gmt+7
          const now = new Date()
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
          const last = get().lastRegister
          console.log(last)
          if (!last) return true
          return last < today
        },

        setLastRegister: () => {
          set({ lastRegister: new Date() })
        },

        clearLastRegister: () => {
          set({ lastRegister: null })
        },

        isCalibrating: () => {
          const { calibState } = get()
          return (
            calibState === CALIB_STATE.CALIBRATING ||
            calibState === CALIB_STATE.READY ||
            calibState === CALIB_STATE.PREPARE
          )
        },

        setSync: (sync: boolean) => {
          console.log('set sync', sync)
          set({ sync })
          console.log('sync', get().sync)
        },

        getStation: (id: number) => {
          const { stations } = get()
          return stations[id]
        },

        deleteStation: (id: number) => {
          const { stations } = get()
          delete stations[id]
          set({ stations })
        },

        setLastWake: () => {
          set({ lastWake: new Date() })
        },

        resetLastWake: () => {
          set({ lastWake: null })
        },

        countAwakeSensorNodes: () => {
          const stations = get().getLiveStations()
          let count = 0
          for (const station of stations) {
            for (const node of Object.values(station.nodes)) {
              if (node.mode === SensorMode.AWAKE) {
                count++
              }
            }
          }
          return count
        },

        isAllSensorNodesSleep: () => {
          const stations = get().getLiveStations()
          for (const station of stations) {
            for (const node of station.nodes) {
              if (node.mode !== SensorMode.SLEEP && node.mode !== SensorMode.UNKNOWN) {
                return false
              }
            }
          }
          return true
        },

        isAllSensorNodesAwake: () => {
          const stations = get().getLiveStations()
          for (const station of stations) {
            for (const node of station.nodes) {
              if (node.mode !== SensorMode.AWAKE && node.mode !== SensorMode.UNKNOWN) {
                return false
              }
            }
          }
          return true
        },

        getAwakeSensorNodes: () => {
          const stations = get().getLiveStations()
          const nodes = []
          for (const station of stations) {
            for (const node of station.nodes) {
              if (node.mode === SensorMode.AWAKE) {
                nodes.push(node)
              }
            }
          }
          return nodes
        },

        getStations: () => {
          if (!get()?.stations) return []
          const stations = { ...get().stations }

          for (const stationId in stations) {
            const station = stations[stationId]

            // if (!station?.nodes?.length) continue
            for (const node of station?.nodes) {
              if (node.mode === SensorMode.UNKNOWN) {
                node.status = 2
              } else {
                const diff = new Date().getTime() - new Date(node.updatedAt).getTime()
                if (diff > 200 * 1000) {
                  node.status = 2
                } else {
                  node.status = 1
                }
              }
            }
          }
          return Object.values(stations)
        },
        getLiveStations: () => {
          return Object.values(get().stations).filter((station) => {
            const diff = new Date().getTime() - new Date(station.updatedAt).getTime()
            if (diff > 300 * 1000) {
              return false
            }
            return true
          })
        },
        getLiveNodes: () => {
          const stations = get().getLiveStations()
          const nodes = []
          for (const station of stations) {
            if (!station?.nodes) continue
            nodes.push(...station.nodes)
          }
          return nodes
        },
        registerStation: (station: IStationWithNodes) => {
          const { id } = station
          const { stations } = get()
          stations[id] = station

          set({ stations })
        },
        updateStation: (station: Partial<IStation>) => {
          const { id } = station

          const { stations } = get()
          const oldStation = stations[id]
          if (!oldStation) return undefined

          stations[id] = { ...oldStation, ...station }
          set({ stations })
        },
        updateNode: (nodeId: number, data: INode) => {
          const { parent } = data
          const { stations } = get()
          const station = stations[parent]

          if (!station?.nodes) return undefined
          for (const node of station?.nodes) {
            if (node.id === nodeId) {
              Object.assign(node, data)
              break
            }
          }
          set({ stations })
        },
        getNode: (stationId: number, nodeId: number) => {
          const { stations } = get()
          const station = stations[stationId]
          if (!station?.nodes) return undefined

          return station.nodes.find((node) => node.id === nodeId)
        },
        getSensorById: (id: number) => {
          const stations = get().getLiveStations()
          for (const station of stations) {
            for (const node of station.nodes) {
              if (node.id === id) {
                return node
              }
            }
          }
        },
        addCalibrationHistory: (history: ICalibrationHistory) => {
          const { calibrationHistory } = get()
          calibrationHistory.push(history)
          set({ calibrationHistory })
        },
        clearCalibrationHistory: () => {
          set({ calibrationHistory: [] })
        },
        getStatus: () => {
          const MAX_TIMEOUT_SECS = 200 // 200s
          let activeStations = 0
          let nonActiveStations = 0
          let activeSensors = 0
          let nonActiveSensors = 0

          const { stations } = get()
          for (const station of Object.values(stations)) {
            const diff = new Date().getTime() - station.updatedAt.getTime()
            if (diff > MAX_TIMEOUT_SECS * 1000) {
              nonActiveStations++
            } else {
              activeStations++
            }
            for (const node of station?.nodes) {
              const { updatedAt } = node
              const now = new Date().getTime()
              const diff = now - updatedAt.getTime()
              if (diff > MAX_TIMEOUT_SECS * 1000) {
                nonActiveSensors++
              } else {
                activeSensors++
              }
            }
          }

          return {
            activeStations,
            nonActiveStations,
            activeSensors,
            nonActiveSensors
          }
        },
        clear: () => set({ stations: {} }),
        clearCalib: () => {
          set({ calibState: CALIB_STATE.NONE })
          set({ calibrationId: '' })
          set({ calibrationHistory: [] })
        }
      }),
      {
        name: 'registry',
        storage: createJSONStorage(() => MongoStorage),
        skipHydration: true,
        onRehydrateStorage: (state) => {
          console.log('hydration starts')
          console.log(state)

          // optional
          return (state, error) => {
            if (error) {
              console.log('an error happened during hydration', error)
            } else {
              console.log('hydration finished')
            }
          }
        }
      }
    )
  )
}
