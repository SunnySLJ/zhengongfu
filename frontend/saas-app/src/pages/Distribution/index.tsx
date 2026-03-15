import { useState } from 'react'
import { Tabs, Button, Badge } from 'antd'
import { PlusOutlined, ApiOutlined, UnorderedListOutlined } from '@ant-design/icons'
import AccountsPanel from './AccountsPanel'
import TaskList from './TaskList'
import CreateTaskModal from './CreateTaskModal'
import { mockAccounts, mockTasks } from './mockData'
import type { PlatformAccount, PublishTask } from './types'

export default function DistributionPage() {
  const [accounts, setAccounts] = useState<PlatformAccount[]>(mockAccounts)
  const [tasks, setTasks] = useState<PublishTask[]>(mockTasks)
  const [createOpen, setCreateOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('tasks')

  const failedCount = tasks.filter((t) => t.overallStatus === 'failed').length
  const publishingCount = tasks.filter((t) => t.overallStatus === 'publishing').length

  function handleCreate(task: PublishTask) {
    setTasks((prev) => [task, ...prev])
    setCreateOpen(false)
    setActiveTab('tasks')
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>矩阵分发</h2>
          <p style={{ margin: '4px 0 0', color: '#999', fontSize: 13 }}>
            绑定抖音、小红书账号，一键多平台分发视频内容
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateOpen(true)}
          disabled={accounts.filter((a) => a.status === 'connected').length === 0}
        >
          创建发布任务
        </Button>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {[
          { label: '已连接账号', value: accounts.filter((a) => a.status === 'connected').length, color: '#52c41a' },
          { label: '授权过期', value: accounts.filter((a) => a.status === 'expired').length, color: '#fa8c16' },
          { label: '发布中', value: publishingCount, color: '#1677ff' },
          { label: '发布失败', value: failedCount, color: '#ff4d4f' },
          { label: '累计成功', value: tasks.filter((t) => t.overallStatus === 'success').length, color: '#52c41a' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: '#fff',
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              padding: '10px 20px',
              minWidth: 100,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color: s.value > 0 ? s.color : '#1a1a1a' }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'tasks',
            label: (
              <span>
                <UnorderedListOutlined style={{ marginRight: 4 }} />
                发布任务
                {failedCount > 0 && <Badge count={failedCount} size="small" style={{ marginLeft: 6 }} />}
              </span>
            ),
            children: <TaskList tasks={tasks} onChange={setTasks} />,
          },
          {
            key: 'accounts',
            label: (
              <span>
                <ApiOutlined style={{ marginRight: 4 }} />
                账号管理
                {accounts.filter((a) => a.status === 'expired').length > 0 && (
                  <Badge
                    count={accounts.filter((a) => a.status === 'expired').length}
                    size="small"
                    color="orange"
                    style={{ marginLeft: 6 }}
                  />
                )}
              </span>
            ),
            children: <AccountsPanel accounts={accounts} onChange={setAccounts} />,
          },
        ]}
      />

      <CreateTaskModal
        open={createOpen}
        accounts={accounts}
        onCancel={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}
