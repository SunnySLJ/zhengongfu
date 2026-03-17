import { useState, useEffect } from 'react'
import { Card, Button, Tag, Empty, Spin, message, Tooltip, Modal } from 'antd'
import {
  PlayCircleOutlined,
  DownloadOutlined,
  CopyOutlined,
  ReloadOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'

interface VideoRecord {
  task_id: string
  video_url: string
  prompt: string
  provider: string
  duration: number
  created_at: string
  completed_at: string
}

function VideoCard({ record, onDelete }: { record: VideoRecord; onDelete: (id: string) => void }) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const hasVideo = !!record.video_url

  function copyUrl() {
    navigator.clipboard.writeText(record.video_url).then(() => message.success('链接已复制'))
  }

  function download() {
    const a = document.createElement('a')
    a.href = record.video_url
    a.download = `video_${record.task_id.slice(0, 8)}.mp4`
    a.target = '_blank'
    a.click()
  }

  return (
    <>
      <Card
        hoverable
        style={{ borderRadius: 10, overflow: 'hidden' }}
        bodyStyle={{ padding: 0 }}
        cover={
          <div
            style={{
              position: 'relative',
              height: 180,
              background: '#0f0f1a',
              cursor: hasVideo ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => hasVideo && setPreviewOpen(true)}
          >
            {hasVideo ? (
              <>
                <video
                  src={record.video_url}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                  muted
                  preload="metadata"
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.3)',
                  }}
                >
                  <PlayCircleOutlined style={{ fontSize: 40, color: '#fff', opacity: 0.9 }} />
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#555' }}>
                <VideoCameraOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                <div style={{ fontSize: 12 }}>视频生成中...</div>
              </div>
            )}
          </div>
        }
      >
        <div style={{ padding: '10px 12px' }}>
          {/* Prompt */}
          <Tooltip title={record.prompt}>
            <div
              style={{
                fontSize: 12,
                color: '#333',
                marginBottom: 8,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {record.prompt || '(无 Prompt)'}
            </div>
          </Tooltip>

          {/* Meta */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            {record.provider && (
              <Tag color="purple" style={{ fontSize: 10, margin: 0 }}>
                {record.provider}
              </Tag>
            )}
            {record.duration && (
              <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>
                {record.duration}s
              </Tag>
            )}
            <Tag color={hasVideo ? 'success' : 'processing'} style={{ fontSize: 10, margin: 0 }}>
              {hasVideo ? '已完成' : '生成中'}
            </Tag>
          </div>

          {/* Time */}
          <div style={{ fontSize: 10, color: '#aaa', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ClockCircleOutlined />
            {record.created_at || record.completed_at || ''}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6 }}>
            {hasVideo && (
              <>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={copyUrl}
                  style={{ flex: 1, fontSize: 11 }}
                >
                  复制链接
                </Button>
                <Button
                  size="small"
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={download}
                  style={{ flex: 1, fontSize: 11 }}
                >
                  下载
                </Button>
              </>
            )}
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record.task_id)}
              style={{ fontSize: 11 }}
            />
          </div>
        </div>
      </Card>

      {/* 全屏预览 */}
      <Modal
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width={480}
        centered
        bodyStyle={{ padding: 0, background: '#000', borderRadius: 8, overflow: 'hidden' }}
      >
        <video
          src={record.video_url}
          controls
          autoPlay
          style={{ width: '100%', display: 'block', maxHeight: '80vh' }}
        />
        <div style={{ padding: '8px 12px', background: '#111', display: 'flex', gap: 8 }}>
          <Button
            block
            icon={<CopyOutlined />}
            onClick={copyUrl}
            style={{ background: '#222', border: 'none', color: '#fff', fontSize: 12 }}
          >
            复制链接
          </Button>
          <Button
            block
            type="primary"
            icon={<DownloadOutlined />}
            onClick={download}
            style={{ fontSize: 12 }}
          >
            下载视频
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default function VideoHistoryPage() {
  const [records, setRecords] = useState<VideoRecord[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const resp = await fetch('/api/zgf/video-history')
      const data = await resp.json()
      setRecords(data.items || [])
    } catch {
      message.error('加载历史失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function handleDelete(taskId: string) {
    setRecords((prev) => prev.filter((r) => r.task_id !== taskId))
    message.success('已从列表移除')
    // TODO: 可选 - 调后端真正删除
  }

  const completed = records.filter((r) => r.video_url)
  const pending = records.filter((r) => !r.video_url)

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>视频历史</h2>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
            共 {completed.length} 个已完成
            {pending.length > 0 && `，${pending.length} 个生成中`}
          </div>
        </div>
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
          刷新
        </Button>
      </div>

      {loading && records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : records.length === 0 ? (
        <Empty description="暂无视频历史，去生成第一个视频吧" style={{ padding: 80 }} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {records.map((r) => (
            <VideoCard key={r.task_id} record={r} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
