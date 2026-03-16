import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, Input, Button, Select, message, Divider, Tag, Progress, Image, Spin } from 'antd'
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
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import {
  extractCopy, genScript, genVideo, genPublish, fetchTrends,
  getSoraConfig, saveSoraConfig, checkVideoStatus,
} from '../../services/zhengongfuApi'
import type {
  ExtractResult, ScriptResult, PlatformPublish, TrendItem, SoraConfig, SoraProvider,
} from '../../services/zhengongfuApi'

interface HistoryItem {
  ts: string
  title: string
  text: string
  author?: string
  video_id?: string
}

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

  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoTaskId, setVideoTaskId] = useState('')
  const [videoStatus, setVideoStatus] = useState('')
  const [generatingVideo, setGeneratingVideo] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)

  const [soraConfig, setSoraConfig] = useState<SoraConfig | null>(null)
  const [soraProvider, setSoraProvider] = useState('grsai')
  const [showSoraSettings, setShowSoraSettings] = useState(false)
  const [editingProvider, setEditingProvider] = useState<{ key: string; data: SoraProvider } | null>(null)

  const [publishList, setPublishList] = useState<PlatformPublish[]>([])
  const [generatingPublish, setGeneratingPublish] = useState(false)

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
      setSoraProvider(c.provider || 'grsai')
    }).catch(() => {})
  }, [])

  // 当脚本生成完成时自动填充 AI Prompt
  useEffect(() => {
    if (scriptResult?.ai_video_prompt && !videoPrompt) {
      setVideoPrompt(scriptResult.ai_video_prompt)
    }
  }, [scriptResult?.ai_video_prompt])

  // 轮询视频状态
  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  useEffect(() => { return stopPolling }, [stopPolling])

  function startPolling(taskId: string) {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const r = await checkVideoStatus(taskId)
        setVideoProgress(r.progress || 0)
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
      } catch {
        // 继续轮询
      }
    }, 5000)
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
      setScriptResult(r)
      if (r.ai_video_prompt) setVideoPrompt(r.ai_video_prompt)
      message.success('脚本生成成功')
    } catch (e) { message.error(`失败: ${e instanceof Error ? e.message : '未知错误'}`) }
    finally { setGeneratingScript(false) }
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

  function handleUpdateProvider(key: string, field: keyof SoraProvider, value: string) {
    if (!soraConfig) return
    const updated = { ...soraConfig, providers: { ...soraConfig.providers, [key]: { ...soraConfig.providers[key], [field]: value } } }
    setSoraConfig(updated)
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
          <span style={{ fontSize: 10, color: '#aaa', marginLeft: 6 }}>热点获取 → 文案提取 → 脚本生成 → 视频生成 → 矩阵发布</span>
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
                        color={extractMeta.method === 'local-whisper' || extractMeta.method.startsWith('asr') ? 'green' : 'blue'}
                        style={{ fontSize: 10 }}
                      >
                        {extractMeta.method === 'local-whisper'
                          ? '本地 Whisper'
                          : extractMeta.method.startsWith('asr')
                            ? '语音识别'
                            : extractMeta.method === 'page-desc'
                              ? '页面文案'
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

          {/* ═══ 3. 视频生成 (Sora) ═══ */}
          <Card size="small" style={{ marginBottom: 8 }}
            title={<Hd n={3} text="视频生成" icon={<VideoCameraOutlined />} done={!!videoUrl} busy={generatingVideo} />}
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

          {/* ═══ 4. 矩阵发布 ═══ */}
          <Card size="small" title={<Hd n={4} text="矩阵发布" icon={<SendOutlined />} done={publishList.length > 0} busy={generatingPublish} />} style={{ marginBottom: 8 }}>
            <Button type="primary" block loading={generatingPublish} onClick={handleGenPublish}
              style={{ height: 30, fontSize: 12, fontWeight: 600, ...G }}>
              <SendOutlined /> 生成发布文案
            </Button>
            {publishList.length > 0 && (
              <>
                <Divider style={{ margin: '8px 0 6px' }} />
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
          </Card>

        </div>

        {/* ══ 右列: 预留区域 ══ */}
        <div style={{ flex: 1 }} />
      </div>
    </div>
  )
}
