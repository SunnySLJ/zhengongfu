import { useState } from 'react'
import {
  Card,
  Button,
  Input,
  Select,
  Tag,
  Slider,
  Progress,
  Empty,
  message,
  Divider,
  Radio,
} from 'antd'
import {
  VideoCameraAddOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  RedoOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'

const { TextArea } = Input

interface GenTask {
  id: string
  script: string
  style: string
  duration: number
  status: 'pending' | 'processing' | 'done'
  progress: number
  createdAt: string
}

const STYLE_OPTIONS = [
  { value: 'real', label: '真实风格' },
  { value: 'anime', label: '动漫风格' },
  { value: 'cinematic', label: '电影感' },
  { value: 'vlog', label: 'Vlog风' },
  { value: 'product', label: '产品展示' },
]

const VOICE_OPTIONS = [
  { value: 'female1', label: '甜美女声' },
  { value: 'female2', label: '知性女声' },
  { value: 'male1', label: '磁性男声' },
  { value: 'male2', label: '活力男声' },
  { value: 'none', label: '不添加配音' },
]

const RATIO_OPTIONS = [
  { value: '9:16', label: '9:16 竖屏' },
  { value: '16:9', label: '16:9 横屏' },
  { value: '1:1', label: '1:1 方形' },
]

export default function VideoGenPage() {
  const [script, setScript] = useState('')
  const [style, setStyle] = useState('real')
  const [voice, setVoice] = useState('female1')
  const [ratio, setRatio] = useState('9:16')
  const [duration, setDuration] = useState(15)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [history, setHistory] = useState<GenTask[]>([
    {
      id: 'h1',
      script: '春天来了，万物复苏，樱花盛开，粉色的花瓣随风飘落…',
      style: '真实风格',
      duration: 15,
      status: 'done',
      progress: 100,
      createdAt: '2025-03-14 16:22',
    },
    {
      id: 'h2',
      script: '新品上市！限时优惠，全场8折，错过再等一年…',
      style: '产品展示',
      duration: 30,
      status: 'done',
      progress: 100,
      createdAt: '2025-03-14 14:10',
    },
  ])

  function handleGenerate() {
    if (!script.trim()) {
      message.warning('请输入视频脚本')
      return
    }

    const task: GenTask = {
      id: 'g_' + Date.now(),
      script,
      style: STYLE_OPTIONS.find((s) => s.value === style)?.label ?? style,
      duration,
      status: 'processing',
      progress: 0,
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    }

    setHistory((prev) => [task, ...prev])
    setGenerating(true)
    setProgress(0)

    let p = 0
    const timer = setInterval(() => {
      p += Math.random() * 8 + 3
      if (p >= 100) {
        p = 100
        clearInterval(timer)
        setGenerating(false)
        setProgress(100)
        setHistory((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: 'done', progress: 100 } : t))
        )
        message.success('视频生成完成！')
      } else {
        setProgress(Math.floor(p))
        setHistory((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, progress: Math.floor(p) } : t))
        )
      }
    }, 300)
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>视频生成</h2>
        <p style={{ margin: '4px 0 0', color: '#999', fontSize: 13 }}>
          输入文案脚本，AI 自动匹配素材、配乐、字幕，一键生成短视频
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
        {/* Left: editor */}
        <div>
          <Card title="脚本编辑" style={{ marginBottom: 16 }}>
            <TextArea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="输入视频文案脚本，支持分镜描述。&#10;&#10;例：&#10;【镜头一】清晨的咖啡馆，阳光透过玻璃洒在木桌上…&#10;【镜头二】主角端起咖啡，微微一笑…"
              autoSize={{ minRows: 8, maxRows: 16 }}
              showCount
              maxLength={1000}
              style={{ marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['早安氛围', '产品种草', '旅行日记', '美食探店', '励志正能量'].map((tag) => (
                <Tag
                  key={tag}
                  style={{ cursor: 'pointer' }}
                  onClick={() =>
                    setScript((prev) =>
                      prev ? prev + '\n' + tag + '风格的短视频脚本' : tag + '风格的短视频脚本'
                    )
                  }
                >
                  + {tag}
                </Tag>
              ))}
            </div>
          </Card>

          <Card title="风格配置">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>画面风格</div>
                <Select
                  value={style}
                  onChange={setStyle}
                  options={STYLE_OPTIONS}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>AI 配音</div>
                <Select
                  value={voice}
                  onChange={setVoice}
                  options={VOICE_OPTIONS}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>画面比例</div>
                <Radio.Group value={ratio} onChange={(e) => setRatio(e.target.value)}>
                  {RATIO_OPTIONS.map((r) => (
                    <Radio.Button key={r.value} value={r.value} style={{ fontSize: 12 }}>
                      {r.label}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </div>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>
                  视频时长：<span style={{ color: '#ff4d4f' }}>{duration}s</span>
                </div>
                <Slider
                  min={10}
                  max={60}
                  step={5}
                  value={duration}
                  onChange={setDuration}
                  marks={{ 10: '10s', 30: '30s', 60: '60s' }}
                />
              </div>
            </div>

            <Divider />

            {generating ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <LoadingOutlined style={{ color: '#1677ff' }} />
                  <span>AI 正在生成视频…</span>
                  <span style={{ color: '#999', fontSize: 12 }}>{progress}%</span>
                </div>
                <Progress percent={progress} strokeColor={{ from: '#ff4d4f', to: '#ff7a45' }} />
              </div>
            ) : (
              <Button
                type="primary"
                icon={<VideoCameraAddOutlined />}
                size="large"
                onClick={handleGenerate}
                style={{ background: 'linear-gradient(135deg, #ff4d4f, #ff7a45)', border: 'none' }}
              >
                立即生成视频
              </Button>
            )}
          </Card>
        </div>

        {/* Right: history */}
        <div>
          <Card
            title="生成记录"
            styles={{ body: { padding: 0 } }}
          >
            {history.length === 0 ? (
              <Empty description="暂无记录" style={{ padding: 32 }} />
            ) : (
              history.map((task, i) => (
                <div
                  key={task.id}
                  style={{
                    padding: '14px 16px',
                    borderBottom: i < history.length - 1 ? '1px solid #f5f5f5' : undefined,
                  }}
                >
                  {/* Preview area */}
                  <div
                    style={{
                      height: 80,
                      background: 'linear-gradient(135deg, #f0f0f0, #e8e8e8)',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                      color: '#bbb',
                      fontSize: 24,
                      position: 'relative',
                    }}
                  >
                    {task.status === 'done' ? (
                      <PlayCircleOutlined />
                    ) : (
                      <LoadingOutlined />
                    )}
                    {task.status === 'done' && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          background: '#52c41a',
                          borderRadius: 4,
                          padding: '1px 6px',
                          color: '#fff',
                          fontSize: 11,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <CheckCircleOutlined />完成
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: '#555',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: 4,
                    }}
                  >
                    {task.script}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                    <Tag style={{ fontSize: 11 }}>{task.style}</Tag>
                    <Tag style={{ fontSize: 11 }}>{task.duration}s</Tag>
                  </div>

                  {task.status === 'processing' && (
                    <Progress percent={task.progress} size="small" showInfo={false} style={{ marginBottom: 6 }} />
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#bbb', fontSize: 11 }}>{task.createdAt}</span>
                    {task.status === 'done' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Button type="text" size="small" icon={<DownloadOutlined />} style={{ fontSize: 12 }} />
                        <Button type="text" size="small" icon={<RedoOutlined />} style={{ fontSize: 12 }} />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
