import config from '../config'

export const healthcheck = async () => {
  try {
    const res = await fetch(config.api.url + '/api/system/health')

    const json = await res.json()
    if (json.status !== 'ok') {
      return false
    }

    return true
  } catch (e) {
    return false
  }
}

export const getSyncState = async () => {
  try {
    const res = await fetch(config.api.url + '/api/system/SYNC')
    const json = await res.json()
    return json.sync
  } catch (e) {
    return false
  }
}

export const setSyncState = async (sync: boolean) => {
  try {
    const res = await fetch(config.api.url + '/api/system/SYNC', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ value: sync })
    })
    const json = await res.json()
    return json.sync
  } catch (e) {
    return false
  }
}

export const syncNow = async () => {
  try {
    const res = await fetch(config.api.url + '/api/system/SYNC/NOW', {
      method: 'POST'
    })
    const json = await res.json()
    return json.status === 'ok'
  } catch (e) {
    return false
  }
}

export const resetNodesRegistry = async () => {
  try {
    const res = await fetch(config.api.url + '/api/system/RESET_ALL', {
      method: 'DELETE'
    })
    const json = await res.json()
    return json.status === 'ok'
  } catch (e) {
    return false
  }
}

export const resetLastWake = async () => {
  try {
    const res = await fetch(config.api.url + '/api/system/RESET_LAST_WAKE', {
      method: 'POST'
    })
    const json = await res.json()
    return json.status === 'ok'
  } catch (e) {
    return false
  }
}