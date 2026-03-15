import { useState } from 'react'
import { Form, Input, Button, Tabs, message } from 'antd'
import { MobileOutlined, LockOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { mockLogin, mockRegister } from './mockApi'
import type { LoginForm, RegisterForm } from '../../types/auth'

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from ?? '/'

  async function handleLogin(values: LoginForm) {
    setLoading(true)
    try {
      const { token, user, team } = await mockLogin(values)
      login(token, user, team)
      message.success('登录成功')
      navigate(from, { replace: true })
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(values: RegisterForm) {
    setLoading(true)
    try {
      const { token, user, team } = await mockRegister(values)
      login(token, user, team)
      message.success('注册成功')
      navigate('/', { replace: true })
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fff1f0 0%, #fff7e6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 400,
          background: '#fff',
          borderRadius: 16,
          padding: '40px 40px 32px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #ff4d4f, #ff7a45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            帧
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>帧功夫</span>
        </div>

        <Tabs
          activeKey={tab}
          onChange={(k) => setTab(k as 'login' | 'register')}
          items={[
            { key: 'login', label: '登录' },
            { key: 'register', label: '注册' },
          ]}
          style={{ marginBottom: 24 }}
        />

        {tab === 'login' ? (
          <Form layout="vertical" onFinish={handleLogin} size="large">
            <Form.Item
              name="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
              ]}
            >
              <Input prefix={<MobileOutlined />} placeholder="手机号" maxLength={11} />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block loading={loading}>
                登录
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form layout="vertical" onFinish={handleRegister} size="large">
            <Form.Item
              name="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
              ]}
            >
              <Input prefix={<MobileOutlined />} placeholder="手机号" maxLength={11} />
            </Form.Item>
            <Form.Item
              name="name"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="您的姓名" />
            </Form.Item>
            <Form.Item
              name="teamName"
              rules={[{ required: true, message: '请输入团队名称' }]}
            >
              <Input prefix={<TeamOutlined />} placeholder="团队名称" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请设置密码' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="设置密码（至少6位）" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block loading={loading}>
                注册并创建团队
              </Button>
            </Form.Item>
          </Form>
        )}

        <div style={{ marginTop: 16, textAlign: 'center', color: '#999', fontSize: 12 }}>
          测试账号：任意手机号 + 任意密码（6位以上）
        </div>
      </div>
    </div>
  )
}
