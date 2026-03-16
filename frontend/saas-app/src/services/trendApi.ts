import type { TrendItem, VideoCopyResult } from '../pages/TrendRadar/mockData'

interface ApiTrend {
  rank: number
  title: string
  heat: string
  category: string
  description: string
  link?: string
  video_url?: string
  cover?: string
  search_url?: string
}

interface ApiResponse {
  trends: ApiTrend[]
  fetch_time?: string
  error?: string
}

const CATEGORY_TO_INDUSTRY: Record<string, string> = {
  '科技': 'education',
  '娱乐': 'lifestyle',
  '社会': 'lifestyle',
  '财经': 'business',
  '体育': 'health',
  '政策': 'business',
  '生活': 'lifestyle',
  '教育': 'education',
  '国际': 'lifestyle',
  '美食': 'food',
  '时尚': 'fashion',
  '其他': 'lifestyle',
}

function parseHeatScore(heat: string): number {
  const num = heat.match(/([\d.]+)/)?.[1]
  if (!num) return 50
  const val = parseFloat(num)
  if (heat.includes('亿')) return Math.min(100, Math.round(80 + val * 2))
  if (val > 3000) return Math.min(100, Math.round(90 + (val / 5000) * 10))
  if (val > 1000) return Math.round(70 + ((val - 1000) / 2000) * 20)
  if (val > 100) return Math.round(50 + ((val - 100) / 900) * 20)
  return Math.round(30 + (val / 100) * 20)
}

export async function fetchDouyinTrends(): Promise<{ trends: TrendItem[]; fetchTime: string }> {
  const resp = await fetch('/api/douyin-trends')
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data: ApiResponse = await resp.json()

  if (data.error || !data.trends?.length) {
    throw new Error(data.error || '暂无热搜数据')
  }

  const fetchTime = data.fetch_time || new Date().toLocaleTimeString()
  const trends: TrendItem[] = data.trends.map((t, i) => {
    const score = parseHeatScore(t.heat)
    const seed = `dy${t.rank || i + 1}${Date.now() % 10000}`
    return {
      id: `douyin_live_${t.rank || i + 1}`,
      rank: t.rank || i + 1,
      title: t.title,
      platform: 'douyin' as const,
      industry: CATEGORY_TO_INDUSTRY[t.category] || 'lifestyle',
      heatScore: score,
      heatDelta: Math.round(Math.random() * 25 + 3),
      videoCount: 0,
      tags: [t.category],
      description: t.description || '',
      peakHour: '',
      trendData: Array.from({ length: 7 }, (_, j) =>
        Math.max(10, Math.round(score - (6 - j) * 3 + (Math.random() - 0.3) * 8)),
      ),
      isFavorited: false,
      updatedAt: fetchTime,
      thumbnail: t.cover || `https://picsum.photos/seed/${seed}/400/225`,
      link: t.search_url || t.link || '',
      heatText: t.heat,
      videoUrl: t.video_url || '',
      cover: t.cover || `https://picsum.photos/seed/${seed}/400/225`,
    }
  })

  return { trends, fetchTime }
}

export async function fetchVideoCopy(topic: string, desc: string = ''): Promise<VideoCopyResult> {
  const params = new URLSearchParams({ topic, desc })
  const resp = await fetch(`/api/douyin-video-copy?${params}`)
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data: VideoCopyResult = await resp.json()
  if (data.error) throw new Error(data.error)
  return data
}
