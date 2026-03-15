import { useState, useMemo } from 'react'
import {
  Input, Tag, Button, Modal, Form, Select, message,
  Tooltip, Tabs, Empty, Popconfirm,
} from 'antd'
import {
  BulbOutlined, CopyOutlined, StarOutlined, StarFilled,
  PlusOutlined, EditOutlined, DeleteOutlined, VideoCameraAddOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { mockPrompts } from './mockData'
import type { PromptItem, PromptCategory } from './mockData'

const { TextArea } = Input

const CATEGORIES: PromptCategory[] = ['风格', '场景', '产品', '人物', '氛围', '运镜']

const CATEGORY_COLOR: Record<PromptCategory, string> = {
  风格: 'purple', 场景: 'blue', 产品: 'green',
  人物: 'orange', 氛围: 'pink', 运镜: 'cyan',
}

function UseBadge({ count }: { count: number }) {
  const label = count >= 1000 ? (count / 1000).toFixed(1) + 'k' : String(count)
  return <span style={{ color: '#bbb', fontSize: 12 }}>使用 {label} 次</span>
}

interface CreateForm {
  title: string
  category: PromptCategory
  prompt: string
  promptZh: string
  tags: string
}

export default function PromptLibPage() {
  const [prompts, setPrompts] = useState<PromptItem[]>(mockPrompts)
  const [keyword, setKeyword] = useState('')
  const [activeCategory, setActiveCategory] = useState<PromptCategory | 'all'>('all')
  const [tabKey, setTabKey] = useState<'all' | 'favorites' | 'custom'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PromptItem | null>(null)
  const [form] = Form.useForm<CreateForm>()
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    return prompts.filter((p) => {
      if (tabKey === 'favorites' && !p.isFavorited) return false
      if (tabKey === 'custom' && !p.isCustom) return false
      if (activeCategory !== 'all' && p.category !== activeCategory) return false
      if (keyword && !p.title.includes(keyword) && !p.prompt.includes(keyword) && !p.promptZh.includes(keyword)) return false
      return true
    })
  }, [prompts, tabKey, activeCategory, keyword])

  function handleCopy(item: PromptItem) {
    navigator.clipboard.writeText(item.prompt).then(() => {
      message.success('提示词已复制')
      setPrompts((prev) =>
        prev.map((p) => p.id === item.id ? { ...p, useCount: p.useCount + 1 } : p)
      )
    })
  }

  function toggleFav(id: string) {
    setPrompts((prev) =>
      prev.map((p) => p.id === id ? { ...p, isFavorited: !p.isFavorited } : p)
    )
  }

  function handleDelete(id: string) {
    setPrompts((prev) => prev.filter((p) => p.id !== id))
    message.success('已删除')
  }

  function openCreate() {
    form.resetFields()
    setEditTarget(null)
    setCreateOpen(true)
  }

  function openEdit(item: PromptItem) {
    setEditTarget(item)
    form.setFieldsValue({
      title: item.title,
      category: item.category,
      prompt: item.prompt,
      promptZh: item.promptZh,
      tags: item.tags.join('，'),
    })
    setCreateOpen(true)
  }

  function handleSave(values: CreateForm) {
    const tags = values.tags.split(/[，,\s]+/).map((t) => t.trim()).filter(Boolean)
    if (editTarget) {
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === editTarget.id ? { ...p, ...values, tags } : p
        )
      )
      message.success('已更新')
    } else {
      const newItem: PromptItem = {
        id: 'p_' + Date.now(),
        title: values.title,
        prompt: values.prompt,
        promptZh: values.promptZh,
        category: values.category,
        tags,
        useCount: 0,
        isFavorited: false,
        isCustom: true,
        createdAt: new Date().toISOString().split('T')[0],
      }
      setPrompts((prev) => [newItem, ...prev])
      message.success('提示词已创建')
    }
    setCreateOpen(false)
  }

  const favCount = prompts.filter((p) => p.isFavorited).length
  const customCount = prompts.filter((p) => p.isCustom).length

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BulbOutlined style={{ fontSize: 20, color: '#fa8c16' }} />
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>提示词库</h2>
          </div>
          <p style={{ margin: '4px 0 0', color: '#999', fontSize: 13 }}>
            精选 AI 视频生成提示词，一键复制即可用于视频生成
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建提示词
        </Button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input.Search
          placeholder="搜索提示词"
          style={{ width: 220 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['all', ...CATEGORIES] as const).map((c) => (
            <Tag
              key={c}
              color={activeCategory === c ? (c === 'all' ? 'default' : CATEGORY_COLOR[c as PromptCategory]) : undefined}
              style={{
                cursor: 'pointer',
                background: activeCategory === c ? undefined : '#fafafa',
                fontWeight: activeCategory === c ? 600 : 400,
              }}
              onClick={() => setActiveCategory(c)}
            >
              {c === 'all' ? '全部' : c}
            </Tag>
          ))}
        </div>
      </div>

      <Tabs
        activeKey={tabKey}
        onChange={(k) => setTabKey(k as typeof tabKey)}
        items={[
          { key: 'all', label: '全部提示词' },
          { key: 'favorites', label: `我的收藏${favCount > 0 ? ` (${favCount})` : ''}` },
          { key: 'custom', label: `自建${customCount > 0 ? ` (${customCount})` : ''}` },
        ]}
        style={{ marginBottom: 8 }}
      />

      {/* Prompt grid */}
      {filtered.length === 0 ? (
        <Empty description="暂无提示词" style={{ marginTop: 60 }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              style={{
                background: '#fff',
                border: '1px solid #f0f0f0',
                borderRadius: 10,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
            >
              {/* Title row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Tag color={CATEGORY_COLOR[item.category]} style={{ fontSize: 11 }}>{item.category}</Tag>
                    {item.isCustom && <Tag color="default" style={{ fontSize: 11 }}>自建</Tag>}
                    {item.tags.slice(0, 3).map((t) => (
                      <span key={t} style={{ color: '#999', fontSize: 11 }}>#{t}</span>
                    ))}
                  </div>
                </div>
                <Button
                  type="text"
                  size="small"
                  icon={item.isFavorited ? <StarFilled style={{ color: '#fa8c16' }} /> : <StarOutlined />}
                  onClick={() => toggleFav(item.id)}
                />
              </div>

              {/* Chinese description */}
              <div style={{
                fontSize: 13, color: '#555', lineHeight: 1.7,
                background: '#f9f9f9', borderRadius: 6, padding: '8px 10px',
              }}>
                {item.promptZh}
              </div>

              {/* English prompt */}
              <div style={{
                fontSize: 12, color: '#888', lineHeight: 1.6,
                fontFamily: 'monospace',
                background: '#f5f5f5', borderRadius: 6, padding: '8px 10px',
                maxHeight: 64, overflow: 'hidden',
                maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
              }}>
                {item.prompt}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <UseBadge count={item.useCount} />
                <div style={{ display: 'flex', gap: 4 }}>
                  {item.isCustom && (
                    <>
                      <Tooltip title="编辑">
                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(item)} />
                      </Tooltip>
                      <Popconfirm title="确认删除？" onConfirm={() => handleDelete(item.id)}>
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </>
                  )}
                  <Tooltip title="用于视频生成">
                    <Button
                      type="text"
                      size="small"
                      icon={<VideoCameraAddOutlined />}
                      onClick={() => { handleCopy(item); navigate('/video-gen') }}
                    />
                  </Tooltip>
                  <Button
                    type="primary"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(item)}
                  >
                    复制
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        title={editTarget ? '编辑提示词' : '新建提示词'}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        okText="保存"
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="简短描述这条提示词，如：赛博朋克城市夜景" />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              placeholder="选择分类"
            />
          </Form.Item>
          <Form.Item
            name="promptZh"
            label="中文说明"
            rules={[{ required: true, message: '请输入中文说明' }]}
          >
            <TextArea placeholder="描述这条提示词的效果（中文）" autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          <Form.Item
            name="prompt"
            label="英文提示词（Prompt）"
            rules={[{ required: true, message: '请输入提示词' }]}
          >
            <TextArea
              placeholder="输入用于 AI 视频生成的英文提示词..."
              autoSize={{ minRows: 3, maxRows: 6 }}
              style={{ fontFamily: 'monospace', fontSize: 13 }}
            />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Input placeholder="用逗号分隔，如：赛博朋克，城市，夜景" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
