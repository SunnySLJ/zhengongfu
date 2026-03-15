import { useState, useEffect } from 'react'
import { Table, Tag, Button, Tooltip, Avatar, Popconfirm, message, Progress } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  RetweetOutlined,
  DeleteOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { PublishTask, TaskStatus } from './types'
import { PlatformBadge } from './PlatformIcon'

const STATUS_CFG: Record<TaskStatus, { icon: React.ReactNode; color: string; label: string }> = {
  pending:    { icon: <ClockCircleOutlined />,  color: 'default',  label: '待发布' },
  scheduled:  { icon: <ClockCircleOutlined />,  color: 'processing', label: '定时中' },
  publishing: { icon: <LoadingOutlined />,       color: 'processing', label: '发布中' },
  success:    { icon: <CheckCircleOutlined />,   color: 'success',  label: '已成功' },
  failed:     { icon: <CloseCircleOutlined />,   color: 'error',    label: '失败' },
}

interface Props {
  tasks: PublishTask[]
  onChange: (tasks: PublishTask[]) => void
}

export default function TaskList({ tasks, onChange }: Props) {
  const [progresses, setProgresses] = useState<Record<string, number>>({})

  // Simulate publishing progress for 'publishing' tasks
  useEffect(() => {
    const publishing = tasks.filter((t) => t.overallStatus === 'publishing')
    if (publishing.length === 0) return

    const timer = setInterval(() => {
      setProgresses((prev) => {
        const next = { ...prev }
        let anyUpdated = false
        publishing.forEach((task) => {
          const cur = next[task.id] ?? 0
          if (cur < 100) {
            next[task.id] = Math.min(100, cur + Math.random() * 12 + 5)
            anyUpdated = true
          }
          if (next[task.id] >= 100) {
            // Mark as done
            setTimeout(() => {
              onChange(
                tasks.map((t) =>
                  t.id === task.id
                    ? {
                        ...t,
                        overallStatus: 'success',
                        accounts: t.accounts.map((a) => ({ ...a, status: 'success' as TaskStatus })),
                      }
                    : t
                )
              )
              message.success(`「${task.title}」发布成功`)
            }, 400)
          }
        })
        if (!anyUpdated) clearInterval(timer)
        return next
      })
    }, 500)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.filter((t) => t.overallStatus === 'publishing').map((t) => t.id).join()])

  function handleDelete(id: string) {
    onChange(tasks.filter((t) => t.id !== id))
    message.success('已删除')
  }

  function handleRetry(id: string) {
    onChange(
      tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              overallStatus: 'publishing',
              accounts: t.accounts.map((a) =>
                a.status === 'failed' ? { ...a, status: 'publishing' as TaskStatus } : a
              ),
            }
          : t
      )
    )
    setProgresses((prev) => ({ ...prev, [id]: 0 }))
  }

  const columns: ColumnsType<PublishTask> = [
    {
      title: '任务名称',
      key: 'title',
      width: 200,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 2 }}>{r.title}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{r.videoName}</div>
        </div>
      ),
    },
    {
      title: '发布账号',
      key: 'accounts',
      render: (_, r) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {r.accounts.map((acc) => {
            const cfg = STATUS_CFG[acc.status]
            return (
              <Tooltip
                key={acc.accountId}
                title={
                  acc.status === 'failed'
                    ? `失败：${acc.failReason ?? '未知错误'}`
                    : cfg.label
                }
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: '#f5f5f5',
                    borderRadius: 20,
                    padding: '3px 8px 3px 4px',
                    fontSize: 12,
                    border: acc.status === 'failed' ? '1px solid #ffccc7' : '1px solid transparent',
                  }}
                >
                  <PlatformBadge platform={acc.platform} size={16} />
                  <Avatar size={16} icon={<UserOutlined />} style={{ background: '#ddd', color: '#999' }} />
                  <span>{acc.nickname}</span>
                  <span style={{ color: cfg.color === 'error' ? '#ff4d4f' : cfg.color === 'success' ? '#52c41a' : '#1677ff' }}>
                    {cfg.icon}
                  </span>
                </div>
              </Tooltip>
            )
          })}
        </div>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 140,
      render: (_, r) => {
        const cfg = STATUS_CFG[r.overallStatus]
        if (r.overallStatus === 'publishing') {
          const prog = Math.floor(progresses[r.id] ?? 0)
          return (
            <div style={{ width: 120 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <LoadingOutlined style={{ color: '#1677ff', fontSize: 12 }} />
                <span style={{ fontSize: 12 }}>发布中 {prog}%</span>
              </div>
              <Progress percent={prog} size="small" showInfo={false} />
            </div>
          )
        }
        return (
          <Tag icon={cfg.icon} color={cfg.color}>
            {cfg.label}
          </Tag>
        )
      },
    },
    {
      title: '发布时间',
      key: 'time',
      width: 140,
      render: (_, r) => (
        <div style={{ fontSize: 12 }}>
          {r.scheduledAt ? (
            <>
              <div style={{ color: '#fa8c16' }}>定时</div>
              <div>{r.scheduledAt}</div>
            </>
          ) : (
            <>
              <div style={{ color: '#999' }}>立即</div>
              <div>{r.createdAt}</div>
            </>
          )}
        </div>
      ),
    },
    {
      title: '文案',
      dataIndex: 'caption',
      width: 180,
      ellipsis: true,
      render: (v: string) => <span style={{ color: '#555', fontSize: 12 }}>{v}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 2 }}>
          {r.overallStatus === 'failed' && (
            <Tooltip title="重新发布">
              <Button type="text" size="small" icon={<RetweetOutlined />} onClick={() => handleRetry(r.id)} />
            </Tooltip>
          )}
          {r.overallStatus !== 'publishing' && (
            <Popconfirm title="确认删除该任务？" onConfirm={() => handleDelete(r.id)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </div>
      ),
    },
  ]

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={tasks}
      pagination={{ pageSize: 10 }}
      expandable={{
        expandedRowRender: (r) => (
          <div style={{ padding: '4px 48px' }}>
            <div style={{ marginBottom: 6, fontWeight: 500, fontSize: 13 }}>发布文案：</div>
            <div style={{ color: '#555', fontSize: 13, marginBottom: 8 }}>{r.caption}</div>
            {r.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {r.tags.map((tag) => (
                  <Tag key={tag} color="blue">#{tag}</Tag>
                ))}
              </div>
            )}
          </div>
        ),
      }}
    />
  )
}
