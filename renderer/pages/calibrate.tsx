import React, { useCallback, useEffect } from 'react'
import MainLayout from '../layouts/main'
import {
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Popconfirm,
  Row,
  Space,
  Statistic,
  Table,
  Timeline
} from 'antd'
import Title from 'antd/lib/typography/Title'
import {
  useCalibrationData,
  useCalibrationState,
  usePrepareCalibrationFn,
  useResetCalibrationFn,
  useStartCalibrationFn
} from '../hooks/api/calibration'
import { PlayCircleFilled } from '@ant-design/icons'
import dynamic from 'next/dynamic'
import { useStationList } from '../hooks/api/nodes'
import { VoltageControl } from '../components/Control'
import { mapToObject } from '../utils'
import { useMutation } from '@tanstack/react-query'
import { controlStepMotor } from '../api/nodes'
import toast from 'react-hot-toast'
import { Bar, BarChart, ResponsiveContainer, Tooltip } from 'recharts'
const TinyColumn: React.ComponentType<{ data: any }> = dynamic(
  () => import('@ant-design/charts').then(({ Tiny }: any) => Tiny.Column),
  {
    ssr: false
  }
)

const config = {
  height: 60,
  autoFit: true,
  padding: 8,
  xField: 'index',
  yField: 'value',
  tooltip: {
    channel: 'y'
  }
}
const dataColumns = [
  {
    title: 'NodeID',
    dataIndex: 'nodeId',
    key: 'nodeId'
  },
  {
    title: 'Giá trị đo (V)',
    render: (record) => {
      return (
        // <TinyColumn {...config} data={record.values.map((value, index) => ({ value, index }))} />
        <ResponsiveContainer width="100%" height={60}>
          <BarChart data={record.values.map((value, index) => ({ value, index }))}>
            <Bar dataKey="value" fill="#448ef7" />
            <Tooltip />
          </BarChart>
        </ResponsiveContainer>
        // <Space>
        //   {record.values.map((value, index) => (
        //     <span key={index}>{value}</span>
        //   ))}
        // </Space>
      )
    }
  }
]

const renderCurrentState = (state) => {
  switch (state) {
    case 'none':
      return <Badge status="default" text="Đợi ngắt đồng bộ" />
    case 'ready':
      return <Badge status="success" text="Sẵn sàng" />
    case 'warning':
      return <Badge status="warning" text="Cảnh báo có vấn đề" />
    case 'error':
      return <Badge status="error" text="Đã xảy ra lỗi khi ngắt đồng bộ" />
    case 'done':
      return <Badge status="success" text="Đã hoàn thành" />

    default:
      return <Badge status="processing" text="Đang ngắt" />
  }
}

const renderHistoryState = (history: { createdAt: Date; message: string; transition: string }) => {
  const time = new Date(history?.createdAt).toLocaleTimeString()
  switch (history?.transition) {
    case 'prepare':
      return <Timeline.Item color="blue">Đã gửi lệnh sẵn sàng ngắt đồng bộ ({time})</Timeline.Item>
    case 'triggerReady':
      return <Timeline.Item color="blue">Sẵn sàng ngắt đồng bộ: ({time})</Timeline.Item>
    case 'calibrate':
      return <Timeline.Item color="blue">Bắt đầu ngắt đồng bô: ({time})</Timeline.Item>
    case 'reset':
      return <Timeline.Item color="blue">Đã reset ({time})</Timeline.Item>
    case 'error':
      return (
        <Timeline.Item color="red">
          Đã xảy ra lỗi khi ngắt đồng bộ: {history.message} ({time})
        </Timeline.Item>
      )
    case 'warn':
      return (
        <Timeline.Item color="orange">
          Cảnh báo có vấn đề: {history.message} ({time})
        </Timeline.Item>
      )
    case 'finish':
      return <Timeline.Item color="green">Đã hoàn thành ngắt đồng bộ ({time})</Timeline.Item>
  }
}

const renderPendingState = (state, now) => {
  console.log(state)
  const deadline = now + 1000 * 60 * 5
  if (state === 'preparing') {
    const countdown = (
      <Statistic.Countdown value={deadline} format="mm:ss" valueStyle={{ fontSize: '16px' }} />
    )
    return (
      <>
        Đợi hệ thống sẵn sàng...
        {countdown}
      </>
    )
  }
  if (state === 'calibrating') {
    return <>Đang ngắt đồng bộ...</>
  }

  return undefined
}

const FinalizeCalib = ({ calibData }) => {
  const { list } = useStationList()
  const [recommendedValues, setRecommendedValues] = React.useState({})
  const [factor, setFactor] = React.useState(1)

  useEffect(() => {
    setFactor(window.ipc.store.get('settings.calibControlFactor'))
    if (!calibData?.values) return
    const stationCalibData = calibData?.values.reduce((acc, cur) => {
      const stationId = list.find((station: any) =>
        station.nodes.find((node) => node.id === cur.nodeId)
      )?.id
      if (!stationId) {
        console.log('Station not found', cur)
        return acc
      }
      if (!acc[stationId]) {
        acc[stationId] = []
      }
      acc[stationId].push(cur)
      return acc
    }, {})

    const recommendedValues = new Map()

    Object.entries(stationCalibData).map(([stationId, data]: any) => {
      const means = data.map((d) => d.values.slice(8, 22).reduce((acc, cur) => acc + cur, 0) / 14)
      const max = Math.max(...means) * 1000 // to mV
      const min = Math.min(...means) * 1000

      if (max > -850 && min >= -1250) {
        return recommendedValues.set(stationId, -850 - max)
      }
      if (min < -1250 && max <= -850) {
        return recommendedValues.set(stationId, -1250 - min)
      }
      if (max > -850 && min < -1250) {
        return recommendedValues.set(stationId, (-850 - max + -1250 - min) / 2)
      }
      if (max <= -850 && min >= -1250) {
        return recommendedValues.set(stationId, 0)
      }
    })

    setRecommendedValues(mapToObject(recommendedValues))
  }, [calibData])

  const handleAutomaticCalib = useCallback(() => {
    for (const station of list) {
      if (recommendedValues[station.id] === undefined) {
        continue
      }
      const value = ~~(recommendedValues[station.id] * factor)
      const unit = 'step'
      const direction = value > 0 ? 'inc' : 'dec'
      controlStepMotor(station.id, value, unit, direction)
    }

    toast.success('Đã gửi lệnh điều chỉnh tất cả các motor')
  }, [recommendedValues, factor, list])

  return (
    <Card title="Gửi điều chỉnh" style={{ marginTop: '1rem' }}>
      <Popconfirm onConfirm={handleAutomaticCalib} title="Bạn chắc muốn điều chỉnh tự động?">
        <Button style={{ width: '100%' }} type="primary" size="large">
          Điều chỉnh tất cả theo giá trị khuyên dùng
        </Button>
      </Popconfirm>
      <Divider />
      Gửi điều chỉnh motor tới các thiết bị:
      {list?.map((station) => (
        <>
          <VoltageControl
            station={station}
            recommendValue={~~(recommendedValues[station.id] * factor) ?? null}
          />
          <Divider />
        </>
      ))}
    </Card>
  )
}

export default function CalibratePage() {
  const { data: calibState } = useCalibrationState()
  const { mutateAsync: prepareCalib } = usePrepareCalibrationFn()
  const { mutateAsync: startCalib } = useStartCalibrationFn()
  const { mutateAsync: resetCalib } = useResetCalibrationFn()
  const { data: calibData } = useCalibrationData(calibState?.id)
  const [now, setNow] = React.useState(Date.now())

  useEffect(() => {
    if (calibState?.state === 'preparing') {
      setNow(
        new Date(
          calibState?.history?.find((history) => history.transition === 'prepare')?.createdAt
        ).getTime()
      )
    }
  }, [calibState])

  return (
    <MainLayout currentKey="calibrate">
      <Title level={3}>Ngắt đồng bộ</Title>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Điều khiển">
            <Space direction="vertical" style={{ width: '100%' }}>
              {calibState?.state === 'none' && (
                <>
                  <Button
                    type="primary"
                    size="large"
                    style={{ width: '100%' }}
                    onClick={() => prepareCalib()}
                  >
                    Chuẩn bị hệ thống
                  </Button>
                </>
              )}
              {['ready', 'warning'].includes(calibState?.state) && (
                <Button
                  type="primary"
                  size="large"
                  style={{ width: '100%' }}
                  disabled={calibState?.state !== 'ready'}
                  onClick={() => startCalib()}
                >
                  <PlayCircleFilled />
                  Bắt đầu ngắt đồng bộ
                </Button>
              )}
              {
                <>
                  <Button
                    type="ghost"
                    size="large"
                    style={{ width: '100%' }}
                    onClick={() => resetCalib()}
                  >
                    Reset
                  </Button>
                </>
              }
            </Space>
          </Card>
          <FinalizeCalib calibData={calibData} />
        </Col>
        <Col span={12}>
          <Card title="Trạng thái">
            {renderCurrentState(calibState?.state)}
            <Divider />
            <Timeline pending={renderPendingState(calibState?.state, now)}>
              {calibState?.history?.map((history) => renderHistoryState(history))}
            </Timeline>
          </Card>
        </Col>
      </Row>
      {!calibState?.calibrationId && (
        <>
          <Divider />
          <Card title="Thông số đo được">
            <Table columns={dataColumns} dataSource={calibData?.values} pagination={false}></Table>
          </Card>
        </>
      )}
    </MainLayout>
  )
}
