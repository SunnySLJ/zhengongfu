import { useState } from 'react'
import type { CopywritingItem } from '../../types/copywriting'
import { INDUSTRY_LABEL, COPYWRITING_TYPE_LABEL } from '../../constants/filters'

interface Props {
  item: CopywritingItem
  onClick: () => void
}

export default function CopywritingCard({ item, onClick }: Props) {
  const [imgError, setImgError] = useState(false)
  const [hovered, setHovered] = useState(false)

  const typeLabel = COPYWRITING_TYPE_LABEL[item.type] || item.type
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
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#f0f0f0', flexShrink: 0 }}>
        {!imgError ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            loading="lazy"
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bfbfbf', fontSize: 12 }}>
            暂无封面
          </div>
        )}
        {/* Duration badge */}
        <span
          style={{
            position: 'absolute',
            bottom: 6,
            right: 6,
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            fontSize: 11,
            padding: '1px 6px',
            borderRadius: 3,
          }}
        >
          {item.duration}
        </span>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4 }}>
          {item.title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#8c8c8c',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.description}
        </div>
        <div style={{ fontSize: 12, color: '#bfbfbf', marginTop: 2 }}>
          {typeLabel} | {industryLabel}
        </div>
        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
          使用次数
          <span style={{ fontWeight: 600, color: '#595959', marginLeft: 4 }}>
            {item.usageCount >= 10000
              ? `${(item.usageCount / 10000).toFixed(0)}w+`
              : item.usageCount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
