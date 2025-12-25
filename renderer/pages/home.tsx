import React from 'react'
import MainLayout from '../layouts/main'
import {
  Badge,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag
} from 'antd'
import Link from 'next/link'
import { DeleteOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons'
import {
  useAddStationGroupFn,
  useDeleteStationGroupFn,
  useNodes,
  useRegisterStationFn,
  useStationGroups,
  useStationList
} from '../hooks/api/nodes'
import { timeAgo } from '../utils'
import { deleteStation } from '../api/nodes'
import toast from 'react-hot-toast'

interface DataType {
  id: number
  nodes: ExpandedDataType[]
  current: number
  voltage: number
  rtc: number
}

interface ExpandedDataType {
  id: number
  battery: number
  value: number
  valueType: number
  status: number
}

const Nodes = () => {
  const { data, isLoading } = useNodes()
  const [open, setOpen] = React.useState(false)

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: 'Dòng điện(A)',
      dataIndex: 'current',
      key: 'current',
      render: (v: number) => {
        return <span>{(v / 1000).toFixed(2)}</span>
      }
    },
    {
      title: 'Điện áp(V)',
      dataIndex: 'voltage',
      key: 'voltage',
      render: (v: number) => {
        return <span>{(v / 1000).toFixed(2)}</span>
      }
    },
    {
      title: 'Trạng thái MBA',
      dataIndex: 'contactor',

      key: 'contactor',
      render(contactor: boolean) {
        return contactor ? <Tag color="green">Bật</Tag> : <Tag color="red">Tắt</Tag>
      }
    },
    {
      title: 'Số lượng Sensor',
      dataIndex: 'nodes',
      key: 'nodes',
      render: (nodes: ExpandedDataType[]) => {
        return <span>{nodes.length}</span>
      }
    },
    {
      title: 'RTC',
      dataIndex: 'rtc',
      key: 'rtc',
      render: (rtc: number) => {
        return <span>{new Date(rtc).toLocaleString('vi-VN')}</span>
      }
    },
    {
      title: 'Cập nhật lần cuối',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (updatedAt: string) => {
        // Render color based on how long the last update was
        const timeDiff = Date.now() - new Date(updatedAt).getTime()
        if (timeDiff < 60 * 1000) {
          return <Tag color="green">Healthy: {timeAgo(new Date(updatedAt))}</Tag>
        } else {
          return <Tag color="warning">Unhealthy: {timeAgo(new Date(updatedAt))}</Tag>
        }
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (record: DataType) => (
        <Space size="middle">
          {/* Delete */}
          <Popconfirm
            title="Bạn có chắc chắn muốn xoá?"
            onConfirm={() => deleteStation(record.id).then(() => toast.success('Xoá thành công'))}
            okText="Có"
            cancelText="Không"
          >
            <Button type="primary" danger>
              <DeleteOutlined />
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]
  const expandedRowRender = (record: DataType) => {
    const columns = [
      { title: 'Sensor ID', dataIndex: 'id', key: 'id' },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: number) => {
          if (status === 1) {
            return <Badge status="success" text="Online" />
          } else if (status === 2) {
            return <Badge status="error" text="Offline" />
          } else {
            return <Badge status="warning" text="Unknown" />
          }
        }
      },
      {
        title: 'Mode',
        dataIndex: 'mode',
        key: 'mode',
        render: (mode: number) => {
          if (mode === 0) {
            return <Tag color="green">ACTIVE</Tag>
          } else if (mode === 1) {
            return <Tag color="green">AWAKE</Tag>
          } else if (mode === 2) {
            return <Tag color="red">CALIB</Tag>
          } else {
            return <Tag color="orange">UNKNOWN</Tag>
          }
        }
      },
      {
        title: 'Battery(%)',
        dataIndex: 'battery',
        key: 'battery',
        render: (battery: number) => {
          return <span>{Math.round(battery)}</span>
        }
      },
      {
        title: 'Giá trị (V)',
        dataIndex: 'value',
        key: 'value'
      },
      {
        title: 'Loại',
        dataIndex: 'valueType',
        key: 'valueType',
        render: (valueType: number) => {
          switch (valueType) {
            case 1:
              return <Tag color="blue">Vp</Tag>
            case 2:
              return <Tag color="yellow">Vna</Tag>
          }
        }
      }
    ]

    return <Table columns={columns} dataSource={record.nodes} pagination={false} size="small" />
  }
  return (
    <Card title="Trạm" bordered={false} bodyStyle={{ padding: 0 }}>
      {data && (
        <Table
          dataSource={data}
          expandable={{ expandedRowRender }}
          columns={columns}
          rowKey={(record) => record.id}
          size="small"
        />
      )}

      <AddStationForm open={open} setOpen={setOpen} />

      <Button type="primary" style={{ margin: '1rem' }} onClick={() => setOpen(true)}>
        <PlusOutlined /> Thêm trạm
      </Button>
    </Card>
  )
}

const AddStationForm = ({ open, setOpen }: any) => {
  const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 }
  }

  const { mutateAsync: registerStation } = useRegisterStationFn()
  const [form] = Form.useForm()
  return (
    <>
      <Modal title="Thêm trạm" open={open} footer={null}>
        <Form
          {...layout}
          form={form}
          onFinish={(values) => {
            registerStation(values)
            setOpen(false)
          }}
        >
          <Form.Item
            label="ID"
            name="id"
            rules={[{ required: true, message: 'Vui lòng nhập ID trạm' }]}
          >
            <Input />
          </Form.Item>

          <Form.List name="nodes">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Space
                    key={field.key}
                    style={{ display: 'flex', marginBottom: 8, justifyContent: 'end' }}
                    align="baseline"
                  >
                    Node:
                    <Form.Item
                      {...field}
                      name={[field.name, 'id']}
                      rules={[{ required: true, message: 'Vui lòng nhập ID sensor' }]}
                    >
                      <Input placeholder="ID sensor" />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'valueType']}
                      rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
                      style={{ width: '130px' }}
                    >
                      <Select placeholder="Loại">
                        <Select.Option value={1}>Vp</Select.Option>
                        <Select.Option value={2}>Vna</Select.Option>
                      </Select>
                    </Form.Item>
                  </Space>
                ))}
                <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Thêm sensor
                  </Button>

                  <Button
                    type="dashed"
                    onClick={() => remove(fields.length - 1)}
                    block
                    icon={<DeleteOutlined />}
                  >
                    Xoá sensor
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                Thêm
              </Button>
              <Button
                type="primary"
                danger
                onClick={() => {
                  setOpen(false)
                  form.resetFields()
                }}
              >
                Huỷ
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

const Events = () => {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Link href="">
            <InfoCircleOutlined />
          </Link>
        </Space>
      )
    }
  ]
  const expandedRowRender = (record: DataType) => {
    const columns = [
      { title: 'Name', dataIndex: 'name', key: 'name' },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: number) => {
          if (status === 0) {
            return <Badge status="success" text="Online" />
          } else if (status === 1) {
            return <Badge status="error" text="Offline" />
          } else {
            return <Badge status="warning" text="Unknown" />
          }
        }
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description'
      }
    ]

    return (
      <Table
        columns={columns}
        showHeader={false}
        dataSource={record.nodes}
        pagination={false}
        size="small"
      />
    )
  }
  return (
    <Card title="Sự kiện" style={{ marginTop: '1rem' }} bordered={false} bodyStyle={{ padding: 0 }}>
      <Table dataSource={[]} expandable={{ expandedRowRender }} columns={columns} size="small" />
    </Card>
  )
}

const AddStationGroupForm = ({ open, createStationGroup, setOpen, isLoadingStations, list }) => {
  const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 }
  }

  const [form] = Form.useForm()

  return (
    <>
      <Modal title="Thêm nhóm trạm" visible={open} footer={null}>
        <Form
          {...layout}
          form={form}
          onFinish={(values) => {
            createStationGroup(values)
            setOpen(false)
          }}
        >
          <Form.Item
            label="Tên nhóm trạm"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên nhóm trạm' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Chọn trạm"
            name="stationIds"
            rules={[{ required: true, message: 'Vui lòng chọn trạm' }]}
          >
            <Select mode="multiple" loading={isLoadingStations}>
              {list?.map((station) => {
                return (
                  <Select.Option key={station.value} value={station.value}>
                    {station.label}
                  </Select.Option>
                )
              })}
            </Select>
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={isLoadingStations}>
                Thêm
              </Button>
              <Button
                type="primary"
                danger
                onClick={() => {
                  setOpen(false)
                  form.resetFields()
                }}
              >
                Huỷ
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

const StationGroups = () => {
  const { data: stationGroups, isLoading } = useStationGroups()
  const { mutateAsync: deleteStationGroup } = useDeleteStationGroupFn()
  const { mutateAsync: createStationGroup } = useAddStationGroupFn()
  const { list, isLoading: isLoadingStations } = useStationList()
  const [open, setOpen] = React.useState(false)

  const columns = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Trạm',
      key: 'stations',
      render: (record) => {
        return record.stationIds.map((id: number) => {
          return (
            <Tag key={id} color="blue">
              station {id}
            </Tag>
          )
        })
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (record) => (
        <Space size="middle">
          <Button
            type="primary"
            danger
            onClick={() => {
              deleteStationGroup(record.name)
            }}
          >
            <DeleteOutlined />
          </Button>
        </Space>
      )
    }
  ]

  return (
    <Card title="Nhóm Trạm" bordered={false} bodyStyle={{ padding: '1rem' }}>
      <AddStationGroupForm
        open={open}
        createStationGroup={createStationGroup}
        setOpen={setOpen}
        isLoadingStations={isLoadingStations}
        list={list.map((station: any) => ({ value: station.id, label: 'Station ' + station.id }))}
      />
      <Table
        dataSource={stationGroups}
        columns={columns}
        pagination={false}
        size="small"
        loading={isLoading}
      />
      <Button
        type="primary"
        style={{ marginTop: '1rem' }}
        onClick={() => {
          setOpen(true)
        }}
      >
        <PlusOutlined /> Thêm
      </Button>
    </Card>
  )
}

export default function HomePage() {
  return (
    <MainLayout currentKey="home">
      <Space direction="vertical" style={{ width: '100%', gap: '1rem' }}>
        <Nodes />
        <StationGroups />
        {/* <Events /> */}
      </Space>
    </MainLayout>
  )
}
