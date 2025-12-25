import { useMutation, useQuery } from '@tanstack/react-query'
import { getSyncState, setSyncState } from '../../api/system'
import toast from 'react-hot-toast'

export const useSyncState = () => {
  return useQuery({
    queryKey: ['syncState'],
    queryFn: async () => {
      return await getSyncState().catch((err) => {
        toast.error(err.message)
      })
    },
    refetchInterval: 3000
  })
}

export const useSetSyncStateFn = () => {
  return useMutation({
    mutationFn: setSyncState,
    onSuccess: () => {
      toast.success('Sync state updated')
    },
    onError: (err) => {
      toast.error(err.message)
    }
  })
}
