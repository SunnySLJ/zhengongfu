import { useState } from 'react'
import { Modal, Button, Tag, Spin, message, Divider } from 'antd'
import { CopyOutlined, SoundOutlined, BulbOutlined, PlayCircleOutlined } from '@ant-design/icons'
import type { VideoCopyResult } from './mockData'
import { fetchVideoCopy } from '../../services/trendApi'

interface Props {
  topic: string
  description: string
  open: boolean
  onClose: () => void
}

const SEG_COLORS = ['#FF6B35', '#FFB300', '#7B61FF', '#00C9A7', '#FF4081', '#448AFF']

export default function VideoCopyModal({ topic, description, open, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<VideoCopyResult | null>(null)

  async function generate() {
    setLoading(true)
    setData(null)
    try {
      const result = await fetchVideoCopy(topic, description)
      setData(result)
    } catch (err) {
      message.error(`生成失败: ${err instanceof Error ? err.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => message.success('已复制到剪贴板'))
  }

  // Auto-generate when opened
  if (open && !data && !loading) {
    generate()
  }

  return (
    <Modal
      open={open}
      onCancel={() => { onClose(); setData(null) }}
      footer={null}
      width={640}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PlayCircleOutlined style={{ color: '#FE2C55' }} />
          <span>视频文案生成</span>
          <Tag color="red">{topic}</Tag>
        </div>
      }
    >
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#8c8c8c' }}>AI 正在为「{topic}」生成完整文案...</div>
        </div>
      )}

      {data && !loading && (
        <div>
          {/* Title & Hook */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>{data.title}</h3>
            <div style={{
              padding: '12px 16px', borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(255,107,53,0.06), rgba(254,44,85,0.06))',
              border: '1px solid rgba(254,44,85,0.15)',
              fontSize: 15, fontWeight: 600, color: '#FE2C55',
            }}>
              🎣 {data.hook}
            </div>
          </div>

          {/* Full Script */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>📜 完整口播文案</span>
              <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(data.full_script)}>
                复制文案
              </Button>
            </div>
            <div style={{
              background: '#fafafa', borderRadius: 8, padding: 16,
              fontSize: 14, lineHeight: 1.9, color: '#333',
              maxHeight: 240, overflowY: 'auto', whiteSpace: 'pre-wrap',
            }}>
              {data.full_script}
            </div>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {/* Segments */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>🎬 分镜脚本</div>
            {data.segments.map((seg, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, padding: '10px 14px', marginBottom: 6,
                borderLeft: `3px solid ${SEG_COLORS[i % SEG_COLORS.length]}`,
                background: '#fafafa', borderRadius: '0 8px 8px 0',
              }}>
                <div style={{
                  fontWeight: 700, fontSize: 12, color: SEG_COLORS[i % SEG_COLORS.length],
                  minWidth: 55, fontFamily: 'monospace',
                }}>
                  {seg.time}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 4 }}>{seg.text}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>📷 {seg.action}</div>
                </div>
              </div>
            ))}
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {/* Tags */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>🏷️ 推荐标签</span>
              <Button size="small" icon={<CopyOutlined />}
                onClick={() => handleCopy(data.hashtags.join(' '))}>
                复制标签
              </Button>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {data.hashtags.map((tag) => (
                <Tag key={tag} color="red">{tag}</Tag>
              ))}
            </div>
          </div>

          {/* BGM & Tips */}
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#8c8c8c' }}>
            <span><SoundOutlined /> BGM: {data.bgm_suggestion}</span>
            <span><BulbOutlined /> {data.tips}</span>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          <Button block type="primary" icon={<CopyOutlined />}
            onClick={() => handleCopy(`${data.title}\n\n${data.full_script}\n\n${data.hashtags.join(' ')}`)}>
            一键复制全部内容
          </Button>
        </div>
      )}

      {!data && !loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Button type="primary" size="large" onClick={generate}>
            生成视频文案
          </Button>
        </div>
      )}
    </Modal>
  )
}
