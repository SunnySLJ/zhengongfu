export type Platform = 'douyin' | 'xiaohongshu'

export interface PlatformAccount {
  id: string
  platform: Platform
  nickname: string
  avatar: string
  followers: number
  status: 'connected' | 'expired' | 'disconnected'
  connectedAt: string
}

export type TaskStatus = 'pending' | 'scheduled' | 'publishing' | 'success' | 'failed'

export interface PublishTask {
  id: string
  title: string
  videoName: string
  caption: string
  tags: string[]
  accounts: { accountId: string; platform: Platform; nickname: string; status: TaskStatus; failReason?: string }[]
  scheduledAt: string | null   // null = 立即发布
  createdAt: string
  overallStatus: TaskStatus
}
