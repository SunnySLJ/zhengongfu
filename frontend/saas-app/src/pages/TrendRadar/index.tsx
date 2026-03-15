import { useState, useMemo } from 'react'
import {
  Tag, Button, Select, Tooltip, Drawer, Divider,
  Badge, message, Input, Tabs, Empty,
} from 'antd'
import {
  FireOutlined, RiseOutlined, FallOutlined, StarOutlined,
  StarFilled, RadarChartOutlined, CopyOutlined,
  VideoCameraAddOutlined, EditOutlined, ReloadOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { mockTrends } from './mockData'
import type { TrendItem, TrendPlatform, TrendCategory } from './mockData'

// ── Mini sparkline ──────────────────────────────────────────────
function Sparkline({ data, color = '#1677ff' }: { data: number[]; color?: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80, h = 32, pad = 2
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <circle
        cx={+points.split(' ').at(-1)!.split(',')[0]}
        cy={+points.split(' ').at(-1)!.split(',')[1]}
        r={2.5} fill={color}
      />
    </svg>
  )
}

// ── Platform config ──────────────────────────────────────────────
const PLATFORM_CFG: Record<TrendPlatform, { label: string; color: string; bg: string }> = {
  douyin:       { label: '抖音',  color: '#fff',    bg: '#010101' },
  xiaohongshu:  { label: '小红书', color: '#fff',    bg: '#fe2c55' },
  weibo:        { label: '微博',  color: '#fff',    bg: '#e6162d' },
  bilibili:     { label: 'B站',  color: '#fff',    bg: '#00a1d6' },
}

const CATEGORIES: TrendCategory[] = ['美妆', '美食', '数码', '服装', '旅行', '健康', '宠物', '教育']

function HeatBar({ score }: { score: number }) {
  const color = score >= 90 ? '#ff4d4f' : score >= 70 ? '#fa8c16' : '#1677ff'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 64, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 600, minWidth: 24 }}>{score}</span>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────
export default function TrendRadarPage() {
  const [trends, setTrends] = useState<TrendItem[]>(mockTrends)
  const [platform, setPlatform] = useState<TrendPlatform | 'all'>('all')
  const [category, setCategory] = useState<TrendCategory | 'all'>('all')
  const [tabKey, setTabKey] = useState<'all' | 'favorites'>('all')
  const [keyword, setKeyword] = useState('')
  const [detail, setDetail] = useState<TrendItem | null>(null)
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    return trends.filter((t) => {
      if (tabKey === 'favorites' && !t.isFavorited) return false
      if (platform !== 'all' && t.platform !== platform) return false
      if (category !== 'all' && t.category !== category) return false
      if (keyword && !t.title.includes(keyword) && !t.tags.some((g) => g.includes(keyword))) return false
      return true
    })
  }, [trends, platform, category, tabKey, keyword])

  function toggleFav(id: string) {
    setTrends((prev) =>
      prev.map((t) => t.id === id ? { ...t, isFavorited: !t.isFavorited } : t)
    )
  }

  function handleUseInVideoGen(item: TrendItem) {
    message.success(`已跳转到视频生成，预填热点：「${item.title}」`)
    navigate('/video-gen')
  }

  function handleCopyTags(item: TrendItem) {
    const text = item.tags.map((t) => '#' + t).join(' ')
    navigator.clipboard.writeText(text).then(() => message.success('话题标签已复制'))
  }

  const favCount = trends.filter((t) => t.isFavorited).length

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RadarChartOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>热点雷达</h2>
            <Badge color="red" text={<span style={{ fontSize: 12, color: '#ff4d4f' }}>实时更新</span>} />
          </div>
          <p style={{ margin: '4px 0 0', color: '#999', fontSize: 13 }}>
            聚合抖音、小红书、B站多平台热点，第一时间发现内容机会
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => message.success('热点已刷新')}>
          刷新热点
        </Button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input.Search
          placeholder="搜索热点关键词"
          style={{ width: 200 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
        />
        <Select
          value={platform}
          onChange={setPlatform}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '全部平台' },
            { value: 'douyin', label: '抖音' },
            { value: 'xiaohongshu', label: '小红书' },
            { value: 'bilibili', label: 'B站' },
            { value: 'weibo', label: '微博' },
          ]}
        />
        <Select
          value={category}
          onChange={setCategory}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '全部行业' },
            ...CATEGORIES.map((c) => ({ value: c, label: c })),
          ]}
        />
      </div>

      <Tabs
        activeKey={tabKey}
        onChange={(k) => setTabKey(k as typeof tabKey)}
        items={[
          { key: 'all', label: '全部热点' },
          { key: 'favorites', label: `我的收藏 ${favCount > 0 ? `(${favCount})` : ''}` },
        ]}
        style={{ marginBottom: 4 }}
      />

      {/* Trend list */}
      {filtered.length === 0 ? (
        <Empty description="暂无热点" style={{ marginTop: 60 }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((item) => {
            const pc = PLATFORM_CFG[item.platform]
            const rising = item.heatDelta > 0
            return (
              <div
                key={item.id}
                onClick={() => setDetail(item)}
                style={{
                  background: '#fff',
                  borderRadius: 10,
                  padding: '14px 18px',
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr auto auto auto',
                  alignItems: 'center',
                  gap: 16,
                  cursor: 'pointer',
                  border: '1px solid #f0f0f0',
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
              >
                {/* Rank */}
                <div style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: item.rank <= 3 ? 'linear-gradient(135deg,#ff4d4f,#ff7a45)' : '#f5f5f5',
                  color: item.rank <= 3 ? '#fff' : '#999',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13,
                }}>
                  {item.rank}
                </div>

                {/* Title + meta */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        display: 'inline-block', padding: '1px 7px', borderRadius: 4,
                        background: pc.bg, color: pc.color, fontSize: 11, fontWeight: 600, flexShrink: 0,
                      }}
                    >
                      {pc.label}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </span>
                    <Tag color="blue" style={{ fontSize: 11 }}>{item.category}</Tag>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {item.tags.slice(0, 4).map((t) => (
                      <span key={t} style={{ color: '#999', fontSize: 12 }}>#{t}</span>
                    ))}
                    <span style={{ color: '#bbb', fontSize: 12 }}>· {item.videoCount.toLocaleString()} 个视频</span>
                    <span style={{ color: '#bbb', fontSize: 12 }}>· {item.updatedAt}</span>
                  </div>
                </div>

                {/* Sparkline */}
                <Sparkline data={item.trendData} color={item.rank <= 3 ? '#ff4d4f' : '#1677ff'} />

                {/* Heat + delta */}
                <div style={{ textAlign: 'right', minWidth: 80 }}>
                  <HeatBar score={item.heatScore} />
                  <div style={{ fontSize: 12, marginTop: 3, color: rising ? '#52c41a' : '#ff4d4f' }}>
                    {rising ? <RiseOutlined /> : <FallOutlined />}
                    {' '}{Math.abs(item.heatDelta)}%
                  </div>
                </div>

                {/* Actions */}
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tooltip title={item.isFavorited ? '取消收藏' : '收藏'}>
                    <Button
                      type="text"
                      size="small"
                      icon={item.isFavorited ? <StarFilled style={{ color: '#fa8c16' }} /> : <StarOutlined />}
                      onClick={() => toggleFav(item.id)}
                    />
                  </Tooltip>
                  <Tooltip title="用于视频生成">
                    <Button
                      type="text"
                      size="small"
                      icon={<VideoCameraAddOutlined />}
                      onClick={() => handleUseInVideoGen(item)}
                    />
                  </Tooltip>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Drawer */}
      <Drawer
        title={detail?.title}
        open={!!detail}
        onClose={() => setDetail(null)}
        width={420}
        extra={
          detail && (
            <Button
              type="primary"
              icon={<VideoCameraAddOutlined />}
              size="small"
              onClick={() => handleUseInVideoGen(detail)}
            >
              用于创作
            </Button>
          )
        }
      >
        {detail && (
          <div>
            {/* Platform + category */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span style={{
                padding: '2px 10px', borderRadius: 4, fontSize: 13, fontWeight: 600,
                background: PLATFORM_CFG[detail.platform].bg,
                color: PLATFORM_CFG[detail.platform].color,
              }}>
                {PLATFORM_CFG[detail.platform].label}
              </span>
              <Tag color="blue">{detail.category}</Tag>
              <Tag icon={<FireOutlined />} color={detail.heatScore >= 90 ? 'red' : 'orange'}>
                热度 {detail.heatScore}
              </Tag>
            </div>

            {/* Description */}
            <div style={{ background: '#f9f9f9', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 14, color: '#444', lineHeight: 1.8 }}>
              {detail.description}
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[
                { label: '相关视频', value: detail.videoCount.toLocaleString() },
                { label: '热度趋势', value: (detail.heatDelta > 0 ? '+' : '') + detail.heatDelta + '%' },
                { label: '峰值时段', value: detail.peakHour },
              ].map((s) => (
                <div key={s.label} style={{ background: '#f5f5f5', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{s.value}</div>
                  <div style={{ color: '#999', fontSize: 12 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* 7-day trend */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>近7日热度趋势</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
                {detail.trendData.map((v, i) => {
                  const max = Math.max(...detail.trendData)
                  return (
                    <Tooltip key={i} title={`第${i + 1}天：${v}`}>
                      <div style={{
                        flex: 1,
                        height: `${(v / max) * 52}px`,
                        background: i === detail.trendData.length - 1
                          ? 'linear-gradient(180deg,#ff4d4f,#ff7a45)'
                          : '#e8e8e8',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.3s',
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

            {/* Tags */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 500 }}>相关话题标签</span>
                <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopyTags(detail)}>
                  一键复制
                </Button>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {detail.tags.map((t) => (
                  <Tag key={t} color="blue" style={{ cursor: 'pointer' }}>#{t}</Tag>
                ))}
              </div>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* Quick actions */}
            <div style={{ fontWeight: 500, marginBottom: 12 }}>快捷创作</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                block
                icon={<EditOutlined />}
                onClick={() => { navigate('/copywriting'); setDetail(null) }}
              >
                参考爆款文案
              </Button>
              <Button
                block
                type="primary"
                icon={<VideoCameraAddOutlined />}
                onClick={() => handleUseInVideoGen(detail)}
              >
                生成视频
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
