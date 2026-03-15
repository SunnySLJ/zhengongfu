import { useState, useMemo } from 'react'
import { Input, Divider } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import FilterBar from '../Copywriting/FilterBar'
import TemplateCard from './TemplateCard'
import TemplateDetail from './TemplateDetail'
import { INDUSTRIES, TEMPLATE_TYPES, TEMPLATE_DURATIONS } from '../../constants/filters'
import { MOCK_TEMPLATES } from './mockData'
import type { TemplateItem } from '../../types/template'

type SortKey = 'createdAt' | 'usageCount'

function matchDuration(durationSeconds: number, filterValue: string): boolean {
  switch (filterValue) {
    case '0-15':   return durationSeconds <= 15
    case '15-30':  return durationSeconds > 15 && durationSeconds <= 30
    case '30-60':  return durationSeconds > 30 && durationSeconds <= 60
    case '60+':    return durationSeconds > 60
    default:       return true
  }
}

export default function TemplatePage() {
  const [industry, setIndustry]   = useState('')
  const [type, setType]           = useState('')
  const [duration, setDuration]   = useState('')
  const [keyword, setKeyword]     = useState('')
  const [sort, setSort]           = useState<SortKey>('createdAt')
  const [selected, setSelected]   = useState<TemplateItem | null>(null)

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    let list = MOCK_TEMPLATES.filter(item => {
      if (industry && item.industry !== industry) return false
      if (type && item.type !== type) return false
      if (duration && !matchDuration(item.durationSeconds, duration)) return false
      if (kw && !item.title.toLowerCase().includes(kw) && !item.tags.some(t => t.toLowerCase().includes(kw))) return false
      return true
    })

    return list.sort((a, b) => {
      // Pinned always first
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      return sort === 'usageCount'
        ? b.usageCount - a.usageCount
        : b.createdAt.localeCompare(a.createdAt)
    })
  }, [industry, type, duration, keyword, sort])

  return (
    <div style={{ padding: '20px 24px', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>剪辑模板</h2>
      </div>

      {/* Filters */}
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <FilterBar label="行业" options={INDUSTRIES} value={industry} onChange={setIndustry} />
        <Divider style={{ margin: '4px 0' }} />
        <FilterBar label="类型" options={TEMPLATE_TYPES} value={type} onChange={setType} />
        <Divider style={{ margin: '4px 0' }} />
        <FilterBar label="时长" options={TEMPLATE_DURATIONS} value={duration} onChange={setDuration} />
        <Divider style={{ margin: '4px 0' }} />

        {/* Sort + Search row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#8c8c8c' }}>排序</span>
          {([
            { key: 'createdAt', label: '按最新时间' },
            { key: 'usageCount', label: '按使用次数' },
          ] as { key: SortKey; label: string }[]).map(s => (
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

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#bfbfbf' }}>共 {filtered.length} 个模板</span>
            <Input
              placeholder="请输入关键词搜索"
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              allowClear
              style={{ width: 200 }}
              size="small"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#bfbfbf' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div>未找到符合条件的模板</div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 14,
          }}
        >
          {filtered.map(item => (
            <TemplateCard
              key={item.id}
              item={item}
              onClick={() => setSelected(item)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      <TemplateDetail item={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
