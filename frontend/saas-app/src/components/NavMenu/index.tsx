import { useState } from 'react'
import { Menu } from 'antd'
import {
  HomeOutlined,
  RadarChartOutlined,
  ScissorOutlined,
  FireOutlined,
  ThunderboltOutlined,
  VideoCameraAddOutlined,
  ApartmentOutlined,
  BarChartOutlined,
  FileImageOutlined,
  BulbOutlined,
  RocketOutlined,
  PlaySquareOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import type { MenuProps } from 'antd'

type MenuItem = Required<MenuProps>['items'][number]

const items: MenuItem[] = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: '首页工作台',
  },
  {
    key: '/zhengongfu',
    icon: <RocketOutlined />,
    label: '帧功夫',
  },
  {
    key: 'academy',
    label: '流量学院',
    type: 'group',
    children: [
      { key: '/trend-radar', icon: <RadarChartOutlined />, label: '热点雷达' },
      { key: '/copywriting', icon: <FireOutlined />, label: '爆款文案' },
      { key: '/templates', icon: <ScissorOutlined />, label: '剪辑模板' },
      { key: '/batch-mix', icon: <ThunderboltOutlined />, label: '批量混剪' },
      { key: '/video-gen', icon: <VideoCameraAddOutlined />, label: '视频生成' },
      { key: '/video-history', icon: <PlaySquareOutlined />, label: '视频历史' },
      { key: '/prompt-lib', icon: <BulbOutlined />, label: '提示词库' },
    ],
  },
  {
    key: 'distribution',
    label: '作品分发',
    type: 'group',
    children: [
      { key: '/distribution', icon: <ApartmentOutlined />, label: '矩阵分发' },
      { key: '/analytics', icon: <BarChartOutlined />, label: '数据看板' },
    ],
  },
  {
    key: 'materials',
    label: '素材预处理',
    type: 'group',
    children: [
      { key: '/materials', icon: <FileImageOutlined />, label: '本地素材' },
    ],
  },
]

export default function NavMenu() {
  const navigate = useNavigate()
  const location = useLocation()
  const [openKeys, setOpenKeys] = useState<string[]>([])

  const selectedKey = location.pathname || '/'

  return (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      openKeys={openKeys}
      onOpenChange={setOpenKeys}
      items={items}
      onClick={({ key }) => navigate(key)}
      style={{ borderRight: 0, userSelect: 'none' }}
    />
  )
}
