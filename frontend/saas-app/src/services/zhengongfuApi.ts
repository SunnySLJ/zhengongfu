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

export interface StoryboardShot {
  number: number
  duration: string
  bab_phase: string
  scene_cn: string
  voiceover: string
  sora_prompt: string
}

export interface StoryboardScript {
  index: number
  angle: string
  hook: string
  emotion_arc: string
  audience_trigger: string
  shots: StoryboardShot[]
  hashtags: string[]
}

export interface StoryboardResult {
  insight?: string
  scripts?: StoryboardScript[]
  marketing_tips?: {
    ab_test: string
    platform_tips: string
    best_time: string
  }
  generate_time?: string
  error?: string
}

export function genScript(original: string, style = '口播', duration = '60秒') {
  return postJson<ScriptResult>('/api/zgf/gen-script', { original, style, duration })
}

export function genStoryboard(
  industry_content: string,
  hot_trend: string,
  platform = '抖音/小红书',
  style = '电影级写实',
  duration = '30秒',
) {
  return postJson<StoryboardResult>('/api/zgf/gen-storyboard', {
    industry_content,
    hot_trend,
    platform,
    style,
    duration,
  })
}

export function genVideo(prompt: string, duration = 5, provider?: string) {
  return postJson<VideoResult>('/api/zgf/gen-video', { prompt, duration, provider })
}

export async function checkVideoStatus(taskId: string): Promise<VideoResult> {
  const resp = await fetch(`/api/zgf/video-status?task_id=${encodeURIComponent(taskId)}`)
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json()
}

export interface AudioResult {
  audio_url?: string
  provider?: string
  error?: string
}

export function genAudio(text: string, voice = 'nova', speed = 1.0) {
  return postJson<AudioResult>('/api/zgf/gen-audio', { text, voice, speed })
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

export interface DouyinPublishConfig {
  client_key: string
  access_token: string
  open_id: string
  app_id: string
  default_title_prefix: string
  mock_mode: boolean
  has_credentials?: boolean
}

export interface DouyinPublishRecord {
  id: string
  title: string
  status: string
  created_at: string
  share_url?: string
  error?: string
}

export async function getPublishConfig(): Promise<DouyinPublishConfig> {
  const resp = await fetch('/api/zgf/publish-config')
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json()
}

export function savePublishConfig(config: Partial<DouyinPublishConfig>) {
  return postJson<DouyinPublishConfig>('/api/zgf/publish-config', config as Record<string, unknown>)
}

export async function getPublishHistory(): Promise<DouyinPublishRecord[]> {
  const resp = await fetch('/api/zgf/publish-history')
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data = await resp.json()
  return data.items ?? []
}

export function publishToDouyin(params: {
  title: string
  caption: string
  hashtags: string[]
  sourceType: string
  sourceUrl?: string
  file?: File | null
  mockMode?: boolean
}): Promise<DouyinPublishRecord> {
  if (params.file) {
    const form = new FormData()
    Object.entries(params).forEach(([k, v]) => {
      if (k === 'file' && v instanceof File) form.append('file', v)
      else if (k === 'hashtags' && Array.isArray(v)) form.append(k, v.join(','))
      else if (v !== undefined && v !== null) form.append(k, String(v))
    })
    return fetch('/api/zgf/publish-douyin', { method: 'POST', body: form })
      .then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); return d })
  }
  return postJson<DouyinPublishRecord>('/api/zgf/publish-douyin', params as unknown as Record<string, unknown>)
}

export interface VideoHistoryRecord {
  task_id: string
  video_url: string
  prompt: string
  provider: string
  duration: number
  created_at: string
  completed_at: string
}

export async function getVideoHistory(): Promise<VideoHistoryRecord[]> {
  const resp = await fetch('/api/zgf/video-history')
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data = await resp.json()
  return data.items ?? []
}
