export interface TemplateItem {
  id: string
  title: string
  thumbnail: string
  duration: string        // e.g. "00:24"
  durationSeconds: number // for filtering
  industry: string
  type: string
  tags: string[]
  usageCount: number
  isPinned: boolean
  createdAt: string
}
