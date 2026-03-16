import { useMemo, useState } from 'react'
import {
  Button,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Tabs,
  Tag,
  Tooltip,
} from 'antd'
import {
  BulbOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  StarFilled,
  StarOutlined,
  VideoCameraAddOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { mockPrompts } from './mockData'
import type { PromptCategory, PromptItem } from './mockData'

const { TextArea } = Input

const CATEGORIES: PromptCategory[] = [
  '短剧叙事',
  '人物角色',
  '场景空间',
  '镜头运动',
  '光影氛围',
  '产品广告',
  '口播带货',
  '知识自媒体',
  '转场特效',
  '风格质感',
]

const CATEGORY_COLOR: Record<PromptCategory, string> = {
  短剧叙事: 'magenta',
  人物角色: 'gold',
  场景空间: 'blue',
  镜头运动: 'cyan',
  光影氛围: 'purple',
  产品广告: 'green',
  口播带货: 'volcano',
  知识自媒体: 'geekblue',
  转场特效: 'lime',
  风格质感: 'orange',
}

function UseBadge({ count }: { count: number }) {
  const label = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count)
  return <span style={{ color: '#8c8c8c', fontSize: 12 }}>使用 {label} 次</span>
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
    return prompts.filter((item) => {
      if (tabKey === 'favorites' && !item.isFavorited) return false
      if (tabKey === 'custom' && !item.isCustom) return false
      if (activeCategory !== 'all' && item.category !== activeCategory) return false

      if (!keyword) return true

      const text = [item.title, item.prompt, item.promptZh, item.tags.join(' ')].join(' ').toLowerCase()
      return text.includes(keyword.toLowerCase())
    })
  }, [activeCategory, keyword, prompts, tabKey])

  function handleCopy(item: PromptItem) {
    navigator.clipboard.writeText(item.prompt).then(() => {
      message.success('提示词已复制')
      setPrompts((prev) => prev.map((p) => (p.id === item.id ? { ...p, useCount: p.useCount + 1 } : p)))
    })
  }

  function toggleFav(id: string) {
    setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, isFavorited: !p.isFavorited } : p)))
  }

  function handleDelete(id: string) {
    setPrompts((prev) => prev.filter((p) => p.id !== id))
    message.success('提示词已删除')
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
    const tags = values.tags
      .split(/[，,\s]+/)
      .map((tag) => tag.trim())
      .filter(Boolean)

    if (editTarget) {
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === editTarget.id
            ? {
                ...p,
                title: values.title,
                category: values.category,
                prompt: values.prompt,
                promptZh: values.promptZh,
                tags,
              }
            : p,
        ),
      )
      message.success('提示词已更新')
    } else {
      const newItem: PromptItem = {
        id: `p_${Date.now()}`,
        title: values.title,
        category: values.category,
        prompt: values.prompt,
        promptZh: values.promptZh,
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

  const favoriteCount = prompts.filter((item) => item.isFavorited).length
  const customCount = prompts.filter((item) => item.isCustom).length

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BulbOutlined style={{ fontSize: 20, color: '#fa8c16' }} />
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>视频 AI 提示词库</h2>
          </div>
          <p style={{ margin: '6px 0 0', color: '#8c8c8c', fontSize: 13, lineHeight: 1.7 }}>
            按短剧叙事、口播带货、知识号、产品广告、镜头语言、风格质感整理常用模板。
            重点补充了 AI 短剧与 AI 批量自媒体视频场景，可直接复制到视频生成页使用。
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建提示词
        </Button>
      </div>

      <div
        style={{
          background: '#fafafa',
          border: '1px solid #f0f0f0',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8 }}>推荐写法</div>
        <div style={{ color: '#595959', fontSize: 13, lineHeight: 1.8 }}>
          结构建议：主体身份 + 核心动作 + 场景空间 + 镜头运动 + 光线氛围 + 风格质感 + 画幅比例 + 输出目标。
        </div>
        <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 6 }}>
          示例：竖屏 9:16，年轻创业者接到电话后神情骤变，办公室夜景，快速推镜，冷暖反差光，电影级短剧质感。
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input.Search
          placeholder="搜索标题、标签、中文说明或 Prompt"
          style={{ width: 280 }}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          allowClear
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['all', ...CATEGORIES] as const).map((category) => (
            <Tag
              key={category}
              color={
                activeCategory === category
                  ? category === 'all'
                    ? 'default'
                    : CATEGORY_COLOR[category as PromptCategory]
                  : undefined
              }
              style={{
                cursor: 'pointer',
                marginInlineEnd: 0,
                paddingInline: 10,
                lineHeight: '26px',
                borderRadius: 999,
                background: activeCategory === category ? undefined : '#fff',
                borderColor: '#e8e8e8',
                fontWeight: activeCategory === category ? 600 : 400,
              }}
              onClick={() => setActiveCategory(category)}
            >
              {category === 'all' ? '全部' : category}
            </Tag>
          ))}
        </div>
      </div>

      <Tabs
        activeKey={tabKey}
        onChange={(key) => setTabKey(key as typeof tabKey)}
        items={[
          { key: 'all', label: '全部提示词' },
          { key: 'favorites', label: `我的收藏${favoriteCount > 0 ? ` (${favoriteCount})` : ''}` },
          { key: 'custom', label: `自建模板${customCount > 0 ? ` (${customCount})` : ''}` },
        ]}
        style={{ marginBottom: 8 }}
      />

      {filtered.length === 0 ? (
        <Empty description="当前筛选条件下暂无提示词" style={{ marginTop: 60 }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              style={{
                background: '#fff',
                border: '1px solid #f0f0f0',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                transition: 'box-shadow 0.15s ease, transform 0.15s ease',
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.boxShadow = '0 10px 24px rgba(0, 0, 0, 0.08)'
                event.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.boxShadow = 'none'
                event.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{item.title}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Tag color={CATEGORY_COLOR[item.category]} style={{ fontSize: 11, marginInlineEnd: 0 }}>
                      {item.category}
                    </Tag>
                    {item.isCustom && (
                      <Tag color="default" style={{ fontSize: 11, marginInlineEnd: 0 }}>
                        自建
                      </Tag>
                    )}
                    {item.tags.slice(0, 4).map((tag) => (
                      <span key={tag} style={{ color: '#8c8c8c', fontSize: 11 }}>
                        #{tag}
                      </span>
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

              <div
                style={{
                  fontSize: 13,
                  color: '#434343',
                  lineHeight: 1.75,
                  background: '#fafafa',
                  borderRadius: 8,
                  padding: '10px 12px',
                  minHeight: 82,
                }}
              >
                {item.promptZh}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: '#595959',
                  lineHeight: 1.7,
                  fontFamily: 'Consolas, Monaco, monospace',
                  background: '#f5f5f5',
                  borderRadius: 8,
                  padding: '10px 12px',
                  maxHeight: 110,
                  overflow: 'hidden',
                }}
              >
                {item.prompt}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <UseBadge count={item.useCount} />
                <div style={{ display: 'flex', gap: 4 }}>
                  {item.isCustom && (
                    <>
                      <Tooltip title="编辑">
                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(item)} />
                      </Tooltip>
                      <Popconfirm title="确认删除这条提示词？" onConfirm={() => handleDelete(item.id)}>
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </>
                  )}
                  <Tooltip title="复制后跳转到视频生成页">
                    <Button
                      type="text"
                      size="small"
                      icon={<VideoCameraAddOutlined />}
                      onClick={() => {
                        handleCopy(item)
                        navigate('/video-gen')
                      }}
                    />
                  </Tooltip>
                  <Button type="primary" size="small" icon={<CopyOutlined />} onClick={() => handleCopy(item)}>
                    复制
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        title={editTarget ? '编辑提示词' : '新建提示词'}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        okText="保存"
        width={620}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="例如：短剧反转结尾定格" />
          </Form.Item>

          <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select options={CATEGORIES.map((category) => ({ value: category, label: category }))} placeholder="选择分类" />
          </Form.Item>

          <Form.Item name="promptZh" label="中文说明" rules={[{ required: true, message: '请输入中文说明' }]}>
            <TextArea placeholder="描述它适合什么视频场景、镜头目标和使用方式" autoSize={{ minRows: 3, maxRows: 5 }} />
          </Form.Item>

          <Form.Item name="prompt" label="Prompt 内容" rules={[{ required: true, message: '请输入 Prompt' }]}>
            <TextArea
              placeholder="输入可直接用于视频 AI 生成的完整提示词"
              autoSize={{ minRows: 4, maxRows: 8 }}
              style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: 13 }}
            />
          </Form.Item>

          <Form.Item name="tags" label="标签">
            <Input placeholder="用中文逗号、英文逗号或空格分隔，例如：短剧，反转，竖屏，高情绪" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
