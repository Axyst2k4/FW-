import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addStationGroup,
  deleteStationGroup,
  getNodeMetrics,
  getNodes,
  getStationGroups,
  registerStation
} from '../../api/nodes'
import toast from 'react-hot-toast'

export const useNodes = (interval: number = 3000) => {
  return useQuery({
    queryKey: ['nodes'],
    queryFn: async () => {
      return await getNodes().catch((err) => {
        toast.error(err.message)
      })
    },
    refetchInterval: interval
  })
}

export const useStationList = () => {
  const { data, isLoading } = useNodes()

  if (!data) {
    return { list: [], isLoading }
  }

  return { list: Object.values(data) as any[], isLoading }
}

export const useNodeMetrics = (
  id: number,
  type: 'station' | 'sensor',
  range: 'hour' | '5hour' | 'day' = 'hour',
  raw: boolean = false,
  interval: number = 3000
) => {
  const end = new Date()
  const start = new Date()

  switch (range) {
    case 'day':
      start.setDate(start.getDate() - 1)
      break
    case 'hour':
      start.setHours(start.getHours() - 1)
      break
    case '5hour':
      start.setHours(start.getHours() - 5)
      break
  }

  return useQuery({
    queryKey: ['nodeMetrics', id, type, range],
    queryFn: async () => {
      if (!id) {
        return null
      }
      return await getNodeMetrics(id, type, start.toISOString(), end.toISOString(), raw).catch(
        (err) => {
          toast.error(err.message)
        }
      )
    },
    refetchInterval: interval
  })
}

export const useStationGroups = (interval: number = 3000) => {
  return useQuery({
    queryKey: ['stationGroups'],
    queryFn: async () => {
      return await getStationGroups().catch((err) => {
        toast.error(err.message)
      })
    },
    refetchInterval: interval
  })
}

export const useAddStationGroupFn = () => {
  return useMutation({
    mutationFn: addStationGroup,
    onError: (err) => {
      toast.error(err.message)
    },
    onSuccess: () => {
      toast.success('Station group added')
    }
  })
}

export const useRegisterStationFn = () => {
  return useMutation({
    mutationFn: registerStation,
    onError: (err) => {
      toast.error(err.message)
    },
    onSuccess: () => {
      toast.success('Station registered')
    }
  })
}

export const useDeleteStationGroupFn = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteStationGroup,
    onError: (err) => {
      toast.error(err.message)
    },
    onSuccess: () => {
      toast.success('Station group removed')
      queryClient.invalidateQueries({ queryKey: ['stationGroups'] })
    }
  })
}
