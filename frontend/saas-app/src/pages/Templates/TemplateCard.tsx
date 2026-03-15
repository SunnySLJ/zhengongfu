import { useState } from 'react'
import { PlayCircleFilled } from '@ant-design/icons'
import type { TemplateItem } from '../../types/template'

interface Props {
  item: TemplateItem
  onClick: () => void
}

export default function TemplateCard({ item, onClick }: Props) {
  const [hovered, setHovered] = useState(false)
  const [imgError, setImgError] = useState(false)

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
        transition: 'box-shadow 0.2s, transform 0.15s',
        boxShadow: hovered ? '0 6px 20px rgba(0,0,0,0.14)' : '0 1px 4px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#f0f0f0', overflow: 'hidden' }}>
        {/* Pinned badge */}
        {item.isPinned && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              background: '#ff4d4f',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '0 0 6px 0',
              zIndex: 2,
            }}
          >
            置顶
          </div>
        )}

        {!imgError ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            loading="lazy"
            onError={() => setImgError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.3s',
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
            }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bfbfbf', fontSize: 12 }}>
            暂无封面
          </div>
        )}

        {/* Hover play overlay */}
        {hovered && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 0.2s',
            }}
          >
            <PlayCircleFilled style={{ fontSize: 40, color: 'rgba(255,255,255,0.9)' }} />
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
            zIndex: 2,
          }}
        >
          {item.duration}
        </span>

        {/* Usage count badge */}
        <span
          style={{
            position: 'absolute',
            bottom: 6,
            left: 6,
            background: 'rgba(0,0,0,0.45)',
            color: '#fff',
            fontSize: 11,
            padding: '1px 6px',
            borderRadius: 3,
            zIndex: 2,
          }}
        >
          使用次数{item.usageCount >= 1000 ? `${(item.usageCount / 1000).toFixed(1)}k` : item.usageCount}
        </span>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#1a1a1a',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            marginBottom: 6,
          }}
        >
          {item.title}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {item.tags.map(tag => (
            <span
              key={tag}
              style={{
                fontSize: 11,
                color: '#8c8c8c',
                background: '#f5f5f5',
                borderRadius: 3,
                padding: '1px 6px',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
