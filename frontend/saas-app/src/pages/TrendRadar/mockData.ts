export type TrendPlatform = 'douyin' | 'xiaohongshu' | 'weibo' | 'bilibili'
export type TrendCategory = '美妆' | '美食' | '数码' | '服装' | '旅行' | '健康' | '宠物' | '教育'

export interface TrendItem {
  id: string
  rank: number
  title: string
  platform: TrendPlatform
  category: TrendCategory
  heatScore: number      // 0-100
  heatDelta: number      // change vs yesterday, e.g. +12 or -5
  videoCount: number
  tags: string[]
  description: string
  peakHour: string       // e.g. "20:00"
  trendData: number[]    // 7-day heat scores
  isFavorited: boolean
  updatedAt: string
}

export const mockTrends: TrendItem[] = [
  {
    id: 'tr1', rank: 1,
    title: '早C晚A护肤新趋势',
    platform: 'xiaohongshu', category: '美妆',
    heatScore: 98, heatDelta: 15, videoCount: 42300,
    tags: ['护肤', '早C晚A', '维C', '视黄醇'],
    description: '早上使用维C精华提亮防氧化，晚上A醇修护抗老，该组合近期在小红书掀起大讨论。',
    peakHour: '21:00', trendData: [40, 52, 61, 75, 82, 90, 98],
    isFavorited: true, updatedAt: '10分钟前',
  },
  {
    id: 'tr2', rank: 2,
    title: '多巴胺穿搭',
    platform: 'douyin', category: '服装',
    heatScore: 95, heatDelta: 8, videoCount: 89100,
    tags: ['多巴胺', '穿搭', '色彩搭配', 'OOTD'],
    description: '高饱和度色彩组合穿搭风格，带来愉悦感，持续引爆短视频穿搭赛道。',
    peakHour: '19:00', trendData: [70, 72, 78, 85, 88, 92, 95],
    isFavorited: false, updatedAt: '25分钟前',
  },
  {
    id: 'tr3', rank: 3,
    title: '露营+轻户外',
    platform: 'douyin', category: '旅行',
    heatScore: 91, heatDelta: 22, videoCount: 65400,
    tags: ['露营', '轻户外', '野餐', '城市露营'],
    description: '周末城市周边露营热度持续攀升，轻户外装备开箱和场地探店视频播放量激增。',
    peakHour: '08:00', trendData: [30, 45, 55, 68, 78, 85, 91],
    isFavorited: false, updatedAt: '1小时前',
  },
  {
    id: 'tr4', rank: 4,
    title: '猫咪日常vlog',
    platform: 'bilibili', category: '宠物',
    heatScore: 88, heatDelta: -3, videoCount: 31200,
    tags: ['猫咪', '宠物vlog', '橘猫', '布偶猫'],
    description: '猫咪日常生活记录类内容稳定高播放，折叠猫、平躺猫等萌宠切片走红。',
    peakHour: '22:00', trendData: [85, 90, 88, 91, 87, 89, 88],
    isFavorited: true, updatedAt: '1小时前',
  },
  {
    id: 'tr5', rank: 5,
    title: '空气炸锅食谱',
    platform: 'xiaohongshu', category: '美食',
    heatScore: 85, heatDelta: 5, videoCount: 28900,
    tags: ['空气炸锅', '食谱', '减脂餐', '懒人料理'],
    description: '空气炸锅懒人食谱持续火爆，低卡减脂版烹饪方式深受健康饮食人群追捧。',
    peakHour: '18:00', trendData: [60, 65, 70, 75, 78, 82, 85],
    isFavorited: false, updatedAt: '2小时前',
  },
  {
    id: 'tr6', rank: 6,
    title: '折叠屏手机体验',
    platform: 'bilibili', category: '数码',
    heatScore: 82, heatDelta: 31, videoCount: 19600,
    tags: ['折叠屏', '手机评测', '华为', '三星'],
    description: '新一代折叠屏手机集中发布，开箱评测和使用体验内容冲上热搜。',
    peakHour: '20:00', trendData: [20, 28, 42, 58, 68, 75, 82],
    isFavorited: false, updatedAt: '3小时前',
  },
  {
    id: 'tr7', rank: 7,
    title: '健身打卡挑战',
    platform: 'douyin', category: '健康',
    heatScore: 79, heatDelta: -8, videoCount: 54700,
    tags: ['健身', '打卡', '减脂', '居家健身'],
    description: '30天健身打卡挑战赛持续进行，居家健身操和减脂舞蹈持续吸引大量参与者。',
    peakHour: '07:00', trendData: [88, 84, 81, 80, 82, 80, 79],
    isFavorited: false, updatedAt: '4小时前',
  },
  {
    id: 'tr8', rank: 8,
    title: '国潮汉服出行',
    platform: 'xiaohongshu', category: '服装',
    heatScore: 76, heatDelta: 18, videoCount: 22100,
    tags: ['汉服', '国潮', '打卡', '传统文化'],
    description: '汉服日常出行搭配和景区打卡内容持续增长，传统节庆节点热度尤为突出。',
    peakHour: '14:00', trendData: [35, 42, 50, 58, 65, 70, 76],
    isFavorited: false, updatedAt: '5小时前',
  },
]
