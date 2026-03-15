import { Modal, Button, Tag } from 'antd'
import { PlayCircleOutlined, DownloadOutlined } from '@ant-design/icons'
import type { TemplateItem } from '../../types/template'

interface Props {
  item: TemplateItem | null
  onClose: () => void
}

export default function TemplateDetail({ item, onClose }: Props) {
  if (!item) return null

  return (
    <Modal
      open={!!item}
      onCancel={onClose}
      footer={null}
      width={640}
      title={null}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Thumbnail / preview area */}
        <div
          style={{
            width: '100%',
            aspectRatio: '16/9',
            background: '#1a1a1a',
            position: 'relative',
            borderRadius: '8px 8px 0 0',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={item.thumbnail}
            alt={item.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
          />
          {/* Play button overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <PlayCircleOutlined style={{ fontSize: 52, color: 'rgba(255,255,255,0.9)' }} />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>点击使用后可在创意项目中预览</span>
          </div>
          {item.isPinned && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: '#ff4d4f',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                padding: '2px 10px',
                borderRadius: 4,
              }}
            >
              置顶
            </div>
          )}
          <span
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              fontSize: 12,
              padding: '2px 8px',
              borderRadius: 4,
            }}
          >
            {item.duration}
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px 24px' }}>
          <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 12, lineHeight: 1.5 }}>
            {item.title}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            {item.tags.map(tag => (
              <Tag key={tag} style={{ margin: 0 }}>{tag}</Tag>
            ))}
            <span style={{ fontSize: 13, color: '#8c8c8c', marginLeft: 4 }}>
              已使用 {item.usageCount.toLocaleString()} 次
            </span>
          </div>

          <div
            style={{
              background: '#fafafa',
              border: '1px solid #f0f0f0',
              borderRadius: 6,
              padding: '12px 16px',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 0', fontSize: 13 }}>
              {[
                ['时长', item.duration],
                ['行业', item.industry],
                ['类型', item.type],
                ['更新时间', item.createdAt],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#8c8c8c', width: 60 }}>{k}</span>
                  <span style={{ color: '#2c2c2c' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button type="primary" icon={<PlayCircleOutlined />} style={{ flex: 1 }}>
              使用模板
            </Button>
            <Button icon={<DownloadOutlined />} style={{ flex: 1 }}>
              下载预览
            </Button>
            <Button onClick={onClose}>关闭</Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
