import { Modal, Tag, Button, Tooltip, Divider } from 'antd'
import { CopyOutlined, VideoCameraAddOutlined, FireOutlined, RiseOutlined, FallOutlined, LinkOutlined, FileTextOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { PLATFORM_CFG } from './mockData'
import type { TrendItem } from './mockData'
import { INDUSTRY_LABEL } from '../../constants/filters'

interface Props {
  item: TrendItem | null
  onClose: () => void
  onGenCopy?: (item: TrendItem) => void
}

export default function TrendDetail({ item, onClose, onGenCopy }: Props) {
  const navigate = useNavigate()
  if (!item) return null
  const pc = PLATFORM_CFG[item.platform]
  const rising = item.heatDelta > 0
  const industryLabel = INDUSTRY_LABEL[item.industry] || item.industry

  function handleCopyTags() {
    navigator.clipboard.writeText(item!.tags.map((t) => '#' + t).join(' '))
      .then(() => message.success('话题标签已复制'))
  }

  return (
    <Modal
      open={!!item}
      onCancel={onClose}
      footer={null}
      width={480}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: 4,
              background: pc.bg, color: pc.color, fontSize: 12, fontWeight: 600,
            }}
          >
            {pc.label}
          </span>
          <span style={{ fontSize: 15 }}>{item.title}</span>
        </div>
      }
    >
      {/* Tags row */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        <Tag icon={<FireOutlined />} color={item.heatScore >= 90 ? 'red' : 'orange'}>
          热度 {item.heatScore}
        </Tag>
        <Tag color="blue">{industryLabel}</Tag>
        <Tag color={rising ? 'success' : 'error'}>
          {rising ? <RiseOutlined /> : <FallOutlined />} {Math.abs(item.heatDelta)}%
        </Tag>
      </div>

      {/* Description */}
      <div style={{ background: '#f9f9f9', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 14, color: '#444', lineHeight: 1.8 }}>
        {item.description}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { label: '相关视频', value: item.videoCount >= 10000 ? (item.videoCount / 10000).toFixed(1) + 'w+' : String(item.videoCount) },
          { label: '近7日趋势', value: (rising ? '+' : '') + item.heatDelta + '%' },
          { label: '峰值时段', value: item.peakHour },
        ].map((s) => (
          <div key={s.label} style={{ background: '#f5f5f5', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{s.value}</div>
            <div style={{ color: '#999', fontSize: 12 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>近7日热度趋势</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
          {item.trendData.map((v, i) => {
            const max = Math.max(...item.trendData)
            return (
              <Tooltip key={i} title={`第${i + 1}天：${v}`}>
                <div style={{
                  flex: 1,
                  height: `${(v / max) * 52}px`,
                  background: i === item.trendData.length - 1
                    ? 'linear-gradient(180deg,#ff4d4f,#ff7a45)'
                    : '#e8e8e8',
                  borderRadius: '3px 3px 0 0',
                }} />
              </Tooltip>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#bbb', fontSize: 11, marginTop: 4 }}>
          <span>7天前</span><span>今天</span>
        </div>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* Topics */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontWeight: 500 }}>相关话题标签</span>
          <Button size="small" icon={<CopyOutlined />} onClick={handleCopyTags}>一键复制</Button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {item.tags.map((t) => (
            <Tag key={t} color="blue" style={{ cursor: 'pointer' }}>#{t}</Tag>
          ))}
        </div>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <div style={{ fontWeight: 500, marginBottom: 12 }}>快捷创作</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <Button block icon={<FileTextOutlined />} style={{ borderColor: '#7B61FF', color: '#7B61FF' }}
          onClick={() => { onGenCopy?.(item); onClose() }}>
          📝 生成文案
        </Button>
        <Button block type="primary" icon={<VideoCameraAddOutlined />}
          onClick={() => { message.success(`已跳转视频生成：${item.title}`); navigate('/video-gen'); onClose() }}>
          生成视频
        </Button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {item.videoUrl && (
          <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
            <Button block icon={<PlayCircleOutlined />} style={{ borderColor: '#FE2C55', color: '#FE2C55' }}>
              ▶ 观看视频
            </Button>
          </a>
        )}
        <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
          <Button block icon={<LinkOutlined />}>
            前往 {PLATFORM_CFG[item.platform].label} 搜索
          </Button>
        </a>
      </div>
    </Modal>
  )
}
