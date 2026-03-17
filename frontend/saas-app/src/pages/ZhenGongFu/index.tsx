import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, Input, Button, Select, message, Divider, Tag, Progress, Image, Spin, Upload, Switch } from 'antd'
import {
  FileTextOutlined,
  EditOutlined,
  VideoCameraOutlined,
  SendOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  UserOutlined,
  PictureOutlined,
  AudioOutlined,
  RobotOutlined,
  PlayCircleOutlined,
  FireOutlined,
  ReloadOutlined,
  StarOutlined,
  SettingOutlined,
  SaveOutlined,
  HistoryOutlined,
  UploadOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import {
  extractCopy, genScript, genVideo, genAudio, genPublish, fetchTrends,
  getSoraConfig, saveSoraConfig, checkVideoStatus, getPublishConfig, savePublishConfig,
  getPublishHistory, publishToDouyin,
} from '../../services/zhengongfuApi'
import type {
  ExtractResult, ScriptResult, PlatformPublish, TrendItem, SoraConfig, SoraProvider,
  DouyinPublishConfig, DouyinPublishRecord,
} from '../../services/zhengongfuApi'

const STYLE_OPTIONS = [
  { label: '口播讲解', value: '口播' },
  { label: '故事叙事', value: '故事' },
  { label: '情感共鸣', value: '情感' },
  { label: '知识科普', value: '知识科普' },
  { label: '种草推荐', value: '种草' },
  { label: '搞笑娱乐', value: '搞笑' },
]

const DURATION_OPTIONS = [
  { label: '10秒', value: '10秒' },
  { label: '15秒', value: '15秒' },
  { label: '30秒', value: '30秒' },
  { label: '60秒', value: '60秒' },
]

const PC: Record<string, string> = {
  douyin: '#000', kuaishou: '#ff4906', xiaohongshu: '#fe2c55',
  shipinhao: '#07c160', bilibili: '#00a1d6',
}

const CAT_COLOR: Record<string, string> = {
  科技: 'blue', 娱乐: 'magenta', 社会: 'red', 财经: 'gold',
  体育: 'green', 政策: 'orange', 生活: 'cyan', 教育: 'purple',
  国际: 'geekblue', 美食: 'volcano', 时尚: 'pink', 其他: 'default',
}

const G = { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }

function stripHash(s: string) { return s.replace(/#/g, '').trim() }

function maskKey(k: string) {
  if (!k || k.length < 8) return k
  return k.slice(0, 6) + '***' + k.slice(-4)
}

function hasUsableScript(result: ScriptResult | null | undefined) {
  if (!result) return false
  return Boolean(
    result.full_script?.trim()
    || result.ai_video_prompt?.trim()
    || (result.segments && result.segments.length > 0),
  )
}

function parseHashtags(text: string) {
  return text
    .replace(/，/g, ' ')
    .replace(/,/g, ' ')
    .split(/\s+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
}

function Hd({ n, text, icon, done, busy }: { n: number; text: string; icon: React.ReactNode; done: boolean; busy: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
        background: done ? '#52c41a' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      }}>
        {busy ? <LoadingOutlined style={{ fontSize: 9 }} /> : done ? <CheckCircleOutlined style={{ fontSize: 9 }} /> : n}
      </div>
      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600, fontSize: 12 }}>{icon} {text}</span>
    </div>
  )
}

export default function ZhenGongFuPage() {
  const [shareLink, setShareLink] = useState('')
  const [extractedCopy, setExtractedCopy] = useState('')
  const [extractMeta, setExtractMeta] = useState<Partial<ExtractResult>>({})
  const [extracting, setExtracting] = useState(false)

  const [scriptInput, setScriptInput] = useState('')
  const [scriptStyle, setScriptStyle] = useState('口播')
  const [scriptDuration, setScriptDuration] = useState('30秒')
  const [scriptResult, setScriptResult] = useState<ScriptResult | null>(null)
  const [generatingScript, setGeneratingScript] = useState(false)

  const [audioText, setAudioText] = useState('')
  const [audioVoice, setAudioVoice] = useState('nova')
  const [audioSpeed, setAudioSpeed] = useState(1.0)
  const [audioUrl, setAudioUrl] = useState('')
  const [generatingAudio, setGeneratingAudio] = useState(false)

  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoTaskId, setVideoTaskId] = useState('')
  const [videoStatus, setVideoStatus] = useState('')
  const [generatingVideo, setGeneratingVideo] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)

  const [soraConfig, setSoraConfig] = useState<SoraConfig | null>(null)
  const [soraProvider, setSoraProvider] = useState('n1n')
  const [showSoraSettings, setShowSoraSettings] = useState(false)
  const [editingProvider, setEditingProvider] = useState<{ key: string; data: SoraProvider } | null>(null)

  const [publishList, setPublishList] = useState<PlatformPublish[]>([])
  const [generatingPublish, setGeneratingPublish] = useState(false)
  const [publishConfig, setPublishConfig] = useState<DouyinPublishConfig | null>(null)
  const [showPublishSettings, setShowPublishSettings] = useState(false)
  const [publishTitle, setPublishTitle] = useState('')
  const [publishCaption, setPublishCaption] = useState('')
  const [publishTags, setPublishTags] = useState('')
  const [publishMode, setPublishMode] = useState<'generated' | 'upload'>('generated')
  const [publishMockMode, setPublishMockMode] = useState(true)
  const [publishFile, setPublishFile] = useState<File | null>(null)
  const [submittingPublish, setSubmittingPublish] = useState(false)
  const [publishResult, setPublishResult] = useState<DouyinPublishRecord | null>(null)
  const [publishHistory, setPublishHistory] = useState<DouyinPublishRecord[]>([])

  const [trends, setTrends] = useState<TrendItem[]>([])
  const [trendsLoading, setTrendsLoading] = useState(false)
  const [trendsTime, setTrendsTime] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeScript = scriptResult?.full_script || extractedCopy

  // 加载 Sora 配置
  useEffect(() => {
    getSoraConfig().then(c => {
      setSoraConfig(c)
      setSoraProvider(c.provider || 'n1n')
    }).catch(() => {})
  }, [])

  useEffect(() => {
    getPublishConfig().then((c) => {
      setPublishConfig(c)
      setPublishMockMode(c.mock_mode)
    }).catch(() => {})
    getPublishHistory().then(setPublishHistory).catch(() => {})
  }, [])

  // 当脚本生成完成时自动填充 AI Prompt 和音频文本
  useEffect(() => {
    if (scriptResult?.ai_video_prompt && !videoPrompt) {
      setVideoPrompt(scriptResult.ai_video_prompt)
    }
    if (scriptResult?.full_script && !audioText) {
      setAudioText(scriptResult.full_script)
    }
  }, [scriptResult?.ai_video_prompt, scriptResult?.full_script])

  useEffect(() => {
    const douyinCopy = publishList.find((item) => item.platform === 'douyin')
    if (douyinCopy) {
      if (!publishTitle) setPublishTitle(douyinCopy.title || '')
      if (!publishCaption) setPublishCaption(douyinCopy.copy || '')
      if (!publishTags) setPublishTags((douyinCopy.hashtags || []).join(' '))
      return
    }
    if (scriptResult?.title && !publishTitle) setPublishTitle(scriptResult.title)
    if (scriptResult?.full_script && !publishCaption) setPublishCaption(scriptResult.full_script)
    if (scriptResult?.hashtags?.length && !publishTags) setPublishTags(scriptResult.hashtags.join(' '))
  }, [publishList, scriptResult, publishTitle, publishCaption, publishTags])

  // 轮询视频状态
  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  useEffect(() => { return stopPolling }, [stopPolling])

  function startPolling(taskId: string) {
    stopPolling()
    const startTime = Date.now()
    const MAX_POLL_MS = 10 * 60 * 1000 // 最多轮询 10 分钟
    pollRef.current = setInterval(async () => {
      // 超时保护
      if (Date.now() - startTime > MAX_POLL_MS) {
        stopPolling()
        setVideoStatus('failed')
        setGeneratingVideo(false)
        message.error('视频生成超时，请重试')
        return
      }
      try {
        const r = await checkVideoStatus(taskId)
        if (r.progress) setVideoProgress(r.progress)
        if (r.status === 'completed' && r.video_url) {
          setVideoUrl(r.video_url)
          setVideoStatus('completed')
          setGeneratingVideo(false)
          setVideoProgress(100)
          stopPolling()
          message.success('视频生成完成')
        } else if (r.status === 'failed') {
          setVideoStatus('failed')
          setGeneratingVideo(false)
          stopPolling()
          message.error(`视频生成失败: ${r.error || '未知错误'}`)
        }
        // 其他状态（processing/unknown）继续轮询
      } catch {
        // 网络错误继续轮询
      }
    }, 10000) // 每 10 秒轮询一次
  }

  async function handleFetchTrends() {
    setTrendsLoading(true)
    try {
      const r = await fetchTrends()
      setTrends(r.trends || [])
      setTrendsTime(r.fetch_time || '')
      message.success(`获取到 ${r.trends?.length || 0} 条热点`)
    } catch (e) { message.error(`获取失败: ${e instanceof Error ? e.message : '未知错误'}`) }
    finally { setTrendsLoading(false) }
  }

  useEffect(() => { handleFetchTrends() }, [])

  async function handleExtract() {
    if (!shareLink.trim()) { message.warning('请粘贴链接'); return }
    setExtracting(true); setExtractedCopy(''); setExtractMeta({})
    try {
      const r = await extractCopy(shareLink)
      setExtractedCopy(r.text); setExtractMeta(r)
      const methodLabel = r.method === 'local-whisper'
        ? '完整口播脚本'
        : r.method?.startsWith('asr')
          ? '语音识别'
          : r.method === 'page-desc'
            ? '页面文案'
            : r.method === 'share-text'
              ? '分享文本'
              : '文案提取'
      message.success(`提取成功 — ${methodLabel}`)
    } catch (e) { message.error(`提取失败: ${e instanceof Error ? e.message : '未知错误'}`) }
    finally { setExtracting(false) }
  }

  async function handleGenScript() {
    const input = scriptInput.trim() || extractedCopy.trim()
    if (!input) { message.warning('请输入热点信息/文案参考，或先提取文案'); return }
    setGeneratingScript(true); setScriptResult(null)
    try {
      const r = await genScript(input, scriptStyle, scriptDuration)
      if (!hasUsableScript(r)) {
        throw new Error(r.error || '接口未返回可用脚本内容')
      }
      setScriptResult(r)
      if (r.ai_video_prompt) setVideoPrompt(r.ai_video_prompt)
      message.success('脚本生成成功')
    } catch (e) { message.error(`失败: ${e instanceof Error ? e.message : '未知错误'}`) }
    finally { setGeneratingScript(false) }
  }

  async function handleGenAudio() {
    const text = audioText.trim() || activeScript.trim()
    if (!text) { message.warning('请先生成脚本或输入文本'); return }
    setGeneratingAudio(true); setAudioUrl('')
    try {
      const r = await genAudio(text, audioVoice, audioSpeed)
      if (r.audio_url) {
        setAudioUrl(r.audio_url)
        message.success(`声音生成完成 (${r.provider || 'TTS'})`)
      } else {
        throw new Error(r.error || '生成失败')
      }
    } catch (e) {
      message.error(`声音生成失败: ${e instanceof Error ? e.message : '未知错误'}`)
    } finally {
      setGeneratingAudio(false)
    }
  }

  async function handleGenVideo() {
    const prompt = videoPrompt.trim() || activeScript.trim()
    if (!prompt) { message.warning('请先生成脚本获取AI Prompt，或手动输入'); return }
    setGeneratingVideo(true); setVideoUrl(''); setVideoProgress(0); setVideoStatus('processing')
    try {
      const durSec = parseInt(scriptDuration) || 10
      const r = await genVideo(prompt, Math.min(durSec, 20), soraProvider)
      setVideoTaskId(r.task_id)
      if (r.status === 'completed' && r.video_url) {
        setVideoUrl(r.video_url); setVideoStatus('completed'); setVideoProgress(100)
        setGeneratingVideo(false)
        message.success('视频生成完成')
      } else {
        message.info(`已提交到 ${r.provider || 'Sora'}，正在生成中...`)
        startPolling(r.task_id)
      }
    } catch (e) {
      setGeneratingVideo(false); setVideoStatus('failed')
      message.error(`提交失败: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  async function handleGenPublish() {
    if (!activeScript.trim()) { message.warning('请先生成脚本'); return }
    setGeneratingPublish(true); setPublishList([])
    try {
      const r = await genPublish(activeScript, scriptResult?.title || extractMeta.title || '')
      if (r.platforms) { setPublishList(r.platforms); message.success('生成成功') }
    } catch (e) { message.error(`失败: ${e instanceof Error ? e.message : '未知错误'}`) }
    finally { setGeneratingPublish(false) }
  }

  function cp(t: string) { navigator.clipboard.writeText(t).then(() => message.success('已复制')) }

  function handleReset() {
    stopPolling()
    setShareLink(''); setExtractedCopy(''); setExtractMeta({})
    setScriptInput(''); setScriptResult(null)
    setVideoPrompt(''); setVideoUrl(''); setVideoTaskId(''); setVideoStatus(''); setVideoProgress(0)
    setPublishList([])
    setPublishTitle(''); setPublishCaption(''); setPublishTags('')
    setPublishFile(null); setPublishResult(null)
  }

  async function handleSaveSoraConfig() {
    if (!soraConfig) return
    const newConfig = { ...soraConfig, provider: soraProvider }
    try {
      await saveSoraConfig(newConfig)
      setSoraConfig(newConfig)
      message.success('配置已保存')
    } catch (e) { message.error(`保存失败: ${e instanceof Error ? e.message : '未知错误'}`) }
  }

  async function handleSavePublishConfig() {
    if (!publishConfig) return
    try {
      const saved = await savePublishConfig({ ...publishConfig, mock_mode: publishMockMode })
      setPublishConfig(saved)
      setPublishMockMode(saved.mock_mode)
      message.success('抖音发布配置已保存')
    } catch (e) {
      message.error(`保存失败: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  async function refreshPublishHistory() {
    try {
      const items = await getPublishHistory()
      setPublishHistory(items)
    } catch {
      // ignore
    }
  }

  async function handleSubmitDouyin() {
    const prefix = publishConfig?.default_title_prefix?.trim() || ''
    const rawTitle = publishTitle.trim()
    const title = `${prefix}${rawTitle}`.trim()
    const caption = publishCaption.trim()
    const hashtags = parseHashtags(publishTags)
    if (!title) { message.warning('请填写发布标题'); return }
    if (publishMode === 'generated' && !videoUrl) { message.warning('当前没有可发布的视频，请先生成视频或切换为本地上传'); return }
    if (publishMode === 'upload' && !publishFile) { message.warning('请先上传本地视频文件'); return }

    setSubmittingPublish(true)
    setPublishResult(null)
    try {
      const result = await publishToDouyin({
        title,
        caption,
        hashtags,
        sourceType: publishMode,
        sourceUrl: publishMode === 'generated' ? videoUrl : undefined,
        file: publishMode === 'upload' ? publishFile : null,
        mockMode: publishMockMode,
      })
      setPublishResult(result)
      setPublishHistory((prev) => [result, ...prev.filter((item) => item.id !== result.id)].slice(0, 20))
      message.success(result.status === 'published' ? '抖音发布成功' : '抖音发布任务已完成')
    } catch (e) {
      message.error(`发布失败: ${e instanceof Error ? e.message : '未知错误'}`)
    } finally {
      setSubmittingPublish(false)
    }
  }

  function handleUpdateProvider(key: string, field: keyof SoraProvider, value: string) {
    if (!soraConfig) return
    const updated = { ...soraConfig, providers: { ...soraConfig.providers, [key]: { ...soraConfig.providers[key], [field]: value } } }
    setSoraConfig(updated)
  }

  function handleUpdatePublishConfig(field: keyof DouyinPublishConfig, value: string | boolean) {
    if (!publishConfig) return
    setPublishConfig({ ...publishConfig, [field]: value } as DouyinPublishConfig)
  }

  const providerOptions = soraConfig ? Object.entries(soraConfig.providers).map(([k, v]) => ({
    label: v.name, value: k,
  })) : []

  return (
    <div style={{ padding: '12px 16px', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 15, fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>帧功夫</span>
          <span style={{ fontSize: 10, color: '#aaa', marginLeft: 6 }}>热点获取 → 文案提取 → 脚本生成 → 声音生成 → 视频生成 → 矩阵发布</span>
        </div>
        {(!!extractedCopy || !!scriptResult || !!videoUrl || publishList.length > 0) && (
          <Button size="small" onClick={handleReset} style={{ fontSize: 11 }}>重新开始</Button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* ══ 左列: 功能区 ══ */}
        <div style={{ width: '50%', flexShrink: 0 }}>

          {/* ═══ 0. 热点获取 ═══ */}
          <Card size="small" style={{ marginBottom: 8 }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
                  background: trends.length > 0 ? '#ff4d4f' : 'linear-gradient(135deg, #ff4d4f, #ff7a45)',
                }}>
                  {trendsLoading ? <LoadingOutlined style={{ fontSize: 9 }} /> : <FireOutlined style={{ fontSize: 9 }} />}
                </div>
                <span style={{ fontWeight: 600, fontSize: 12 }}><FireOutlined /> 抖音热点</span>
                {trendsTime && <span style={{ fontSize: 9, color: '#aaa', fontWeight: 400 }}>{trendsTime}</span>}
              </div>
            }
            extra={
              <Button size="small" type="text" icon={<ReloadOutlined />} loading={trendsLoading}
                onClick={handleFetchTrends} style={{ fontSize: 10 }}>刷新</Button>
            }>
            {trendsLoading && trends.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <Spin size="small" />
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>正在获取热点数据...</div>
              </div>
            ) : trends.length > 0 ? (
              <div style={{ display: 'grid', gap: 3, maxHeight: 340, overflowY: 'auto' }}>
                {trends.map((item, i) => {
                  const cleanTitle = stripHash(item.title)
                  return (
                    <div key={i}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px',
                        borderRadius: 4, border: '1px solid #f0f0f0', cursor: 'pointer', transition: 'all .15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f6f0ff'; e.currentTarget.style.borderColor = '#d3adf7' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#f0f0f0' }}
                      onClick={() => cp(cleanTitle)}
                    >
                      <span style={{
                        width: 18, height: 18, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, flexShrink: 0, color: '#fff',
                        background: item.rank <= 3 ? '#ff4d4f' : item.rank <= 10 ? '#fa8c16' : '#bbb',
                      }}>{item.rank}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cleanTitle}
                        </div>
                        {item.description && (
                          <div style={{ fontSize: 9, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {stripHash(item.description)}
                          </div>
                        )}
                      </div>
                      <Tag color={CAT_COLOR[item.category] || 'default'} style={{ fontSize: 9, lineHeight: '14px', margin: 0, flexShrink: 0 }}>
                        {item.category}
                      </Tag>
                      <span style={{ fontSize: 9, color: '#aaa', flexShrink: 0, whiteSpace: 'nowrap' }}>{item.heat}</span>
                      <CopyOutlined style={{ fontSize: 9, color: '#bbb', flexShrink: 0 }} />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px 0', color: '#aaa', fontSize: 11 }}>暂无热点数据</div>
            )}
          </Card>

          {/* ═══ 1. 文案提取 ═══ */}
          <Card size="small" title={<Hd n={1} text="文案提取" icon={<FileTextOutlined />} done={!!extractedCopy} busy={extracting} />} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              <Tag color="red" style={{ fontSize: 10, lineHeight: '16px' }}>抖音</Tag>
              <Tag color="orange" style={{ fontSize: 10, lineHeight: '16px' }}>快手</Tag>
              <Tag color="pink" style={{ fontSize: 10, lineHeight: '16px' }}>小红书</Tag>
            </div>
            <Input.TextArea rows={2} value={shareLink} onChange={e => setShareLink(e.target.value)}
              placeholder="粘贴视频分享链接" style={{ marginBottom: 6, fontSize: 11 }} />
            <Button type="primary" block loading={extracting} onClick={handleExtract}
              style={{ height: 30, fontSize: 12, fontWeight: 600, ...G }}>提取文案</Button>
            {extractedCopy && (
              <>
                <Divider style={{ margin: '8px 0 6px' }} />
                <div style={{ marginBottom: 6, background: '#fafafa', borderRadius: 4, padding: 6, border: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
                    {extractMeta.method && (
                      <Tag
                        icon={extractMeta.method === 'local-whisper' || extractMeta.method.startsWith('asr') ? <AudioOutlined /> : <RobotOutlined />}
                        color={extractMeta.method === 'local-whisper' || extractMeta.method.startsWith('asr') ? 'green' : extractMeta.method === 'share-text' ? 'orange' : 'blue'}
                        style={{ fontSize: 10 }}
                      >
                        {extractMeta.method === 'local-whisper'
                          ? '本地 Whisper'
                          : extractMeta.method.startsWith('asr')
                            ? '语音识别'
                            : extractMeta.method === 'page-desc'
                              ? '页面文案'
                              : extractMeta.method === 'share-text'
                                ? '分享文本'
                                : 'AI还原'}
                      </Tag>
                    )}
                    {extractMeta.video_id && <Tag style={{ fontSize: 10 }}>ID: {extractMeta.video_id}</Tag>}
                    {extractMeta.title && <Tag color="geekblue" style={{ fontSize: 10 }}>{extractMeta.title}</Tag>}
                    {extractMeta.author && <Tag icon={<UserOutlined />} style={{ fontSize: 10 }}>@{extractMeta.author}</Tag>}
                    {extractMeta.tags?.map((t, i) => <Tag key={i} style={{ fontSize: 9 }}>{t}</Tag>)}
                  </div>
                </div>
                {extractMeta.frames && extractMeta.frames.length > 0 && (
                  <div style={{ marginBottom: 6, display: 'flex', gap: 4, alignItems: 'center' }}>
                    <PictureOutlined style={{ fontSize: 10, color: '#999' }} />
                    <Image.PreviewGroup>
                      {extractMeta.frames.map((s, i) => (
                        <Image key={i} src={s} width={80} height={45}
                          style={{ objectFit: 'cover', borderRadius: 3, border: '1px solid #eee' }} />
                      ))}
                    </Image.PreviewGroup>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: 11 }}>
                    {extractMeta.method === 'local-whisper' ? '完整口播脚本' : '提取结果'}
                  </span>
                  <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => cp(extractedCopy)} style={{ fontSize: 10, height: 20 }}>复制</Button>
                </div>
                <Input.TextArea rows={extractMeta.method === 'local-whisper' ? 6 : 3} value={extractedCopy} onChange={e => setExtractedCopy(e.target.value)}
                  style={{ fontSize: 11, lineHeight: '1.6' }} />
              </>
            )}
          </Card>

          {/* ═══ 2. AI分镜脚本 ═══ */}
          <Card size="small" title={<Hd n={2} text="AI分镜脚本" icon={<EditOutlined />} done={!!scriptResult?.full_script} busy={generatingScript} />} style={{ marginBottom: 8 }}>
            <Input.TextArea rows={3} value={scriptInput} onChange={e => setScriptInput(e.target.value)}
              placeholder="输入热点信息、文案参考或创意灵感（也可留空使用提取的文案）"
              style={{ marginBottom: 6, fontSize: 11 }} />
            {extractedCopy && !scriptInput && (
              <div style={{ background: '#fafafa', borderRadius: 4, padding: 4, marginBottom: 6, border: '1px solid #f0f0f0',
                fontSize: 10, color: '#888', maxHeight: 40, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                将使用提取文案: {extractedCopy.slice(0, 100)}{extractedCopy.length > 100 ? '...' : ''}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 2 }}>风格</div>
                <Select size="small" value={scriptStyle} onChange={setScriptStyle} options={STYLE_OPTIONS} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 2 }}>时长</div>
                <Select size="small" value={scriptDuration} onChange={setScriptDuration} options={DURATION_OPTIONS} style={{ width: '100%' }} />
              </div>
            </div>
            <Button type="primary" block loading={generatingScript} onClick={handleGenScript}
              style={{ height: 30, fontSize: 12, fontWeight: 600, ...G }}>生成AI分镜脚本</Button>

            {scriptResult && (
              <>
                <Divider style={{ margin: '8px 0 6px' }} />
                {scriptResult.title && <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{scriptResult.title}</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
                  {scriptResult.video_type && <Tag color="purple" style={{ fontSize: 9 }}>{scriptResult.video_type}</Tag>}
                  {scriptResult.video_duration && <Tag color="blue" style={{ fontSize: 9 }}>{scriptResult.video_duration}</Tag>}
                  {scriptResult.ai_difficulty && <Tag color={scriptResult.ai_difficulty === '低' ? 'green' : scriptResult.ai_difficulty === '中' ? 'orange' : 'red'} style={{ fontSize: 9 }}>AI难度: {scriptResult.ai_difficulty}</Tag>}
                  {scriptResult.viral_score && <Tag color="volcano" style={{ fontSize: 9 }}><StarOutlined /> 爆款: {scriptResult.viral_score}/10</Tag>}
                </div>
                {scriptResult.spread_drivers && scriptResult.spread_drivers.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 4 }}>
                    <span style={{ fontSize: 9, color: '#888', lineHeight: '20px' }}>传播力:</span>
                    {scriptResult.spread_drivers.map((d, i) => <Tag key={i} color="cyan" style={{ fontSize: 9, margin: 0 }}>{d}</Tag>)}
                  </div>
                )}
                {scriptResult.hook && (
                  <div style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 3, padding: '3px 6px', marginBottom: 6, fontSize: 11 }}>
                    <strong>Hook:</strong> {scriptResult.hook}
                  </div>
                )}
                {scriptResult.segments && scriptResult.segments.length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 600 }}>分镜脚本</span>
                      <Button size="small" type="text" icon={<CopyOutlined />} style={{ fontSize: 10, height: 20 }}
                        onClick={() => cp(scriptResult.segments!.map(s => `[镜头${s.shot}] ${s.time}\n画面: ${s.scene}\n镜头: ${s.camera_move}\n变化: ${s.visual_change}\n音效: ${s.sound}\n旁白: ${s.text}`).join('\n\n'))}>复制</Button>
                    </div>
                    <div style={{ display: 'grid', gap: 4 }}>
                      {scriptResult.segments.map((s, i) => (
                        <div key={i} style={{ background: '#fafafa', borderRadius: 4, padding: '6px 8px', border: '1px solid #f0f0f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                            <Tag color="purple" style={{ fontSize: 9, lineHeight: '16px', height: 18, margin: 0 }}>镜头{s.shot}</Tag>
                            <Tag style={{ fontSize: 9, lineHeight: '16px', height: 18, margin: 0 }}>{s.time}</Tag>
                          </div>
                          <div style={{ fontSize: 11, color: '#333', marginBottom: 2 }}>{s.text}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 8px', fontSize: 9, color: '#888' }}>
                            <div><strong>画面:</strong> {s.scene}</div>
                            <div><strong>镜头:</strong> {s.camera_move}</div>
                            <div><strong>变化:</strong> {s.visual_change}</div>
                            <div><strong>音效:</strong> {s.sound}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: 11 }}>完整脚本</span>
                  <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => cp(scriptResult.full_script || '')} style={{ fontSize: 10, height: 20 }}>复制</Button>
                </div>
                <Input.TextArea rows={3} value={scriptResult.full_script || ''} readOnly
                  style={{ fontSize: 11, lineHeight: '1.6', background: '#fafafa' }} />
                {scriptResult.ai_video_prompt && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: 11, color: '#722ed1' }}>AI视频Prompt (Sora/Kling)</span>
                      <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => cp(scriptResult.ai_video_prompt || '')} style={{ fontSize: 10, height: 20 }}>复制</Button>
                    </div>
                    <Input.TextArea rows={4} value={scriptResult.ai_video_prompt} readOnly
                      style={{ fontSize: 10, lineHeight: '1.5', background: '#f9f0ff', border: '1px solid #d3adf7', fontFamily: 'monospace' }} />
                  </div>
                )}
                {scriptResult.drainage_design && (
                  <div style={{ marginTop: 6, fontSize: 10, color: '#666', background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 3, padding: '3px 6px' }}>
                    <strong>引流:</strong> {scriptResult.drainage_design}
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 6 }}>
                  {scriptResult.suitable_platforms?.map((p, i) => <Tag key={i} color="geekblue" style={{ fontSize: 9 }}>{p}</Tag>)}
                  {scriptResult.hashtags?.map((t, i) => <Tag key={i} color="blue" style={{ fontSize: 9 }}>{t}</Tag>)}
                  {scriptResult.bgm_style && <Tag color="orange" style={{ fontSize: 9 }}>BGM: {scriptResult.bgm_style}</Tag>}
                </div>
                {scriptResult.tips && <div style={{ fontSize: 10, color: '#aaa', marginTop: 3 }}>{scriptResult.tips}</div>}
              </>
            )}
          </Card>

        </div>

        {/* ══ 右列: 声音生成 + 视频生成 + 矩阵发布 ══ */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ═══ 3. 声音生成 ═══ */}
          <Card size="small" style={{ marginBottom: 8 }}
            title={<Hd n={3} text="声音生成" icon={<AudioOutlined />} done={!!audioUrl} busy={generatingAudio} />}>
            <div style={{ display: 'grid', gap: 6 }}>
              <Input.TextArea
                value={audioText}
                onChange={e => setAudioText(e.target.value)}
                placeholder="输入要转换为语音的文本，或先生成脚本自动填入"
                autoSize={{ minRows: 3, maxRows: 6 }}
                showCount
                maxLength={2000}
                style={{ fontSize: 11 }}
              />
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 600, flexShrink: 0 }}>音色</span>
                <Select size="small" value={audioVoice} onChange={setAudioVoice} style={{ flex: 1 }}
                  options={[
                    { value: 'nova', label: '🌟 Nova（清澈女声）' },
                    { value: 'shimmer', label: '✨ Shimmer（温柔女声）' },
                    { value: 'alloy', label: '🔷 Alloy（中性）' },
                    { value: 'echo', label: '🔵 Echo（磁性男声）' },
                    { value: 'onyx', label: '⚫ Onyx（低沉男声）' },
                    { value: 'fable', label: '📖 Fable（叙事男声）' },
                  ]} />
                <span style={{ fontSize: 10, fontWeight: 600, flexShrink: 0 }}>语速</span>
                <Select size="small" value={audioSpeed} onChange={setAudioSpeed} style={{ width: 80 }}
                  options={[
                    { value: 0.75, label: '0.75x' },
                    { value: 1.0, label: '1.0x' },
                    { value: 1.25, label: '1.25x' },
                    { value: 1.5, label: '1.5x' },
                  ]} />
              </div>
              <Button type="primary" block loading={generatingAudio} onClick={handleGenAudio}
                style={{ height: 30, fontSize: 12, fontWeight: 600, ...G }}>
                <AudioOutlined /> 生成声音
              </Button>
              {audioUrl && (
                <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: '#52c41a', marginBottom: 6, fontWeight: 600 }}>声音生成完成</div>
                  <audio controls src={audioUrl} style={{ width: '100%', height: 32 }} />
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <Button size="small" icon={<CopyOutlined />} style={{ flex: 1, fontSize: 10 }}
                      onClick={() => navigator.clipboard.writeText(`http://localhost:8899${audioUrl}`).then(() => message.success('已复制'))}>
                      复制链接
                    </Button>
                    <Button size="small" type="primary" icon={<DownloadOutlined />} style={{ flex: 1, fontSize: 10, ...G }}
                      onClick={() => { const a = document.createElement('a'); a.href = audioUrl; a.download = 'audio.mp3'; a.click() }}>
                      下载 MP3
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card size="small" style={{ marginBottom: 8 }}
            title={<Hd n={4} text="视频生成" icon={<VideoCameraOutlined />} done={!!videoUrl} busy={generatingVideo} />}
            extra={
              <Button size="small" type="text" icon={<SettingOutlined />}
                onClick={() => setShowSoraSettings(!showSoraSettings)} style={{ fontSize: 10 }}>
                {showSoraSettings ? '收起' : '配置'}
              </Button>
            }>

            {/* Sora 配置区 */}
            {showSoraSettings && soraConfig && (
              <div style={{ marginBottom: 8, background: '#fafafa', borderRadius: 4, padding: 8, border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 4 }}>Sora 服务商配置</div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {Object.entries(soraConfig.providers).map(([key, prov]) => (
                    <div key={key} style={{
                      padding: '6px 8px', borderRadius: 4,
                      border: `1px solid ${soraProvider === key ? '#8b5cf6' : '#eee'}`,
                      background: soraProvider === key ? '#f9f0ff' : '#fff',
                      cursor: 'pointer',
                    }} onClick={() => setSoraProvider(key)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: soraProvider === key ? '#8b5cf6' : '#ddd' }} />
                          <span style={{ fontSize: 11, fontWeight: 600 }}>{prov.name}</span>
                        </div>
                        <Button size="small" type="text" icon={<EditOutlined />} style={{ fontSize: 9, height: 18 }}
                          onClick={e => { e.stopPropagation(); setEditingProvider(editingProvider?.key === key ? null : { key, data: { ...prov } }) }} />
                      </div>
                      <div style={{ fontSize: 9, color: '#999', marginTop: 2 }}>
                        {prov.host} | Key: {maskKey(prov.apiKey)}
                      </div>
                      {editingProvider?.key === key && (
                        <div style={{ marginTop: 6, display: 'grid', gap: 4 }} onClick={e => e.stopPropagation()}>
                          <Input size="small" value={soraConfig.providers[key].host} placeholder="API Host"
                            onChange={e => handleUpdateProvider(key, 'host', e.target.value)} style={{ fontSize: 10 }} />
                          <Input size="small" value={soraConfig.providers[key].apiKey} placeholder="API Key"
                            onChange={e => handleUpdateProvider(key, 'apiKey', e.target.value)} style={{ fontSize: 10 }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleSaveSoraConfig}
                  style={{ marginTop: 6, fontSize: 10, height: 24, ...G }}>保存配置</Button>
              </div>
            )}

            {/* 服务商选择 */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 600, flexShrink: 0 }}>服务商</div>
              <Select size="small" value={soraProvider} onChange={setSoraProvider}
                options={providerOptions} style={{ flex: 1 }} />
            </div>

            {/* 视频 Prompt 输入 */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 600 }}>视频 Prompt</span>
                {scriptResult?.ai_video_prompt && (
                  <Button size="small" type="text" style={{ fontSize: 9, height: 18 }}
                    onClick={() => setVideoPrompt(scriptResult.ai_video_prompt || '')}>
                    从脚本填入
                  </Button>
                )}
              </div>
              <Input.TextArea rows={3} value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)}
                placeholder="输入视频生成 Prompt（英文效果更佳），或在Step 2生成脚本后自动填入"
                style={{ fontSize: 10, fontFamily: 'monospace' }} />
            </div>

            {/* 人物形象 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 600, flexShrink: 0 }}>形象</div>
              {/* avatar upload remains for future use */}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f?.type.startsWith('image/')) { message.info('形象已选择') } }} />
              <span style={{ fontSize: 9, color: '#aaa' }}>Sora 自动生成画面</span>
            </div>

            <Button type="primary" block loading={generatingVideo} onClick={handleGenVideo}
              style={{ height: 30, fontSize: 12, fontWeight: 600, ...G }}>
              <PlayCircleOutlined /> 生成视频
            </Button>

            {/* 状态显示 */}
            {generatingVideo && (
              <div style={{ marginTop: 6 }}>
                <Progress percent={videoProgress || 10} size="small" status="active"
                  strokeColor={{ from: '#6366f1', to: '#8b5cf6' }} />
                <div style={{ fontSize: 10, color: '#888', textAlign: 'center' }}>
                  {videoStatus === 'processing' ? 'Sora 正在生成视频，请耐心等待...' : '提交中...'}
                  {videoTaskId && <span style={{ marginLeft: 4, color: '#bbb' }}>ID: {videoTaskId.slice(0, 12)}</span>}
                </div>
              </div>
            )}

            {videoStatus === 'failed' && !generatingVideo && (
              <div style={{ marginTop: 6, fontSize: 10, color: '#f5222d', background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 3, padding: '3px 6px' }}>
                视频生成失败，请检查配置或重试
              </div>
            )}

            {videoUrl && (
              <>
                <Divider style={{ margin: '6px 0' }} />
                <video controls src={videoUrl} style={{ width: '100%', borderRadius: 4, background: '#000', maxHeight: 200 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: '#aaa' }}>视频已生成</span>
                  <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => cp(videoUrl)} style={{ fontSize: 9, height: 18 }}>
                    复制链接
                  </Button>
                </div>
              </>
            )}
          </Card>

          {/* ═══ 5. 矩阵发布 ═══ */}
          <Card size="small" title={<Hd n={5} text="矩阵发布" icon={<SendOutlined />} done={publishList.length > 0 || !!publishResult} busy={generatingPublish || submittingPublish} />} style={{ marginBottom: 8 }}
            extra={
              <Button size="small" type="text" icon={<SettingOutlined />}
                onClick={() => setShowPublishSettings(!showPublishSettings)} style={{ fontSize: 10 }}>
                {showPublishSettings ? '收起配置' : '发布配置'}
              </Button>
            }>
            <div style={{ display: 'grid', gap: 6 }}>
              <Button type="primary" block loading={generatingPublish} onClick={handleGenPublish}
                style={{ height: 30, fontSize: 12, fontWeight: 600, ...G }}>
                <SendOutlined /> 生成发布文案
              </Button>

              {showPublishSettings && publishConfig && (
                <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 6, padding: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>抖音开放平台配置</div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <Input size="small" value={publishConfig.client_key} placeholder="client_key"
                      onChange={(e) => handleUpdatePublishConfig('client_key', e.target.value)} />
                    <Input size="small" value={publishConfig.open_id} placeholder="open_id"
                      onChange={(e) => handleUpdatePublishConfig('open_id', e.target.value)} />
                    <Input.Password size="small" value={publishConfig.access_token} placeholder="access_token"
                      onChange={(e) => handleUpdatePublishConfig('access_token', e.target.value)} />
                    <Input size="small" value={publishConfig.default_title_prefix} placeholder="标题前缀（可选）"
                      onChange={(e) => handleUpdatePublishConfig('default_title_prefix', e.target.value)} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: '#666' }}>Mock 模式</span>
                      <Switch size="small" checked={publishMockMode} onChange={setPublishMockMode} />
                    </div>
                    <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleSavePublishConfig}
                      style={{ fontSize: 10, height: 26, ...G }}>
                      保存发布配置
                    </Button>
                  </div>
                </div>
              )}

              {publishList.length > 0 && (
                <>
                  <Divider style={{ margin: '6px 0 2px' }} />
                  <div style={{ display: 'grid', gap: 6 }}>
                    {publishList.map((item, i) => (
                      <div key={i} style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden', transition: 'box-shadow .2s' }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,.06)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: PC[item.platform] || '#666' }} />
                            <span style={{ fontWeight: 600, fontSize: 11 }}>{item.platform_name}</span>
                          </div>
                          <Button size="small" type="text" icon={<CopyOutlined />} style={{ fontSize: 10, height: 20 }}
                            onClick={e => { e.stopPropagation(); cp(`${item.title}\n\n${item.copy}\n\n${item.hashtags.join(' ')}`) }}>复制全部</Button>
                        </div>
                        <div style={{ padding: '6px 8px' }}>
                          <div onClick={() => cp(item.title)} title="点击复制标题"
                            style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', marginBottom: 3, cursor: 'pointer', borderRadius: 3, padding: '1px 3px', transition: 'background .15s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f0f0ff')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>{item.title}</div>
                          <div onClick={() => cp(item.copy)} title="点击复制文案"
                            style={{ fontSize: 11, color: '#555', lineHeight: 1.5, whiteSpace: 'pre-wrap', marginBottom: 4, cursor: 'pointer', borderRadius: 3, padding: '1px 3px', transition: 'background .15s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f0f0ff')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>{item.copy}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            {item.hashtags.map((tag, j) => (
                              <Tag key={j} style={{ fontSize: 9, cursor: 'pointer', margin: 0 }} onClick={() => cp(tag)}>{tag}</Tag>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <Divider style={{ margin: '6px 0 2px' }} />
              <div style={{ fontSize: 11, fontWeight: 600 }}>抖音真实上传发布</div>
              <Input size="small" value={publishTitle} onChange={(e) => setPublishTitle(e.target.value)}
                placeholder="发布标题，建议 30 字以内" />
              <Input.TextArea rows={3} value={publishCaption} onChange={(e) => setPublishCaption(e.target.value)}
                placeholder="发布文案，会和标题、标签一起提交到抖音" style={{ fontSize: 11 }} />
              <Input size="small" value={publishTags} onChange={(e) => setPublishTags(e.target.value)}
                placeholder="#标签1 #标签2 #标签3" />

              <div style={{ display: 'flex', gap: 6 }}>
                <Button size="small" type={publishMode === 'generated' ? 'primary' : 'default'}
                  onClick={() => setPublishMode('generated')} style={publishMode === 'generated' ? G : undefined}>
                  使用生成视频
                </Button>
                <Button size="small" type={publishMode === 'upload' ? 'primary' : 'default'}
                  onClick={() => setPublishMode('upload')} style={publishMode === 'upload' ? G : undefined}>
                  本地上传视频
                </Button>
              </div>

              {publishMode === 'generated' ? (
                <div style={{ fontSize: 10, color: '#666', background: '#fafafa', borderRadius: 4, padding: '6px 8px', border: '1px solid #f0f0f0' }}>
                  {videoUrl ? `将使用当前生成视频: ${videoUrl.slice(0, 90)}${videoUrl.length > 90 ? '...' : ''}` : '当前没有可发布的生成视频'}
                </div>
              ) : (
                <div>
                  <Upload beforeUpload={(file) => { setPublishFile(file); return false }} maxCount={1} accept="video/mp4,video/quicktime,video/webm" showUploadList>
                    <Button size="small" icon={<UploadOutlined />}>选择本地视频</Button>
                  </Upload>
                  {publishFile && (
                    <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
                      已选择: {publishFile.name}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa', borderRadius: 4, padding: '6px 8px', border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 10, color: '#666' }}>
                  {publishMockMode ? '当前为 Mock 预演模式，不会真实发到抖音' : '当前为真实发布模式，请确保 token/open_id 有效'}
                </div>
                <Switch size="small" checked={publishMockMode} onChange={setPublishMockMode} />
              </div>

              <Button type="primary" block loading={submittingPublish} onClick={handleSubmitDouyin}
                style={{ height: 30, fontSize: 12, fontWeight: 600, ...G }}>
                <CloudUploadOutlined /> 上传并发布到抖音
              </Button>

              {publishResult && (
                <div style={{
                  background: publishResult.status === 'error' ? '#fff2f0' : '#f6ffed',
                  border: `1px solid ${publishResult.status === 'error' ? '#ffccc7' : '#b7eb8f'}`,
                  borderRadius: 6,
                  padding: '8px 10px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 11 }}>
                      {publishResult.status === 'published' ? '抖音发布成功' : publishResult.status === 'mock_published' ? 'Mock 发布成功' : '发布结果'}
                    </span>
                    <Tag color={publishResult.status === 'error' ? 'red' : 'green'} style={{ margin: 0, fontSize: 9 }}>{publishResult.status}</Tag>
                  </div>
                  <div style={{ fontSize: 10, color: '#555', display: 'grid', gap: 2 }}>
                    <div>时间: {publishResult.created_at}</div>
                    {publishResult.item_id && <div>Item ID: {publishResult.item_id}</div>}
                    {publishResult.video_id && <div>Video ID: {publishResult.video_id}</div>}
                    {publishResult.share_url && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>链接: {publishResult.share_url}</span>
                        <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => cp(publishResult.share_url || '')} style={{ fontSize: 10, height: 18 }}>复制</Button>
                      </div>
                    )}
                    {publishResult.error && <div style={{ color: '#cf1322' }}>错误: {publishResult.error}</div>}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 600 }}><HistoryOutlined /> 最近发布记录</span>
                <Button size="small" type="text" onClick={refreshPublishHistory} style={{ fontSize: 10, height: 20 }}>刷新</Button>
              </div>
              {publishHistory.length > 0 ? (
                <div style={{ display: 'grid', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
                  {publishHistory.slice(0, 8).map((item) => (
                    <div key={item.id} style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: '6px 8px', background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                        <Tag color={item.status === 'error' ? 'red' : 'green'} style={{ margin: 0, fontSize: 9 }}>{item.status}</Tag>
                      </div>
                      <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>{item.created_at}</div>
                      {item.share_url && (
                        <div style={{ fontSize: 9, color: '#666', marginTop: 2, wordBreak: 'break-all' }}>{item.share_url}</div>
                      )}
                      {item.error && (
                        <div style={{ fontSize: 9, color: '#cf1322', marginTop: 2 }}>{item.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 10, color: '#999' }}>暂无发布记录</div>
              )}
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}
