import type { PlatformAccount, PublishTask } from './types'

export const mockAccounts: PlatformAccount[] = [
  {
    id: 'a1',
    platform: 'douyin',
    nickname: '好物推荐官',
    avatar: '',
    followers: 128500,
    status: 'connected',
    connectedAt: '2025-01-10',
  },
  {
    id: 'a2',
    platform: 'douyin',
    nickname: '生活美学家',
    avatar: '',
    followers: 56200,
    status: 'connected',
    connectedAt: '2025-02-05',
  },
  {
    id: 'a3',
    platform: 'xiaohongshu',
    nickname: '小红薯日记',
    avatar: '',
    followers: 34800,
    status: 'connected',
    connectedAt: '2025-01-22',
  },
  {
    id: 'a4',
    platform: 'xiaohongshu',
    nickname: '美妆穿搭分享',
    avatar: '',
    followers: 89100,
    status: 'expired',
    connectedAt: '2024-11-30',
  },
]

export const mockTasks: PublishTask[] = [
  {
    id: 't1',
    title: '春季新品上市宣传',
    videoName: '混剪视频_01.mp4',
    caption: '春天来了，新品限时特惠！✨ #春季新品 #限时优惠',
    tags: ['春季新品', '限时优惠', '好物推荐'],
    accounts: [
      { accountId: 'a1', platform: 'douyin', nickname: '好物推荐官', status: 'success' },
      { accountId: 'a3', platform: 'xiaohongshu', nickname: '小红薯日记', status: 'success' },
    ],
    scheduledAt: null,
    createdAt: '2025-03-14 10:30',
    overallStatus: 'success',
  },
  {
    id: 't2',
    title: '周末活动预热',
    videoName: '视频生成_02.mp4',
    caption: '周末大促来袭，全场8折！快来抢购吧 🛒',
    tags: ['周末活动', '大促', '8折'],
    accounts: [
      { accountId: 'a1', platform: 'douyin', nickname: '好物推荐官', status: 'scheduled' },
      { accountId: 'a2', platform: 'douyin', nickname: '生活美学家', status: 'scheduled' },
      { accountId: 'a3', platform: 'xiaohongshu', nickname: '小红薯日记', status: 'scheduled' },
    ],
    scheduledAt: '2025-03-15 18:00',
    createdAt: '2025-03-14 14:20',
    overallStatus: 'scheduled',
  },
  {
    id: 't3',
    title: '品牌故事短片',
    videoName: '混剪视频_03.mp4',
    caption: '我们的品牌故事，每一帧都是用心打造…',
    tags: ['品牌故事', '用心'],
    accounts: [
      { accountId: 'a1', platform: 'douyin', nickname: '好物推荐官', status: 'failed', failReason: '视频格式不支持' },
      { accountId: 'a3', platform: 'xiaohongshu', nickname: '小红薯日记', status: 'success' },
    ],
    scheduledAt: null,
    createdAt: '2025-03-13 09:15',
    overallStatus: 'failed',
  },
]
