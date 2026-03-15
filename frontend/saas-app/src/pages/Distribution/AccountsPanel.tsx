import { useState } from 'react'
import { Card, Button, Tag, Avatar, Popconfirm, message, Modal, Select, Empty } from 'antd'
import { PlusOutlined, ReloadOutlined, DisconnectOutlined, UserOutlined } from '@ant-design/icons'
import type { PlatformAccount, Platform } from './types'
import { PlatformBadge, PlatformLabel } from './PlatformIcon'

const STATUS_MAP = {
  connected: { color: 'success', label: '已连接' },
  expired: { color: 'warning', label: '授权过期' },
  disconnected: { color: 'default', label: '未连接' },
} as const

function formatFollowers(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  return n.toString()
}

interface Props {
  accounts: PlatformAccount[]
  onChange: (accounts: PlatformAccount[]) => void
}

export default function AccountsPanel({ accounts, onChange }: Props) {
  const [addOpen, setAddOpen] = useState(false)
  const [addPlatform, setAddPlatform] = useState<Platform>('douyin')

  const douyin = accounts.filter((a) => a.platform === 'douyin')
  const xhs = accounts.filter((a) => a.platform === 'xiaohongshu')

  function handleConnect() {
    // Mock OAuth flow
    const names: Record<Platform, string[]> = {
      douyin: ['时尚达人', '美食探索者', '科技前沿号', '生活小妙招'],
      xiaohongshu: ['种草小能手', '穿搭日记本', '美妆测评官', '旅行见闻录'],
    }
    const used = accounts.filter((a) => a.platform === addPlatform).map((a) => a.nickname)
    const available = names[addPlatform].filter((n) => !used.includes(n))
    if (available.length === 0) { message.warning('暂无可绑定账号'); return }

    const newAcc: PlatformAccount = {
      id: 'a_' + Date.now(),
      platform: addPlatform,
      nickname: available[0],
      avatar: '',
      followers: Math.floor(Math.random() * 100000 + 5000),
      status: 'connected',
      connectedAt: new Date().toISOString().split('T')[0],
    }
    onChange([...accounts, newAcc])
    message.success(`${newAcc.nickname} 授权成功`)
    setAddOpen(false)
  }

  function handleDisconnect(id: string) {
    onChange(accounts.filter((a) => a.id !== id))
    message.success('已解绑')
  }

  function handleRefresh(id: string) {
    onChange(accounts.map((a) => a.id === id ? { ...a, status: 'connected' } : a))
    message.success('授权已刷新')
  }

  function renderGroup(list: PlatformAccount[], platform: Platform) {
    return (
      <Card
        key={platform}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlatformBadge platform={platform} size={22} />
            <PlatformLabel platform={platform} />
            <Tag style={{ marginLeft: 4 }}>{list.length} 个账号</Tag>
          </div>
        }
        extra={
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => { setAddPlatform(platform); setAddOpen(true) }}
          >
            绑定账号
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        {list.length === 0 ? (
          <Empty description="暂无绑定账号" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {list.map((acc) => (
              <div
                key={acc.id}
                style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Avatar size={40} icon={<UserOutlined />} style={{ background: '#f0f0f0', color: '#999', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {acc.nickname}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Tag color={STATUS_MAP[acc.status].color} style={{ margin: 0, fontSize: 11 }}>
                      {STATUS_MAP[acc.status].label}
                    </Tag>
                    <span style={{ color: '#999', fontSize: 12 }}>{formatFollowers(acc.followers)} 粉丝</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {acc.status === 'expired' && (
                    <Button size="small" icon={<ReloadOutlined />} onClick={() => handleRefresh(acc.id)}>
                      刷新
                    </Button>
                  )}
                  <Popconfirm title="确认解绑该账号？" onConfirm={() => handleDisconnect(acc.id)}>
                    <Button size="small" danger icon={<DisconnectOutlined />} />
                  </Popconfirm>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    )
  }

  return (
    <div>
      {renderGroup(douyin, 'douyin')}
      {renderGroup(xhs, 'xiaohongshu')}

      <Modal
        title="绑定平台账号"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={handleConnect}
        okText="模拟授权登录"
      >
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 12, fontWeight: 500 }}>选择平台</div>
          <Select
            value={addPlatform}
            onChange={setAddPlatform}
            style={{ width: '100%' }}
            options={[
              { value: 'douyin', label: '抖音' },
              { value: 'xiaohongshu', label: '小红书' },
            ]}
          />
          <div style={{ marginTop: 16, padding: 12, background: '#f9f9f9', borderRadius: 8, color: '#666', fontSize: 13 }}>
            正式环境将跳转至平台 OAuth 授权页，完成授权后自动回调绑定。
          </div>
        </div>
      </Modal>
    </div>
  )
}
