import React, { useState } from 'react'
import MainLayout from '../layouts/main'
import { Card, Descriptions, Empty, Radio, Select, Space, Switch, Table } from 'antd'
import { useNodeMetrics, useNodes } from '../hooks/api/nodes'
import { BasicLine } from '../components/SensorGraph'
import { SimpleGauge } from '../components/Gauge'
import { BatteryVisual } from '../components/Battery'

const timeOption = [
  { label: '1 giờ', value: 'hour' },
  { label: '5 giờ', value: '5hour' },
  { label: '1 ngày', value: 'day' }
  // { label: '1 month', value: 'month' }
]

const MonitorStation = ({ station, metrics }: { station: any; metrics: any[] }) => {
  const stationColumns = [
    {
      title: 'Time',
      dataIndex: 'ts',
      key: 'ts',
      render: (ts: number) => new Date(ts).toLocaleString('vi-VN')
    },
    {
      title: 'Current(mA)',
      dataIndex: 'current',
      key: 'current',
      render: (value: number) => value.toFixed(3)
    },
    {
      title: 'Voltage(mV)',
      dataIndex: 'voltage',
      key: 'voltage',
      render: (value: number) => value.toFixed(3)
    }
  ]

  return (
    <>
      <Card
        title="Visual"
        style={{ marginTop: '1rem' }}
        bordered={false}
        bodyStyle={{ padding: 16 }}
      >
        {station && metrics?.length > 0 ? (
          <Space direction="vertical" style={{ width: '100%', padding: 16, gap: 8 }}>
            <BasicLine
              datakey="current"
              data={metrics}
              unit="mA"
              measurement="Current"
              domain={[0, 60000]}
            />
            <BasicLine
              datakey="voltage"
              data={metrics}
              unit="mV"
              measurement="Voltage"
              domain={[0, 100000]}
            />
          </Space>
        ) : (
          <Empty description={<span>Empty</span>} />
        )}
      </Card>

      <Card title="Data" style={{ marginTop: '1rem' }} bordered={false} bodyStyle={{ padding: 16 }}>
        {station ? (
          <Table columns={stationColumns} dataSource={metrics?.slice().reverse()} size="small" />
        ) : (
          <Empty description={<span>Empty</span>} />
        )}
      </Card>
    </>
  )
}

const MonitorSensor = ({ sensor, metrics }) => {
  const sensorColumns = [
    {
      title: 'Time',
      dataIndex: 'ts',
      key: 'ts',
      render: (ts: number) => new Date(ts).toLocaleString('vi-VN')
    },

    {
      title: 'Battery(%)',
      dataIndex: 'battery',
      key: 'battery',
      render: (value: number) => value.toFixed(2)
    },
    {
      title: 'Value',
      dataIndex: 'v',
      key: 'v',
      render: (value: number) => value.toFixed(3)
    }
  ]

  return (
    <>
      {sensor && (
        <Card style={{ marginTop: '1rem' }} bordered={false} bodyStyle={{ padding: 16 }}>
          <Descriptions title="Thông tin node" bordered>
            <Descriptions.Item label="Sensor ID">{sensor?.id}</Descriptions.Item>
            {metrics?.length && (
              <Descriptions.Item label="Pin">
                {metrics[metrics?.length - 1]?.battery.toFixed(1)}%
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}
      <Card style={{ marginTop: '1rem' }} bordered={false} bodyStyle={{ padding: 16 }}>
        {sensor && metrics?.length > 0 ? (
          <>
            <Space direction="vertical" style={{ width: '100%', padding: 16, gap: 8 }}>
              {/* <BatteryVisual battery={metrics[metrics.length - 1]?.battery.toFixed(1)} /> */}
              <BasicLine
                datakey="battery"
                data={metrics}
                unit="%"
                measurement="Battery"
                domain={[0, 100]}
              />
              <BasicLine
                datakey="v"
                data={metrics}
                unit="V"
                measurement="Voltage"
                domain={[-3, 3]}
              />
            </Space>
          </>
        ) : (
          <Empty description={<span>Empty</span>} />
        )}
      </Card>

      <Card title="Data" style={{ marginTop: '1rem' }} bordered={false} bodyStyle={{ padding: 16 }}>
        {sensor ? (
          <Table columns={sensorColumns} dataSource={metrics?.slice().reverse()} size="small" />
        ) : (
          <Empty description={<span>Empty</span>} />
        )}
      </Card>
    </>
  )
}

export default function MonitorPage() {
  const { data, isLoading } = useNodes()
  const [selectedNode, setSelectedNode] = useState(null)
  const [isRaw, setIsRaw] = useState(false)
  const [timeRange, setTimeRange] = useState<'day' | 'hour' | '5hour'>('hour')
  const { data: metrics, isLoading: isMetricsLoading } = useNodeMetrics(
    selectedNode?.id,
    selectedNode?.type,
    timeRange,
    isRaw
  )

  const list = data
    ? data.reduce((acc, cur) => {
        acc.push({
          label: 'Station ' + cur.id,
          value: 'station-' + cur.id
        })
        for (const node of cur.nodes) {
          acc.push({
            label: '-- Sensor ' + node.id,
            value: 'sensor-' + node.id
          })
        }
        return acc
      }, [])
    : []

  return (
    <MainLayout currentKey="monitor">
      <Card
        title="Theo dõi"
        style={{ marginTop: '1rem' }}
        bordered={false}
        bodyStyle={{ padding: 16 }}
      >
        <Space>
          <Select
            placeholder="Select a node"
            loading={isLoading}
            options={list}
            style={{ width: 200 }}
            onSelect={(value) => {
              setSelectedNode({
                type: value.split('-')[0],
                id: parseInt(value.split('-')[1])
              })
            }}
          />
          <Radio.Group
            options={timeOption}
            onChange={(e) => {
              setTimeRange(e.target.value)
              // setIsCustomRange(e.target.value === '1')
            }}
            value={timeRange}
            optionType="button"
            buttonStyle="solid"
          />
          Raw: <Switch checked={isRaw} onChange={(checked) => setIsRaw(checked)} />
        </Space>
      </Card>

      {selectedNode?.type === 'station' ? (
        <MonitorStation station={selectedNode} metrics={metrics} />
      ) : (
        <MonitorSensor sensor={selectedNode} metrics={metrics} />
      )}
    </MainLayout>
  )
}
