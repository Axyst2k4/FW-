import { Button, Card, Divider, InputNumber, Select, Space, Switch, Tag } from 'antd'
import MainLayout from '../layouts/main'
import { useNodes, useStationGroups } from '../hooks/api/nodes'
import { useEffect, useRef, useState } from 'react'
import Title from 'antd/lib/typography/Title'
import { useMutation } from '@tanstack/react-query'
import {
  controlStepMotor,
  controlStepMotorDirect,
  controlStepMotorDirectGroup,
  controlStepMotorGroup,
  switchTransformer,
  switchTransformerGroup
} from '../api/nodes'
import toast from 'react-hot-toast'
import { VoltageControl } from '../components/Control'

const StationControl = () => {
  const { data, isLoading } = useNodes()
  const stationList = data
    ? Object.values(data).map((station: any) => {
        return {
          label: `Station ${station.id}`,
          value: station.id
        }
      })
    : []
  const [selectedStationId, setSelectedStationId] = useState(null)
  const [selectedStation, setSelectedStation] = useState(null)

  useEffect(() => {
    if (selectedStationId && data) {
      setSelectedStation(data?.find((station: any) => station.id === selectedStationId))
    }
  }, [data, selectedStationId])
  const contactorControl = useMutation({
    mutationFn: (data: { stationId: number; status: boolean }) => {
      return switchTransformer(data.stationId, data.status)
    },
    onSuccess: () => {
      toast.success('Đã gửi lệnh điều khiển thành công')
    },
    onError: (error) => {
      toast.error('Đã có lỗi xảy ra')
    }
  })

  const motorControl = useMutation({
    mutationFn: (data: {
      stationId: number
      value: number
      unit: 'step' | 'percent'
      direction: 'inc' | 'dec'
    }) => {
      return controlStepMotor(data.stationId, data.value, data.unit, data.direction)
    },
    onSuccess: () => {
      toast.success('Đã gửi lệnh điều khiển thành công')
    },
    onError: (error) => {
      toast.error('Đã có lỗi xảy ra')
    }
  })

  const motorDirectControl = useMutation({
    mutationFn: (data: { stationId: number; value: number }) => {
      return controlStepMotorDirect(data.stationId, data.value)
    },
    onSuccess: () => {
      toast.success('Đã gửi lệnh điều khiển thành công')
    },
    onError: (error) => {
      toast.error('Đã có lỗi xảy ra')
    }
  })

  return (
    <>
      <Divider />
      <Space>
        <h3>Station: </h3>
        <Select style={{ width: 120 }} options={stationList} onChange={setSelectedStationId} />
      </Space>
      {selectedStationId && (
        <>
          <Divider />
          <Space direction="vertical">
            <div>
              Trạng thái contactor:{' '}
              <span>
                {selectedStation?.contactor ? (
                  <Tag color="green">Bật</Tag>
                ) : (
                  <Tag color="red">Tắt</Tag>
                )}
              </span>
              <br />
            </div>{' '}
            <Space align="center">
              <Title level={5} style={{ margin: 0 }}>
                Điều khiển contactor:
              </Title>
              <Button
                type="primary"
                onClick={() =>
                  contactorControl.mutateAsync({ stationId: selectedStationId, status: true })
                }
                disabled={selectedStation?.contactor}
                color="green"
              >
                Bật
              </Button>
              <Button
                type="primary"
                onClick={() =>
                  contactorControl.mutateAsync({ stationId: selectedStationId, status: false })
                }
                danger
                disabled={!selectedStation?.contactor}
              >
                Tắt
              </Button>
            </Space>
            <Divider />
            <Title level={5} style={{ margin: 0 }}>
              Điều khiển Điện áp:
            </Title>
            <VoltageControl station={selectedStation} />
            {/* <Divider plain>Hoặc</Divider>
            <Space>
              <InputNumber min={0} defaultValue={0} ref={controlDirectValueRef} />
              <Button
                type="primary"
                onClick={() =>
                  motorDirectControl.mutateAsync({
                    stationId: selectedStationId,
                    value: controlDirectValueRef.current.value
                  })
                }
              >
                Đặt giá tri
              </Button>
            </Space> */}
          </Space>
        </>
      )}
    </>
  )
}

const GroupsControl = () => {
  const { data, isLoading } = useStationGroups()
  const groupList = data
    ? data.map((group: any) => {
        return {
          label: group.name,
          value: group.name
        }
      })
    : []

  const [selectedGroup, setSelectedGroup] = useState(null)
  const [unit, setUnit] = useState('step')
  const controlValueRef = useRef(null)
  const controlDirectValueRef = useRef(null)

  const contactorControl = useMutation({
    mutationFn: (data: { group: string; status: boolean }) => {
      return switchTransformerGroup(data.group, data.status)
    },
    onSuccess: () => {
      toast.success('Đã gửi lệnh điều khiển thành công')
    },
    onError: (error) => {
      toast.error('Đã có lỗi xảy ra')
    }
  })

  const motorControl = useMutation({
    mutationFn: (data: {
      group: string
      value: number
      unit: 'step' | 'percent'
      direction: 'inc' | 'dec'
    }) => {
      return controlStepMotorGroup(data.group, data.value, data.unit, data.direction)
    },
    onSuccess: () => {
      toast.success('Đã gửi lệnh điều khiển thành công')
    },
    onError: (error) => {
      toast.error('Đã có lỗi xảy ra')
    }
  })

  const motorDirectControl = useMutation({
    mutationFn: (data: { group: string; value: number }) => {
      return controlStepMotorDirectGroup(data.group, data.value)
    },
    onSuccess: () => {
      toast.success('Đã gửi lệnh điều khiển thành công')
    },
    onError: (error) => {
      toast.error('Đã có lỗi xảy ra')
    }
  })

  return (
    <>
      <Divider />
      <Space>
        <h3>Chọn nhóm: </h3>
        <Select style={{ width: 120 }} options={groupList} onChange={setSelectedGroup} />
      </Space>
      {selectedGroup && (
        <>
          <Divider />
          <Space direction="vertical">
            <Space align="center">
              <Title level={5} style={{ margin: 0 }}>
                Điều khiển contactor:
              </Title>
              <Button
                type="primary"
                onClick={() => contactorControl.mutateAsync({ group: selectedGroup, status: true })}
                color="green"
              >
                Bật
              </Button>
              <Button
                type="primary"
                onClick={() =>
                  contactorControl.mutateAsync({ group: selectedGroup, status: false })
                }
                danger
              >
                Tắt
              </Button>
            </Space>
            <Divider />
            <Title level={5} style={{ margin: 0 }}>
              Điều khiển Điện áp:
            </Title>
            <Space align="center">
              <Button
                type="primary"
                onClick={() => {
                  motorControl.mutateAsync({
                    group: selectedGroup,
                    value: controlValueRef.current.value,
                    unit: unit as 'step' | 'percent',
                    direction: 'dec'
                  })
                }}
              >
                Tăng
              </Button>
              <InputNumber min={0} defaultValue={0} ref={controlValueRef} />
              <Select
                options={[
                  { label: 'Step', value: 'step' },
                  { label: '%', value: 'percent' }
                ]}
                defaultValue="step"
                onChange={(value) => setUnit(value)}
              />
              <Button
                type="primary"
                onClick={() =>
                  motorControl.mutateAsync({
                    group: selectedGroup,
                    value: controlValueRef.current.value,
                    unit: unit as 'step' | 'percent',
                    direction: 'inc'
                  })
                }
              >
                Giảm
              </Button>
            </Space>
            {/* <Divider plain>Hoặc</Divider>
            <Space>
              <InputNumber min={0} defaultValue={0} ref={controlDirectValueRef} />
              <Button
                type="primary"
                onClick={() =>
                  motorDirectControl.mutateAsync({
                    group: selectedGroup,
                    value: controlDirectValueRef.current.value
                  })
                }
              >
                Đặt giá tri
              </Button>
            </Space> */}
          </Space>
        </>
      )}
    </>
  )
}

export default function ControlPanel() {
  const [isManualControl, setIsManualControl] = useState(false)
  const [isGroupControl, setIsGroupControl] = useState(false)

  return (
    <MainLayout currentKey="control">
      <Card>
        <Space align="center">
          <h3>Điều khiển thủ công: </h3>
          <Switch
            checked={isManualControl}
            checkedChildren="Mở"
            unCheckedChildren="Khoá"
            onChange={setIsManualControl}
          />
        </Space>
      </Card>
      {isManualControl && (
        <>
          <Card>
            Bật điều khiển nhóm:{' '}
            <Switch
              size="default"
              checked={isGroupControl}
              checkedChildren="Điều khiển nhóm"
              unCheckedChildren="Điều khiển trạm"
              onChange={setIsGroupControl}
            />
            {isGroupControl ? <GroupsControl /> : <StationControl />}
          </Card>
        </>
      )}
    </MainLayout>
  )
}
