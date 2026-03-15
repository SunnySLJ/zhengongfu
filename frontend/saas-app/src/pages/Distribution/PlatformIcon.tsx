import type { Platform } from './types'

const CONFIGS = {
  douyin: { label: '抖音', bg: '#010101', color: '#fff', char: '抖' },
  xiaohongshu: { label: '小红书', bg: '#fe2c55', color: '#fff', char: '红' },
}

export function PlatformBadge({ platform, size = 28 }: { platform: Platform; size?: number }) {
  const cfg = CONFIGS[platform]
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: cfg.bg,
        color: cfg.color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {cfg.char}
    </div>
  )
}

export function PlatformLabel({ platform }: { platform: Platform }) {
  return <span>{CONFIGS[platform].label}</span>
}
