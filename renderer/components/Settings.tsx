'use client'

import { Button, Card, Form, Input, Space } from 'antd'
import MainLayout from '../layouts/main'
import { useSetSyncStateFn, useSyncState } from '../hooks/api/system'
import { resetLastWake, resetNodesRegistry, syncNow } from '../api/system'
import toast from 'react-hot-toast'

type FieldType = {
  calibControlFactor: number
}

export function ControlPanel() {
  const { data: syncState } = useSyncState()
  const { mutateAsync: setSyncState } = useSetSyncStateFn()

  return (
    <MainLayout currentKey="system">
      Cảnh báo: Khu vực này chỉ dành cho developer. Nếu bạn không phải là developer, xin hãy quay
      lại trang chủ.
      <Card className="mb-4">
        <Space direction="vertical">
          <Space>
            <h3>RESET LIST NODE:</h3>
            <Button
              type="primary"
              danger
              onClick={() => resetNodesRegistry().then(() => toast.success('reset'))}
            >
              RESET
            </Button>
          </Space>

          <Space>
            <h3>Reset last wake:</h3>
            <Button
              type="primary"
              danger
              onClick={() => resetLastWake().then(() => toast.success('reset'))}
            >
              RESET
            </Button>
          </Space>

          <Space>
            <h3>Đồng bộ ngay:</h3>
            <Button
              type="primary"
              danger
              onClick={() => syncNow().then(() => toast.success('reset'))}
            >
              Đồng bộ
            </Button>
          </Space>

          <Space>
            <h3>Tự động đồng bộ node:</h3>
            <Button type="primary" disabled={syncState} danger onClick={() => setSyncState(true)}>
              Bật
            </Button>
            <Button type="primary" disabled={!syncState} danger onClick={() => setSyncState(false)}>
              Tắt
            </Button>
          </Space>
        </Space>
      </Card>
      <Card title="Cài đặt" className="mt-4">
        <Form
          initialValues={{
            calibControlFactor: window.ipc.store.get('settings.calibControlFactor')
          }}
          onFinish={(values) => {
            for (const key in values) {
              window.ipc.store.set(`settings.${key}`, +values[key])
            }
            toast.success('Đã lưu cài đặt')
          }}
        >
          <Form.Item<FieldType>
            name="calibControlFactor"
            label="Hệ số điều chỉnh calib"
            rules={[{ required: true }]}
          >
            <Input type="number" step="any" min={0} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </MainLayout>
  )
}
