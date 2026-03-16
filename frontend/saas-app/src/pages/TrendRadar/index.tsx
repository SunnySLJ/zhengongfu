import { useState, useMemo, useEffect, useCallback } from 'react'
import { Divider, Button, Spin, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import FilterBar from '../Copywriting/FilterBar'
import TrendCard from './TrendCard'
import TrendDetail from './TrendDetail'
import VideoCopyModal from './VideoCopyModal'
import { TREND_PLATFORMS } from './mockData'
import { INDUSTRIES } from '../../constants/filters'
import type { TrendItem } from './mockData'
import { fetchDouyinTrends } from '../../services/trendApi'

type SortKey = 'heat' | 'rising' | 'videoCount'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'heat',       label: '按热度排序' },
  { key: 'rising',     label: '按涨幅排序' },
  { key: 'videoCount', label: '按视频数排序' },
]

export default function TrendRadarPage() {
  const [platform, setPlatform]   = useState('douyin')
  const [industry, setIndustry]   = useState('')
  const [sort, setSort]           = useState<SortKey>('heat')
  const [selected, setSelected]   = useState<TrendItem | null>(null)
  const [trends, setTrends]       = useState<TrendItem[]>([])
  const [loading, setLoading]     = useState(false)
  const [fetchTime, setFetchTime] = useState('')
  const [copyTarget, setCopyTarget] = useState<TrendItem | null>(null)

  const loadTrends = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchDouyinTrends()
      setTrends(data.trends)
      setFetchTime(data.fetchTime)
      message.success(`已获取 ${data.trends.length} 条抖音热点`)
    } catch (err) {
      message.error(`获取热点失败: ${err instanceof Error ? err.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTrends()
  }, [loadTrends])

  const filtered = useMemo(() => {
    let list = trends
    if (platform && platform !== 'douyin') list = list.filter((t) => t.platform === platform)
    if (industry) list = list.filter((t) => t.industry === industry)
    return [...list].sort((a, b) => {
      if (sort === 'heat')       return b.heatScore - a.heatScore
      if (sort === 'rising')     return b.heatDelta - a.heatDelta
      if (sort === 'videoCount') return b.videoCount - a.videoCount
      return 0
    })
  }, [trends, platform, industry, sort])

  function handleFav(id: string) {
    setTrends((prev) =>
      prev.map((t) => t.id === id ? { ...t, isFavorited: !t.isFavorited } : t)
    )
    setSelected((prev) => prev?.id === id ? { ...prev, isFavorited: !prev.isFavorited } : prev)
  }

  return (
    <div style={{ padding: '20px 24px', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Page header */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>热点雷达</h2>
          {fetchTime && (
            <span style={{ fontSize: 12, color: '#bfbfbf' }}>
              更新于 {fetchTime}
            </span>
          )}
        </div>
        <Button
          icon={<ReloadOutlined spin={loading} />}
          onClick={loadTrends}
          loading={loading}
        >
          刷新热点
        </Button>
      </div>

      {/* Filters */}
      <div style={{
        background: '#fff', borderRadius: 8, padding: '16px 20px',
        marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <FilterBar label="平台" options={TREND_PLATFORMS} value={platform} onChange={setPlatform} />
        <Divider style={{ margin: '4px 0' }} />
        <FilterBar label="行业" options={INDUSTRIES} value={industry} onChange={setIndustry} />
        <Divider style={{ margin: '4px 0' }} />

        {/* Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#8c8c8c' }}>排序</span>
          {SORT_OPTIONS.map((s) => (
            <span
              key={s.key}
              onClick={() => setSort(s.key)}
              style={{
                fontSize: 13,
                cursor: 'pointer',
                color: sort === s.key ? '#ff4d4f' : '#595959',
                fontWeight: sort === s.key ? 600 : 400,
                borderBottom: sort === s.key ? '2px solid #ff4d4f' : '2px solid transparent',
                paddingBottom: 2,
                transition: 'all 0.15s',
                userSelect: 'none',
              }}
            >
              {s.label}
            </span>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#bfbfbf' }}>
            共 {filtered.length} 个热点
          </span>
        </div>
      </div>

      {/* Grid */}
      {loading && trends.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#8c8c8c' }}>正在获取抖音热点数据...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#bfbfbf' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
          <div>暂无符合条件的热点</div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 14,
        }}>
          {filtered.map((item) => (
            <TrendCard
              key={item.id}
              item={item}
              onClick={() => setSelected(item)}
              onFav={handleFav}
            />
          ))}
        </div>
      )}

      <TrendDetail
        item={selected}
        onClose={() => setSelected(null)}
        onGenCopy={(item) => setCopyTarget(item)}
      />

      <VideoCopyModal
        topic={copyTarget?.title || ''}
        description={copyTarget?.description || ''}
        open={!!copyTarget}
        onClose={() => setCopyTarget(null)}
      />
    </div>
  )
}
