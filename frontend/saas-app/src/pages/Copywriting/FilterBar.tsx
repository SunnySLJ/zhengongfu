import { Space } from 'antd'

interface FilterBarProps {
  label: string
  options: { label: string; value: string }[]
  value: string
  onChange: (v: string) => void
}

export default function FilterBar({ label, options, value, onChange }: FilterBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', rowGap: 4 }}>
      <span style={{ fontSize: 13, color: '#8c8c8c', marginRight: 12, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <Space size={0} wrap>
        {options.map(opt => {
          const active = opt.value === value
          return (
            <span
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                display: 'inline-block',
                padding: '3px 12px',
                fontSize: 13,
                cursor: 'pointer',
                borderRadius: 4,
                color: active ? '#ff4d4f' : '#595959',
                fontWeight: active ? 600 : 400,
                background: active ? '#fff1f0' : 'transparent',
                transition: 'all 0.15s',
                userSelect: 'none',
              }}
            >
              {opt.label}
            </span>
          )
        })}
      </Space>
    </div>
  )
}
