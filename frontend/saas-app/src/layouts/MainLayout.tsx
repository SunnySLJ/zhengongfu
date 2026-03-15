import { useState } from 'react'
import { Layout, Button, Avatar, Dropdown } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons'
import { Outlet, useNavigate } from 'react-router-dom'
import NavMenu from '../components/NavMenu'
import { useAuthStore } from '../stores/authStore'

const { Sider, Header, Content } = Layout

const SIDER_WIDTH = 200
const SIDER_COLLAPSED_WIDTH = 64

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, team, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={SIDER_WIDTH}
        collapsedWidth={SIDER_COLLAPSED_WIDTH}
        collapsed={collapsed}
        theme="light"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          borderRight: '1px solid #f0f0f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 16px',
            borderBottom: '1px solid #f0f0f0',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #ff4d4f, #ff7a45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            帧
          </div>
          {!collapsed && (
            <span style={{ marginLeft: 8, fontWeight: 600, fontSize: 15, color: '#1a1a1a', whiteSpace: 'nowrap' }}>
              帧功夫
            </span>
          )}
        </div>

        {/* Menu */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <NavMenu />
        </div>

        {/* Collapse toggle */}
        <div
          style={{
            borderTop: '1px solid #f0f0f0',
            padding: '8px',
            display: 'flex',
            justifyContent: collapsed ? 'center' : 'flex-end',
          }}
        >
          <Button
            type="text"
            size="small"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: '#8c8c8c' }}
          />
        </div>
      </Sider>

      {/* Main content area */}
      <Layout
        style={{
          marginLeft: collapsed ? SIDER_COLLAPSED_WIDTH : SIDER_WIDTH,
          transition: 'margin-left 0.2s',
          background: '#f5f5f5',
        }}
      >
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            height: 48,
            lineHeight: '48px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Dropdown
            menu={{
              items: [
                { key: 'settings', icon: <SettingOutlined />, label: '团队设置', onClick: () => navigate('/team-settings') },
                { type: 'divider' },
                { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true, onClick: () => { logout(); navigate('/login') } },
              ],
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar size={28} style={{ background: '#ff4d4f', fontSize: 12 }}>
                {user?.name?.[0] ?? 'U'}
              </Avatar>
              <span style={{ fontSize: 13 }}>{user?.name}</span>
              {team && <span style={{ fontSize: 12, color: '#999' }}>· {team.name}</span>}
            </div>
          </Dropdown>
        </Header>
        <Content>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
