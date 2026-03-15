import { useState, useMemo } from 'react'
import { Divider } from 'antd'
import FilterBar from './FilterBar'
import CopywritingCard from './CopywritingCard'
import CopywritingDetail from './CopywritingDetail'
import { INDUSTRIES, COPYWRITING_TYPES } from '../../constants/filters'
import { MOCK_COPYWRITING } from './mockData'
import type { CopywritingItem } from '../../types/copywriting'

type SortKey = 'createdAt' | 'usageCount'

export default function CopywritingPage() {
  const [industry, setIndustry] = useState('')
  const [type, setType] = useState('')
  const [sort, setSort] = useState<SortKey>('createdAt')
  const [selected, setSelected] = useState<CopywritingItem | null>(null)

  const filtered = useMemo(() => {
    let list = MOCK_COPYWRITING
    if (industry) list = list.filter(i => i.industry === industry)
    if (type) list = list.filter(i => i.type === type)
    return [...list].sort((a, b) =>
      sort === 'usageCount'
        ? b.usageCount - a.usageCount
        : b.createdAt.localeCompare(a.createdAt)
    )
  }, [industry, type, sort])

  return (
    <div style={{ padding: '20px 24px', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Page header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>爆款文案</h2>
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
        <FilterBar label="类型" options={COPYWRITING_TYPES} value={type} onChange={setType} />
        <Divider style={{ margin: '4px 0' }} />

        {/* Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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

          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#bfbfbf' }}>
            共 {filtered.length} 个文案
          </span>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#bfbfbf' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div>暂无符合条件的文案</div>
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
            <CopywritingCard
              key={item.id}
              item={item}
              onClick={() => setSelected(item)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      <CopywritingDetail item={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
