import { useState } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Checkbox,
  Avatar,
  message,
  Radio,
} from 'antd'
import { UserOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { PlatformAccount, PublishTask } from './types'
import { PlatformBadge } from './PlatformIcon'

const { TextArea } = Input

// Mock videos available to publish
const MOCK_VIDEOS = [
  { value: '混剪视频_01.mp4', label: '混剪视频_01.mp4' },
  { value: '混剪视频_02.mp4', label: '混剪视频_02.mp4' },
  { value: '视频生成_01.mp4', label: '视频生成_01.mp4' },
  { value: '视频生成_02.mp4', label: '视频生成_02.mp4' },
]

interface Props {
  open: boolean
  accounts: PlatformAccount[]
  onCancel: () => void
  onCreate: (task: PublishTask) => void
}

export default function CreateTaskModal({ open, accounts, onCancel, onCreate }: Props) {
  const [form] = Form.useForm()
  const [publishMode, setPublishMode] = useState<'now' | 'scheduled'>('now')
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])

  const connectedAccounts = accounts.filter((a) => a.status === 'connected')

  function handleOk() {
    form.validateFields().then((values) => {
      if (selectedAccounts.length === 0) {
        message.warning('请至少选择一个发布账号')
        return
      }

      const rawTags: string = values.tags ?? ''
      const tags = rawTags
        .split(/[，,#\s]+/)
        .map((t: string) => t.replace(/^#/, '').trim())
        .filter(Boolean)

      const task: PublishTask = {
        id: 'task_' + Date.now(),
        title: values.title,
        videoName: values.videoName,
        caption: values.caption,
        tags,
        accounts: selectedAccounts.map((id) => {
          const acc = accounts.find((a) => a.id === id)!
          return { accountId: id, platform: acc.platform, nickname: acc.nickname, status: publishMode === 'now' ? 'publishing' : 'scheduled' }
        }),
        scheduledAt: publishMode === 'scheduled' && values.scheduledAt
          ? dayjs(values.scheduledAt).format('YYYY-MM-DD HH:mm')
          : null,
        createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
        overallStatus: publishMode === 'now' ? 'publishing' : 'scheduled',
      }

      onCreate(task)
      form.resetFields()
      setSelectedAccounts([])
      setPublishMode('now')
    })
  }

  return (
    <Modal
      title="创建发布任务"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="确认发布"
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="title" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}>
          <Input placeholder="如：春季活动推广" />
        </Form.Item>

        <Form.Item name="videoName" label="选择视频" rules={[{ required: true, message: '请选择视频' }]}>
          <Select placeholder="选择要发布的视频" options={MOCK_VIDEOS} />
        </Form.Item>

        <Form.Item name="caption" label="发布文案" rules={[{ required: true, message: '请输入发布文案' }]}>
          <TextArea
            placeholder="输入发布文案，支持 emoji…"
            autoSize={{ minRows: 3, maxRows: 6 }}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item name="tags" label="话题标签">
          <Input placeholder="输入标签，逗号或空格分隔，如：春季新品, 限时优惠" />
        </Form.Item>

        {/* Account selection */}
        <Form.Item label="发布账号" required>
          {connectedAccounts.length === 0 ? (
            <div style={{ color: '#ff4d4f', fontSize: 13 }}>暂无已连接账号，请先在「账号管理」中绑定</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(['douyin', 'xiaohongshu'] as const).map((platform) => {
                const list = connectedAccounts.filter((a) => a.platform === platform)
                if (list.length === 0) return null
                return (
                  <div key={platform}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <PlatformBadge platform={platform} size={18} />
                      <span style={{ fontSize: 13, color: '#666' }}>
                        {platform === 'douyin' ? '抖音' : '小红书'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 26 }}>
                      {list.map((acc) => (
                        <Checkbox
                          key={acc.id}
                          checked={selectedAccounts.includes(acc.id)}
                          onChange={(e) => {
                            setSelectedAccounts((prev) =>
                              e.target.checked ? [...prev, acc.id] : prev.filter((id) => id !== acc.id)
                            )
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <Avatar size={20} icon={<UserOutlined />} style={{ background: '#f0f0f0', color: '#999' }} />
                            {acc.nickname}
                          </span>
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Form.Item>

        {/* Publish time */}
        <Form.Item label="发布时间" required>
          <Radio.Group value={publishMode} onChange={(e) => setPublishMode(e.target.value)}>
            <Radio value="now">立即发布</Radio>
            <Radio value="scheduled">定时发布</Radio>
          </Radio.Group>
          {publishMode === 'scheduled' && (
            <Form.Item
              name="scheduledAt"
              noStyle
              rules={[{ required: true, message: '请选择发布时间' }]}
            >
              <DatePicker
                showTime={{ format: 'HH:mm' }}
                format="YYYY-MM-DD HH:mm"
                placeholder="选择发布时间"
                style={{ marginTop: 10, width: '100%' }}
                disabledDate={(d) => d && d.isBefore(dayjs(), 'day')}
              />
            </Form.Item>
          )}
        </Form.Item>
      </Form>
    </Modal>
  )
}
