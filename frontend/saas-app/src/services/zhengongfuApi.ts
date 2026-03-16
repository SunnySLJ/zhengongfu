export interface ExtractResult {
  text: string
  url?: string
  method?: string
  video_id?: string
  author?: string
  title?: string
  desc?: string
  tags?: string[]
  frames?: string[]
  audio_rel_path?: string
  error?: string
}

export interface ScriptSegment {
  shot: number
  time: string
  scene: string
  camera_move: string
  visual_change: string
  sound: string
  text: string
}

export interface ScriptResult {
  title?: string
  video_type?: string
  video_duration?: string
  spread_drivers?: string[]
  marketing_fusion?: string
  hook?: string
  full_script?: string
  segments?: ScriptSegment[]
  ai_video_prompt?: string
  drainage_design?: string
  suitable_platforms?: string[]
  ai_difficulty?: string
  viral_score?: number
  hashtags?: string[]
  bgm_style?: string
  tips?: string
  generate_time?: string
  error?: string
}

export interface VideoResult {
  task_id: string
  status: string
  video_url: string
  provider?: string
  progress?: number
  error?: string
}

export interface PlatformPublish {
  platform: string
  platform_name: string
  title: string
  copy: string
  hashtags: string[]
}

export interface PublishResult {
  platforms?: PlatformPublish[]
  generate_time?: string
  error?: string
}

export interface SoraProvider {
  name: string
  host: string
  apiKey: string
}

export interface SoraConfig {
  provider: string
  providers: Record<string, SoraProvider>
}

export interface TrendItem {
  rank: number
  title: string
  heat: string
  category: string
  description: string
  video_url: string
  cover: string
  search_url: string
}

export interface TrendsResult {
  trends: TrendItem[]
  fetch_time?: string
  error?: string
}

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data = await resp.json()
  if (data.error) throw new Error(data.error)
  return data as T
}

export function extractCopy(shareText: string) {
  return postJson<ExtractResult>('/api/zgf/extract-copy', { share_text: shareText })
}

export function genScript(original: string, style = '口播', duration = '60秒') {
  return postJson<ScriptResult>('/api/zgf/gen-script', { original, style, duration })
}

export function genVideo(prompt: string, duration = 5, provider?: string) {
  return postJson<VideoResult>('/api/zgf/gen-video', { prompt, duration, provider })
}

export async function checkVideoStatus(taskId: string): Promise<VideoResult> {
  const resp = await fetch(`/api/zgf/video-status?task_id=${encodeURIComponent(taskId)}`)
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json()
}

export function genPublish(script: string, title = '') {
  return postJson<PublishResult>('/api/zgf/gen-publish', { script, title })
}

export async function fetchTrends(): Promise<TrendsResult> {
  const resp = await fetch('/api/douyin-trends')
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data = await resp.json()
  if (data.error) throw new Error(data.error)
  return data as TrendsResult
}

export async function getSoraConfig(): Promise<SoraConfig> {
  const resp = await fetch('/api/zgf/sora-config')
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json()
}

export function saveSoraConfig(config: SoraConfig) {
  return postJson<{ ok: boolean }>('/api/zgf/sora-config', config as unknown as Record<string, unknown>)
}
