import config from '../config'

export const getNodes = async () => {
  const res = await fetch(config.api.url + '/api/node')
  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(json.message)
  }

  return json.data
}

export const getNodeMetrics = async (
  id: number,
  type: 'station' | 'sensor',
  start: string,
  end: string,
  raw: boolean = false
) => {
  const res = await fetch(
    config.api.url +
      '/api/data/' +
      type +
      '?id=' +
      id +
      '&start=' +
      start +
      '&end=' +
      end +
      '&raw=' +
      raw
  )
  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(json.message)
  }

  return json.data
}

export const switchTransformer = async (id: number, state: boolean) => {
  const res = await fetch(config.api.url + '/api/node/cmd/switch_transformer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id,
      state
    })
  })
  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(json.message)
  }
  return true
}

export const controlStepMotor = async (
  id: number,
  value: number,
  unit: 'step' | 'percent',
  direction: 'inc' | 'dec'
) => {
  const res = await fetch(config.api.url + '/api/node/cmd/control_step_motor', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id,
      value,
      unit,
      direction
    })
  })
  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(json.message)
  }
  return true
}

export const controlStepMotorDirectGroup = async (group: string, value: number) => {
  const res = await fetch(config.api.url + '/api/node/cmd/g/control_step_motor/direct', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      group,
      value
    })
  })
  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(json.message)
  }
  return true
}

export const switchTransformerGroup = async (group: string, state: boolean) => {
  const res = await fetch(config.api.url + '/api/node/cmd/g/switch_transformer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      group,
      state
    })
  })
  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(json.message)
  }
  return true
}

export const controlStepMotorGroup = async (
  group: string,
  value: number,
  unit: 'step' | 'percent',
  direction: 'inc' | 'dec'
) => {
  const res = await fetch(config.api.url + '/api/node/cmd/g/control_step_motor', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      group,
      value,
      unit,
      direction
    })
  })
  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(json.message)
  }
  return true
}

export const controlStepMotorDirect = async (id: number, value: number) => {
  const res = await fetch(config.api.url + '/api/node/cmd/control_step_motor/direct', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id,
      value
    })
  })
  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(json.message)
  }
  return true
}

export const addStationGroup = async ({
  name,
  stationIds
}: {
  name: string
  stationIds: number[]
}) => {
  const res = await fetch(config.api.url + '/api/node/group/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      stationIds
    })
  })
  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(json.message)
  }
  return true
}

export const registerStation = async ({
  id,
  nodes
}: {
  id: number
  nodes: {
    id: number
    valueType: number
  }[]
}) => {
  const res = await fetch(config.api.url + '/api/node/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id,
      nodes
    })
  })
  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(json.message)
  }
  return true
}

export const deleteStationGroup = async (name: string) => {
  const res = await fetch(config.api.url + '/api/node/group/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name
    })
  })

  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(json.message)
  }
  return true
}

export const deleteStation = async (id: number) => {
  const res = await fetch(config.api.url + '/api/node/' + id, {
    method: 'DELETE'
  })

  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(json.message)
  }
  return true
}

export const getStationGroups = async () => {
  const res = await fetch(config.api.url + '/api/node/group')
  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(json.message)
  }
  return json.data
}
