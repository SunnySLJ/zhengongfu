import { Modal, Button, Tag, message } from 'antd'
import { CopyOutlined, FireOutlined } from '@ant-design/icons'
import type { CopywritingItem } from '../../types/copywriting'
import { INDUSTRY_LABEL, COPYWRITING_TYPE_LABEL } from '../../constants/filters'

interface Props {
  item: CopywritingItem | null
  onClose: () => void
}

export default function CopywritingDetail({ item, onClose }: Props) {
  if (!item) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(item.content).then(() => {
      message.success('文案已复制')
    })
  }

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
        {/* Thumbnail */}
        <div style={{ width: '100%', aspectRatio: '16/9', background: '#f0f0f0', position: 'relative', borderRadius: '8px 8px 0 0', overflow: 'hidden' }}>
          <img
            src={item.thumbnail}
            alt={item.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <span
            style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              background: 'rgba(0,0,0,0.55)',
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
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>{item.title}</div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <Tag color="volcano">{COPYWRITING_TYPE_LABEL[item.type] || item.type}</Tag>
            <Tag>{INDUSTRY_LABEL[item.industry] || item.industry}</Tag>
            <span style={{ fontSize: 13, color: '#8c8c8c', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FireOutlined style={{ color: '#ff4d4f' }} />
              使用 {item.usageCount >= 10000 ? `${(item.usageCount / 10000).toFixed(0)}w+` : item.usageCount.toLocaleString()} 次
            </span>
          </div>

          <div
            style={{
              background: '#fafafa',
              border: '1px solid #f0f0f0',
              borderRadius: 6,
              padding: '14px 16px',
              fontSize: 14,
              lineHeight: 1.8,
              color: '#2c2c2c',
              whiteSpace: 'pre-line',
              maxHeight: 300,
              overflowY: 'auto',
            }}
          >
            {item.content}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Button
              type="primary"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              style={{ flex: 1 }}
            >
              复制文案
            </Button>
            <Button onClick={onClose} style={{ flex: 1 }}>
              关闭
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
