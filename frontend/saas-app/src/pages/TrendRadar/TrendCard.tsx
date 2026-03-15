import { useState } from 'react'
import { StarOutlined, StarFilled, RiseOutlined, FallOutlined, LinkOutlined } from '@ant-design/icons'
import { PLATFORM_CFG } from './mockData'
import type { TrendItem } from './mockData'
import { INDUSTRY_LABEL } from '../../constants/filters'

interface Props {
  item: TrendItem
  onClick: () => void
  onFav: (id: string) => void
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 56, h = 20, pad = 1
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  )
}

export default function TrendCard({ item, onClick, onFav }: Props) {
  const [hovered, setHovered] = useState(false)
  const [imgError, setImgError] = useState(false)
  const pc = PLATFORM_CFG[item.platform]
  const rising = item.heatDelta >= 0
  const industryLabel = INDUSTRY_LABEL[item.industry] || item.industry

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#1a1a2e', flexShrink: 0, overflow: 'hidden' }}>
        {!imgError ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            loading="lazy"
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.7 }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#1a1a2e,#0f3460)' }} />
        )}

        {/* Overlay: rank + platform */}
        <div style={{ position: 'absolute', top: 7, left: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 5,
            background: item.rank <= 3 ? 'linear-gradient(135deg,#ff4d4f,#ff7a45)' : 'rgba(0,0,0,0.5)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 12,
          }}>
            {item.rank}
          </div>
          <span style={{
            padding: '2px 6px', borderRadius: 4,
            background: pc.bg, color: pc.color,
            fontSize: 11, fontWeight: 600,
          }}>
            {pc.label}
          </span>
        </div>

        {/* Heat score + sparkline bottom right */}
        <div style={{
          position: 'absolute', bottom: 7, right: 8,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Sparkline data={item.trendData} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{item.heatScore}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', lineHeight: 1 }}>热度</div>
          </div>
        </div>

        {/* Delta bottom left */}
        <div style={{
          position: 'absolute', bottom: 8, left: 8,
          fontSize: 12, color: rising ? '#73d13d' : '#ff7875',
          display: 'flex', alignItems: 'center', gap: 2, fontWeight: 600,
        }}>
          {rising ? <RiseOutlined /> : <FallOutlined />}{Math.abs(item.heatDelta)}%
        </div>

        {/* Fav */}
        <div
          style={{ position: 'absolute', top: 7, right: 8 }}
          onClick={(e) => { e.stopPropagation(); onFav(item.id) }}
        >
          {item.isFavorited
            ? <StarFilled style={{ color: '#fa8c16', fontSize: 15 }} />
            : <StarOutlined style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15 }} />}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4 }}>
          {item.title}
        </div>
        <div style={{
          fontSize: 12, color: '#8c8c8c', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.description}
        </div>
        <div style={{ fontSize: 12, color: '#bfbfbf' }}>
          {pc.label} | {industryLabel}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            相关视频
            <span style={{ fontWeight: 600, color: '#595959', marginLeft: 4 }}>
              {item.videoCount >= 10000
                ? `${(item.videoCount / 10000).toFixed(1)}w+`
                : item.videoCount.toLocaleString()}
            </span>
          </div>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 12, color: '#1677ff', display: 'flex', alignItems: 'center', gap: 3 }}
          >
            <LinkOutlined />查看
          </a>
        </div>
      </div>
    </div>
  )
}
