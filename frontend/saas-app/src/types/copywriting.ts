export interface CopywritingItem {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: string        // e.g. "00:21"
  industry: string        // e.g. "lifestyle"
  type: string            // e.g. "persona"
  usageCount: number
  content: string         // full script text
  createdAt: string
}
