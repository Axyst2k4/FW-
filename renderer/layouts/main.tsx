import React from 'react'
import {
  ClusterOutlined,
  ConsoleSqlOutlined,
  DatabaseOutlined,
  RadarChartOutlined,
  VideoCameraOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Layout, Menu } from 'antd'
import { useRouter } from 'next/router'
import { Header } from 'antd/lib/layout/layout'

const { Content, Sider } = Layout

const items: MenuProps['items'] = [
  {
    key: 'home',
    icon: <ClusterOutlined />,
    label: 'Cụm thiết bị'
  },
  {
    key: 'monitor',
    icon: <VideoCameraOutlined />,
    label: 'Giám sát'
  },
  {
    key: 'data',
    icon: <DatabaseOutlined />,
    label: 'Dữ liệu'
  },
  {
    key: 'calibrate',
    icon: <RadarChartOutlined />,
    label: 'Ngắt đồng bộ'
  },
  {
    key: 'control',
    icon: <ConsoleSqlOutlined />,
    label: 'Điều khiển'
  },
  {
    key: 'system',
    icon: <DatabaseOutlined />,
    label: 'Cài đặt'
  }
]
interface Props {
  children: React.ReactNode
  currentKey?: string
}

const MainLayout: React.FC<Props> = ({ children, currentKey }) => {
  const router = useRouter()
  return (
    <Layout hasSider>
      <Sider
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0
        }}
      >
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['4']}
          items={items}
          onSelect={({ key, keyPath }) => {
            router.push(`/${key}`)
          }}
          selectedKeys={[currentKey]}
        />
      </Sider>
      <Layout style={{ marginLeft: 200, background: 'rgb(232,232,234)' }}>
        <Content style={{ margin: '16px', overflow: 'initial', minHeight: '100svh' }}>
          <div
            style={{
              padding: '16px'
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
