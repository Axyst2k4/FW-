import { Space, Button, InputNumber, Select, Tag } from 'antd'
import Paragraph from 'antd/lib/typography/Paragraph'
import Title from 'antd/lib/typography/Title'
import { controlStepMotor } from '../api/nodes'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useState, useRef } from 'react'

const renderMotorLimit = (limit: number) => {
  switch (limit) {
    case 0:
      return <Tag>Không giới hạn</Tag>
    case 1:
      return <Tag color="green">Đã đạt tối thiểu</Tag>
    case 2:
      return <Tag color="red">Đã đạt tối đa</Tag>
  }
}

export const VoltageControl = ({
  station,
  recommendValue
}: {
  station: any
  recommendValue?: number
}) => {
  const [unit, setUnit] = useState('step')
  const controlValueRef = useRef(null)
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
  return (
    <>
      <Paragraph>
        Hiệu điện thế hiện tại của <b>STATION-{station?.id}</b>: <b>{station?.voltage}mV</b>
        <br />
        Trạng thái Step motor: {renderMotorLimit(station?.motorBound) ?? 'Không bị giới hạn'}
        <br />
        <b>Giá trị đặt khuyên dùng:</b> {recommendValue > 0 ? '+' : ''}{recommendValue} Steps
      </Paragraph>
      <Space align="center">
        <Button
          type="primary"
          onClick={() => {
            motorControl.mutateAsync({
              stationId: station.id,
              value: controlValueRef.current.value,
              unit: unit as 'step' | 'percent',
              direction: 'dec'
            })
          }}
          disabled={station?.motorLimit === 1}
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
              stationId: station.id,
              value: controlValueRef.current.value,
              unit: unit as 'step' | 'percent',
              direction: 'inc'
            })
          }
          disabled={station?.motorLimit === 2}
        >
          Giảm
        </Button>
      </Space>
    </>
  )
}
