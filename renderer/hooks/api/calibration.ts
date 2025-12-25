import { useMutation, useQuery } from '@tanstack/react-query'
import {
  finalizeCalibration,
  getCalibrationData,
  getCalibrationState,
  getLatestCalibration,
  prepareCalibration,
  resetCalibration,
  startCalibration
} from '../../api/calibration'
import toast from 'react-hot-toast'

export const useCalibrationState = (interval = 3000) => {
  return useQuery({
    queryKey: ['calib_state'],
    queryFn: async () => {
      return await getCalibrationState().catch((err) => {
        toast.error(err.message)
      })
    },
    refetchInterval: interval
  })
}

export const useCalibrationData = (id: string, interval = 3000) => {
  return useQuery({
    queryKey: ['calib_data', id],
    queryFn: async () => {
      return await getCalibrationData(id).catch((err) => {
        toast.error(err.message)
      })
    },
    refetchInterval: interval,
    enabled: !!id,
  })
}

export const useLatestCalibration = (interval = 3000) => {
  return useQuery({
    queryKey: ['calib_latest'],
    queryFn: async () => {
      return await getLatestCalibration().catch((err) => {
        toast.error(err.message)
      })
    },
    refetchInterval: interval,
  })
}

export const usePrepareCalibrationFn = () => {
  return useMutation({
    mutationFn: prepareCalibration,
    onError: (err) => {
      toast.error(err.message)
    },
    onSuccess: () => {
      toast.success('Calibration prepared')
    }
  })
}

export const useStartCalibrationFn = () => {
  return useMutation({
    mutationFn: startCalibration,
    onError: (err) => {
      toast.error(err.message)
    },
    onSuccess: () => {
      toast.success('Calibration started')
    }
  })
}

export const useResetCalibrationFn = () => {
  return useMutation({
    mutationFn: resetCalibration,
    onError: (err) => {
      toast.error(err.message)
    },
    onSuccess: () => {
      toast.success('Calibration reset')
    }
  })
}

export const useFinalizeCalibrationFn = () => {
  return useMutation({
    mutationFn: finalizeCalibration,
    onError: (err) => {
      toast.error(err.message)
    },
    onSuccess: () => {
      toast.success('Calibration finalized')
    }
  })
}
