import config from '../config'

export const getCalibrationState = async () => {
  const res = await fetch(config.api.url + '/api/calibration/status')

  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(json.message)
  }

  return json.data
}

export const getCalibrationData = async (id: string) => {
  const res = await fetch(config.api.url + '/api/calibration/' + id)

  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(json.message)
  }

  return json.data
}

export const getLatestCalibration = async () => {
  const res = await fetch(config.api.url + '/api/calibration/latest')

  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(json.message)
  }

  return json.data
}

export const prepareCalibration = async () => {
  const res = await fetch(config.api.url + '/api/calibration/prepare', {
    method: 'POST'
  })
  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(json.message)
  }
  return true
}

export const startCalibration = async () => {
  const res = await fetch(config.api.url + '/api/calibration/start', {
    method: 'POST'
  })
  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(json.message)
  }
  return true
}

export const resetCalibration = async () => {
  const res = await fetch(config.api.url + '/api/calibration/RESET_CALIBRATION', {
    method: 'DELETE'
  })
  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(json.message)
  }
  return true
}

export const finalizeCalibration = async (current: number) => {
  const res = await fetch(config.api.url + '/api/calibration/finish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ current })
  })
  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(json.message)
  }
  return true
}