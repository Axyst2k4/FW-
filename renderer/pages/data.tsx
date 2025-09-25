import React, { useCallback } from 'react'
import MainLayout from '../layouts/main'
import { useStationList } from '../hooks/api/nodes'
import { Button, Card, DatePicker, DatePickerProps, Divider, Select } from 'antd'
import Title from 'antd/lib/typography/Title'
import { RangePickerProps } from 'antd/lib/date-picker'
import { ExportOutlined } from '@ant-design/icons'
import Link from 'next/link'
// const shell = require('electron').shell

function buildDownloadUrl(nodeId: number, type: string, startDate: Date, endDate: Date) {
  if (type === 'station') {
    return `http://localhost:3000/api/data/station/export?id=${nodeId}&start=${startDate.toISOString()}&end=${endDate.toISOString()}`
  } else {
    return `http://localhost:3000/api/data/sensor/export?id=${nodeId}&start=${startDate.toISOString()}&end=${endDate.toISOString()}`
  }
}

export default function NextPage() {
  const { list: data } = useStationList()
  const [selectedNode, setSelectedNode] = React.useState(null)
  const [startDate, setStartDate] = React.useState(null)
  const [endDate, setEndDate] = React.useState(null)
  const list: any = data
    ? data.reduce((acc: any, cur: any) => {
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

  const onOk = useCallback((value: RangePickerProps['value']) => {
    setStartDate(value[0].toDate())
    setEndDate(value[1].toDate())
    console.log(startDate, endDate)
  }, [])

  return (
    <MainLayout currentKey="data">
      <Card title="Xuất dữ liệu">
        <Select
          placeholder="Chọn node"
          options={list}
          style={{ width: 200 }}
          onSelect={(value) => {
            setSelectedNode({
              type: value.split('-')[0],
              id: parseInt(value.split('-')[1])
            })
          }}
        />
        {selectedNode && (
          <>
            <Divider />
            <Title level={5}>Chọn thời gian lấy mẫu:</Title>
            <DatePicker.RangePicker
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              onOk={onOk}
            />
          </>
        )}
        {startDate && endDate && (
          <>
            <Divider />
            <a href={buildDownloadUrl(selectedNode.id, selectedNode.type, startDate, endDate)}>
              <Button
                type="primary"
                style={{ width: '100%' }}

                // onClick={() => {
                //   shell.openExternal(
                //     buildDownloadUrl(selectedNode.id, selectedNode.type, startDate, endDate)
                //   )
                // }}
              >
                <ExportOutlined /> Xuất dữ liệu dạng CSV
              </Button>
            </a>
          </>
        )}
      </Card>
    </MainLayout>
  )
}
