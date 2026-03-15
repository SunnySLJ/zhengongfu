import { useState } from 'react'
import {
  Steps,
  Card,
  Button,
  Upload,
  Table,
  Tag,
  Progress,
  Empty,
  message,
  Radio,
  InputNumber,
  Tooltip,
} from 'antd'
import {
  UploadOutlined,
  ThunderboltOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

interface MaterialFile {
  uid: string
  name: string
  size: string
  duration: string
  status: 'ready' | 'processing' | 'done' | 'error'
  progress?: number
  outputUrl?: string
}

const mockTemplates = [
  { id: 't1', name: '活力节奏款', duration: '15s', tags: ['美妆', '服装'], thumb: '' },
  { id: 't2', name: '沉浸叙事款', duration: '30s', tags: ['美食', '旅行'], thumb: '' },
  { id: 't3', name: '卡点爆款款', duration: '20s', tags: ['通用'], thumb: '' },
  { id: 't4', name: '产品展示款', duration: '60s', tags: ['电商', '3C'], thumb: '' },
]

const STEPS = ['选择模板', '上传素材', '配置参数', '开始生产']

export default function BatchMixPage() {
  const [current, setCurrent] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [materials, setMaterials] = useState<MaterialFile[]>([])
  const [outputCount, setOutputCount] = useState(3)
  const [resolution, setResolution] = useState<'1080p' | '720p'>('1080p')
  const [running, setRunning] = useState(false)
  const [tasks, setTasks] = useState<MaterialFile[]>([])

  function handleUpload(file: File) {
    const newFile: MaterialFile = {
      uid: 'f_' + Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
      duration: Math.floor(Math.random() * 60 + 10) + 's',
      status: 'ready',
    }
    setMaterials((prev) => [...prev, newFile])
    return false // prevent antd auto upload
  }

  function removeMaterial(uid: string) {
    setMaterials((prev) => prev.filter((m) => m.uid !== uid))
  }

  function startBatch() {
    if (!selectedTemplate) { message.warning('请先选择模板'); return }
    if (materials.length === 0) { message.warning('请至少上传一个素材'); return }

    const initialTasks: MaterialFile[] = Array.from({ length: outputCount }, (_, i) => ({
      uid: 'task_' + i,
      name: `混剪视频_${String(i + 1).padStart(2, '0')}.mp4`,
      size: '-',
      duration: mockTemplates.find((t) => t.id === selectedTemplate)?.duration ?? '-',
      status: 'processing',
      progress: 0,
    }))
    setTasks(initialTasks)
    setRunning(true)
    setCurrent(3)

    // Simulate progress
    let tick = 0
    const timer = setInterval(() => {
      tick += 1
      setTasks((prev) =>
        prev.map((t, i) => {
          const targetProg = Math.min(100, tick * 4 - i * 12)
          if (targetProg <= 0) return t
          if (t.status === 'done') return t
          if (targetProg >= 100) {
            return { ...t, status: 'done', progress: 100, size: (Math.random() * 30 + 10).toFixed(1) + ' MB' }
          }
          return { ...t, progress: targetProg }
        })
      )
      if (tick >= 28) {
        clearInterval(timer)
        setRunning(false)
        message.success('批量混剪完成！')
      }
    }, 200)
  }

  const statusIcon = (s: MaterialFile) => {
    if (s.status === 'done') return <CheckCircleOutlined style={{ color: '#52c41a' }} />
    if (s.status === 'processing') return <LoadingOutlined style={{ color: '#1677ff' }} />
    return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />
  }

  const taskColumns: ColumnsType<MaterialFile> = [
    { title: '', dataIndex: 'status', width: 32, render: (_, r) => statusIcon(r) },
    { title: '文件名', dataIndex: 'name', ellipsis: true },
    { title: '时长', dataIndex: 'duration', width: 70 },
    { title: '大小', dataIndex: 'size', width: 90 },
    {
      title: '进度',
      key: 'progress',
      width: 140,
      render: (_, r) =>
        r.status === 'done' ? (
          <Tag color="success">已完成</Tag>
        ) : (
          <Progress percent={r.progress ?? 0} size="small" showInfo={false} />
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, r) =>
        r.status === 'done' ? (
          <Tooltip title="下载">
            <Button type="link" size="small" icon={<DownloadOutlined />} />
          </Tooltip>
        ) : null,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>批量混剪</h2>
        <p style={{ margin: '4px 0 0', color: '#999', fontSize: 13 }}>
          选择模板，批量上传素材，一键生成多条混剪视频
        </p>
      </div>

      <Steps
        current={current}
        items={STEPS.map((s) => ({ title: s }))}
        style={{ marginBottom: 32 }}
        onChange={(v) => { if (!running) setCurrent(v) }}
      />

      {/* Step 0: Choose template */}
      {current === 0 && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
              marginBottom: 24,
            }}
          >
            {mockTemplates.map((t) => (
              <Card
                key={t.id}
                hoverable
                onClick={() => setSelectedTemplate(t.id)}
                style={{
                  border: selectedTemplate === t.id ? '2px solid #ff4d4f' : '1px solid #f0f0f0',
                  cursor: 'pointer',
                }}
                styles={{ body: { padding: 12 } }}
              >
                <div
                  style={{
                    height: 120,
                    background: 'linear-gradient(135deg, #f5f5f5, #e8e8e8)',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                    color: '#bbb',
                    fontSize: 28,
                  }}
                >
                  <PlayCircleOutlined />
                </div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{t.name}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <Tag color="default">{t.duration}</Tag>
                  {t.tags.map((tag) => (
                    <Tag key={tag} color="blue">{tag}</Tag>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          <Button
            type="primary"
            disabled={!selectedTemplate}
            onClick={() => setCurrent(1)}
          >
            下一步：上传素材
          </Button>
        </div>
      )}

      {/* Step 1: Upload materials */}
      {current === 1 && (
        <div>
          <Upload.Dragger
            multiple
            accept="video/*"
            beforeUpload={handleUpload}
            showUploadList={false}
            style={{ marginBottom: 16 }}
          >
            <p style={{ fontSize: 32, color: '#bbb', margin: '8px 0' }}><UploadOutlined /></p>
            <p style={{ fontWeight: 500 }}>点击或拖拽上传视频素材</p>
            <p style={{ color: '#999', fontSize: 12 }}>支持 mp4、mov、avi，单文件最大 500MB</p>
          </Upload.Dragger>

          {materials.length > 0 && (
            <Table
              rowKey="uid"
              size="small"
              pagination={false}
              style={{ marginBottom: 16 }}
              dataSource={materials}
              columns={[
                { title: '文件名', dataIndex: 'name', ellipsis: true },
                { title: '大小', dataIndex: 'size', width: 90 },
                { title: '时长', dataIndex: 'duration', width: 80 },
                {
                  title: '',
                  key: 'del',
                  width: 40,
                  render: (_, r) => (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeMaterial(r.uid)}
                    />
                  ),
                },
              ]}
            />
          )}

          {materials.length === 0 && (
            <Empty description="暂无素材" style={{ margin: '16px 0' }} />
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={() => setCurrent(0)}>上一步</Button>
            <Button type="primary" disabled={materials.length === 0} onClick={() => setCurrent(2)}>
              下一步：配置参数
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Config */}
      {current === 2 && (
        <Card style={{ maxWidth: 480 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>输出数量</div>
            <InputNumber
              min={1}
              max={50}
              value={outputCount}
              onChange={(v) => setOutputCount(v ?? 1)}
              addonAfter="条"
            />
            <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
              将基于 {materials.length} 个素材随机组合，生成 {outputCount} 条不同混剪
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>输出分辨率</div>
            <Radio.Group value={resolution} onChange={(e) => setResolution(e.target.value)}>
              <Radio.Button value="1080p">1080P</Radio.Button>
              <Radio.Button value="720p">720P</Radio.Button>
            </Radio.Group>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={() => setCurrent(1)}>上一步</Button>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={startBatch}
            >
              开始批量混剪
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Progress */}
      {current === 3 && (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            {running ? (
              <>
                <LoadingOutlined style={{ color: '#1677ff', fontSize: 18 }} />
                <span>正在生成中，请稍候…</span>
              </>
            ) : (
              <>
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                <span style={{ fontWeight: 500 }}>全部生成完成！</span>
                <Button
                  type="primary"
                  ghost
                  size="small"
                  onClick={() => {
                    setTasks([])
                    setMaterials([])
                    setSelectedTemplate('')
                    setCurrent(0)
                  }}
                >
                  再次制作
                </Button>
              </>
            )}
          </div>
          <Table
            rowKey="uid"
            size="small"
            pagination={false}
            dataSource={tasks}
            columns={taskColumns}
          />
        </div>
      )}
    </div>
  )
}
