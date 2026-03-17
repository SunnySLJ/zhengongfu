import { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Input,
  Select,
  Tag,
  Slider,
  Progress,
  Empty,
  message,
  Divider,
  Radio,
  Tabs,
  Spin,
  Tooltip,
} from 'antd'
import {
  VideoCameraAddOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  RedoOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  CopyOutlined,
  RightOutlined,
  BulbOutlined,
  FireOutlined,
} from '@ant-design/icons'
import { genStoryboard } from '../../services/zhengongfuApi'
import type { StoryboardScript, StoryboardShot } from '../../services/zhengongfuApi'

const { TextArea } = Input

// ─── 视频生成 types ────────────────────────────────────────────────────────────
interface GenTask {
  id: string
  script: string
  style: string
  duration: number
  status: 'pending' | 'processing' | 'done'
  progress: number
  createdAt: string
}

// ─── 常量 ──────────────────────────────────────────────────────────────────────
const STYLE_OPTIONS = [
  { value: 'real', label: '真实风格' },
  { value: 'anime', label: '动漫风格' },
  { value: 'cinematic', label: '电影感' },
  { value: 'vlog', label: 'Vlog风' },
  { value: 'product', label: '产品展示' },
]

const VOICE_OPTIONS = [
  { value: 'female1', label: '甜美女声' },
  { value: 'female2', label: '知性女声' },
  { value: 'male1', label: '磁性男声' },
  { value: 'male2', label: '活力男声' },
  { value: 'none', label: '不添加配音' },
]

const RATIO_OPTIONS = [
  { value: '9:16', label: '9:16 竖屏' },
  { value: '16:9', label: '16:9 横屏' },
  { value: '1:1', label: '1:1 方形' },
]

const PLATFORM_OPTIONS = [
  { value: '抖音/小红书', label: '抖音 + 小红书' },
  { value: '抖音', label: '抖音' },
  { value: '小红书', label: '小红书' },
  { value: 'YouTube', label: 'YouTube' },
  { value: 'TikTok', label: 'TikTok' },
]

const VISUAL_STYLE_OPTIONS = [
  { value: '电影级写实', label: '电影级写实' },
  { value: '高端商业广告', label: '高端商业广告' },
  { value: '治愈系轻奢', label: '治愈系轻奢' },
  { value: '赛博朋克', label: '赛博朋克' },
  { value: '日系清新', label: '日系清新' },
  { value: '动画风', label: '动画风' },
]

const DURATION_OPTIONS = [
  { value: '15秒', label: '15 秒' },
  { value: '30秒', label: '30 秒' },
  { value: '45秒', label: '45 秒' },
  { value: '60秒', label: '60 秒' },
]

const BAB_COLORS: Record<string, string> = {
  Before: '#ff4d4f',
  After: '#52c41a',
  Bridge: '#1677ff',
  CTA: '#fa8c16',
}

// ─── 分镜脚本卡片 ──────────────────────────────────────────────────────────────
function ShotRow({ shot }: { shot: StoryboardShot }) {
  function copyPrompt() {
    navigator.clipboard.writeText(shot.sora_prompt)
    message.success('Sora 提示词已复制')
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 52px 68px 1fr 1fr',
        gap: 8,
        alignItems: 'start',
        padding: '8px 0',
        borderBottom: '1px solid #f0f0f0',
        fontSize: 12,
      }}
    >
      <div style={{ color: '#999', textAlign: 'center', paddingTop: 2 }}>#{shot.number}</div>
      <div style={{ color: '#666' }}>{shot.duration}</div>
      <div>
        <Tag
          style={{
            fontSize: 10,
            color: BAB_COLORS[shot.bab_phase] ?? '#666',
            background: (BAB_COLORS[shot.bab_phase] ?? '#666') + '18',
            border: `1px solid ${(BAB_COLORS[shot.bab_phase] ?? '#666')}40`,
          }}
        >
          {shot.bab_phase}
        </Tag>
      </div>
      <div>
        <div style={{ color: '#333', marginBottom: 4 }}>{shot.scene_cn}</div>
        <div style={{ color: '#888', fontSize: 11 }}>「{shot.voiceover}」</div>
      </div>
      <div style={{ position: 'relative' }}>
        <div
          style={{
            background: '#f6f8fa',
            border: '1px solid #e8e8e8',
            borderRadius: 4,
            padding: '6px 28px 6px 8px',
            fontSize: 11,
            color: '#555',
            fontFamily: 'monospace',
            lineHeight: 1.5,
            wordBreak: 'break-all',
          }}
        >
          {shot.sora_prompt}
        </div>
        <Tooltip title="复制 Sora 提示词">
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={copyPrompt}
            style={{ position: 'absolute', top: 4, right: 4, fontSize: 12, color: '#999' }}
          />
        </Tooltip>
      </div>
    </div>
  )
}

function ScriptCard({
  script,
  onUse,
}: {
  script: StoryboardScript
  onUse: (s: StoryboardScript) => void
}) {
  function copyAllPrompts() {
    const all = script.shots.map((s) => `Shot ${s.number} (${s.duration}):\n${s.sora_prompt}`).join('\n\n')
    navigator.clipboard.writeText(all)
    message.success('所有 Sora 提示词已复制')
  }

  return (
    <Card
      size="small"
      style={{ marginBottom: 16, border: '1px solid #e8e8e8' }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag color="blue" style={{ fontSize: 11 }}>
            脚本 #{script.index}
          </Tag>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{script.angle}</span>
        </div>
      }
      extra={
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="small" icon={<CopyOutlined />} onClick={copyAllPrompts}>
            复制全部提示词
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<RightOutlined />}
            onClick={() => onUse(script)}
            style={{ background: 'linear-gradient(135deg, #ff4d4f, #ff7a45)', border: 'none' }}
          >
            使用此脚本
          </Button>
        </div>
      }
    >
      {/* 钩子 + 情绪弧线 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div
          style={{
            flex: 1,
            minWidth: 200,
            background: 'linear-gradient(135deg, #fff7e6, #fff2e8)',
            border: '1px solid #ffbb96',
            borderRadius: 6,
            padding: '8px 12px',
          }}
        >
          <div style={{ fontSize: 11, color: '#fa8c16', fontWeight: 600, marginBottom: 4 }}>
            🎣 营销钩子
          </div>
          <div style={{ fontSize: 13, color: '#333' }}>{script.hook}</div>
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 200,
            background: '#f6f8fa',
            border: '1px solid #e8e8e8',
            borderRadius: 6,
            padding: '8px 12px',
          }}
        >
          <div style={{ fontSize: 11, color: '#666', fontWeight: 600, marginBottom: 4 }}>
            💫 情绪弧线
          </div>
          <div style={{ fontSize: 12, color: '#555' }}>{script.emotion_arc}</div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{script.audience_trigger}</div>
        </div>
      </div>

      {/* 分镜表头 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '36px 52px 68px 1fr 1fr',
          gap: 8,
          padding: '6px 0',
          borderBottom: '2px solid #f0f0f0',
          fontSize: 11,
          fontWeight: 600,
          color: '#888',
        }}
      >
        <div style={{ textAlign: 'center' }}>#</div>
        <div>时长</div>
        <div>阶段</div>
        <div>画面 / 旁白</div>
        <div>Sora 提示词</div>
      </div>

      {/* 分镜行 */}
      {script.shots.map((shot) => (
        <ShotRow key={shot.number} shot={shot} />
      ))}

      {/* 标签 */}
      <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {script.hashtags.map((tag) => (
          <Tag key={tag} style={{ fontSize: 11, color: '#1677ff' }}>
            {tag}
          </Tag>
        ))}
      </div>
    </Card>
  )
}

// ─── Tab 1: AI 分镜脚本生成 ────────────────────────────────────────────────────
function StoryboardTab({ onUseScript }: { onUseScript: (prompt: string) => void }) {
  const [industryContent, setIndustryContent] = useState('')
  const [hotTrend, setHotTrend] = useState('')
  const [platform, setPlatform] = useState('抖音/小红书')
  const [visualStyle, setVisualStyle] = useState('电影级写实')
  const [duration, setDuration] = useState('30秒')
  const [loading, setLoading] = useState(false)
  const [insight, setInsight] = useState('')
  const [scripts, setScripts] = useState<StoryboardScript[]>([])
  const [marketingTips, setMarketingTips] = useState<{ ab_test: string; platform_tips: string; best_time: string } | null>(null)

  async function handleGenerate() {
    if (!industryContent.trim()) {
      message.warning('请输入行业相关内容')
      return
    }
    if (!hotTrend.trim()) {
      message.warning('请输入爆款热点')
      return
    }
    setLoading(true)
    setScripts([])
    setInsight('')
    setMarketingTips(null)
    try {
      const result = await genStoryboard(industryContent, hotTrend, platform, visualStyle, duration)
      if (result.error) throw new Error(result.error)
      setInsight(result.insight ?? '')
      setScripts(result.scripts ?? [])
      setMarketingTips(result.marketing_tips ?? null)
      message.success(`生成完成！共 ${result.scripts?.length ?? 0} 段分镜脚本`)
    } catch (err: unknown) {
      message.error(`生成失败：${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  function handleUse(script: StoryboardScript) {
    const prompts = script.shots.map((s) => `Shot ${s.number} (${s.duration}): ${s.sora_prompt}`).join('\n')
    onUseScript(prompts)
    message.success('已填入视频生成区，切换到「视频生成」标签使用')
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 20, alignItems: 'start' }}>
        {/* 左：输入区 */}
        <div>
          <Card title="输入内容" size="small" style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 500, marginBottom: 6, fontSize: 13 }}>
                行业相关内容 <span style={{ color: '#ff4d4f' }}>*</span>
              </div>
              <TextArea
                value={industryContent}
                onChange={(e) => setIndustryContent(e.target.value)}
                placeholder="输入行业背景、产品特点、品牌故事、目标用户…&#10;&#10;例：我们是一家专注抗衰美容的护肤品牌，核心成分玻色因+视黄醇，目标用户28-40岁女性，主打「30岁不是终点」的品牌理念。"
                autoSize={{ minRows: 5, maxRows: 10 }}
                showCount
                maxLength={2000}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 500, marginBottom: 6, fontSize: 13 }}>
                近期爆款热点 <span style={{ color: '#ff4d4f' }}>*</span>
              </div>
              <TextArea
                value={hotTrend}
                onChange={(e) => setHotTrend(e.target.value)}
                placeholder="输入当前爆款话题、热点事件或流行趋势…&#10;&#10;例：#中年女性逆袭穿搭 登上热搜，阅读量2.3亿，评论区满是「终于有人懂我」。"
                autoSize={{ minRows: 3, maxRows: 6 }}
                showCount
                maxLength={500}
              />
            </div>
          </Card>

          <Card title="生成配置" size="small" style={{ marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>目标平台</div>
                <Select
                  value={platform}
                  onChange={setPlatform}
                  options={PLATFORM_OPTIONS}
                  style={{ width: '100%' }}
                  size="small"
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>视觉风格</div>
                <Select
                  value={visualStyle}
                  onChange={setVisualStyle}
                  options={VISUAL_STYLE_OPTIONS}
                  style={{ width: '100%' }}
                  size="small"
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>视频时长</div>
                <Select
                  value={duration}
                  onChange={setDuration}
                  options={DURATION_OPTIONS}
                  style={{ width: '100%' }}
                  size="small"
                />
              </div>
            </div>
          </Card>

          <Button
            type="primary"
            icon={loading ? <LoadingOutlined /> : <ThunderboltOutlined />}
            size="large"
            onClick={handleGenerate}
            disabled={loading}
            block
            style={{ background: 'linear-gradient(135deg, #722ed1, #1677ff)', border: 'none', height: 44 }}
          >
            {loading ? 'AI 正在生成分镜脚本…' : '生成 3 段 AI 分镜脚本'}
          </Button>
        </div>

        {/* 右：结果区 */}
        <div>
          {loading && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#999' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16, fontSize: 14 }}>AI 正在分析热点并生成分镜脚本…</div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#bbb' }}>
                使用 RASCEF + Atomic Prompting + BAB 框架
              </div>
            </div>
          )}

          {!loading && scripts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#ccc' }}>
              <BulbOutlined style={{ fontSize: 48, marginBottom: 12 }} />
              <div style={{ fontSize: 14 }}>输入行业内容和热点后点击生成</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>AI 将为你生成 3 段差异化分镜脚本</div>
            </div>
          )}

          {!loading && scripts.length > 0 && (
            <>
              {/* 洞察摘要 */}
              {insight && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, #f0f5ff, #f9f0ff)',
                    border: '1px solid #d3adf7',
                    borderRadius: 8,
                    padding: '10px 14px',
                    marginBottom: 16,
                    fontSize: 13,
                    color: '#555',
                  }}
                >
                  <FireOutlined style={{ color: '#722ed1', marginRight: 6 }} />
                  <strong style={{ color: '#722ed1' }}>热点 × 行业洞察：</strong>
                  {insight}
                </div>
              )}

              {/* 脚本卡片 */}
              {scripts.map((script) => (
                <ScriptCard key={script.index} script={script} onUse={handleUse} />
              ))}

              {/* 营销建议 */}
              {marketingTips && (
                <Card
                  size="small"
                  title="💡 营销优化建议"
                  style={{ background: '#fffbe6', border: '1px solid #ffe58f' }}
                >
                  <div style={{ fontSize: 12, color: '#666', lineHeight: 1.8 }}>
                    <div>
                      <strong>A/B 测试：</strong>
                      {marketingTips.ab_test}
                    </div>
                    <div>
                      <strong>平台适配：</strong>
                      {marketingTips.platform_tips}
                    </div>
                    <div>
                      <strong>发布时间：</strong>
                      {marketingTips.best_time}
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tab 2: Sora 视频生成 ──────────────────────────────────────────────────────
function VideoGenTab({ initialScript }: { initialScript: string }) {
  const [script, setScript] = useState(initialScript)
  const [style, setStyle] = useState('real')
  const [voice, setVoice] = useState('female1')
  const [ratio, setRatio] = useState('9:16')
  const [duration, setDuration] = useState(15)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (initialScript) setScript(initialScript)
  }, [initialScript])

  const [history, setHistory] = useState<GenTask[]>([
    {
      id: 'h1',
      script: '春天来了，万物复苏，樱花盛开，粉色的花瓣随风飘落…',
      style: '真实风格',
      duration: 15,
      status: 'done',
      progress: 100,
      createdAt: '2025-03-14 16:22',
    },
    {
      id: 'h2',
      script: '新品上市！限时优惠，全场8折，错过再等一年…',
      style: '产品展示',
      duration: 30,
      status: 'done',
      progress: 100,
      createdAt: '2025-03-14 14:10',
    },
  ])

  function handleGenerate() {
    if (!script.trim()) {
      message.warning('请输入视频脚本')
      return
    }

    const task: GenTask = {
      id: 'g_' + Date.now(),
      script,
      style: STYLE_OPTIONS.find((s) => s.value === style)?.label ?? style,
      duration,
      status: 'processing',
      progress: 0,
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    }

    setHistory((prev) => [task, ...prev])
    setGenerating(true)
    setProgress(0)

    let p = 0
    const timer = setInterval(() => {
      p += Math.random() * 8 + 3
      if (p >= 100) {
        p = 100
        clearInterval(timer)
        setGenerating(false)
        setProgress(100)
        setHistory((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: 'done', progress: 100 } : t)),
        )
        message.success('视频生成完成！')
      } else {
        setProgress(Math.floor(p))
        setHistory((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, progress: Math.floor(p) } : t)),
        )
      }
    }, 300)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
      {/* Left: editor */}
      <div>
        <Card title="脚本编辑" style={{ marginBottom: 16 }}>
          <TextArea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="输入视频文案脚本，支持分镜描述。&#10;&#10;例：&#10;【镜头一】清晨的咖啡馆，阳光透过玻璃洒在木桌上…&#10;【镜头二】主角端起咖啡，微微一笑…&#10;&#10;也可在「AI分镜生成」标签中生成后点击「使用此脚本」自动填入。"
            autoSize={{ minRows: 8, maxRows: 16 }}
            showCount
            maxLength={2000}
            style={{ marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['早安氛围', '产品种草', '旅行日记', '美食探店', '励志正能量'].map((tag) => (
              <Tag
                key={tag}
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  setScript((prev) =>
                    prev ? prev + '\n' + tag + '风格的短视频脚本' : tag + '风格的短视频脚本',
                  )
                }
              >
                + {tag}
              </Tag>
            ))}
          </div>
        </Card>

        <Card title="风格配置">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>画面风格</div>
              <Select value={style} onChange={setStyle} options={STYLE_OPTIONS} style={{ width: '100%' }} />
            </div>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>AI 配音</div>
              <Select value={voice} onChange={setVoice} options={VOICE_OPTIONS} style={{ width: '100%' }} />
            </div>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>画面比例</div>
              <Radio.Group value={ratio} onChange={(e) => setRatio(e.target.value)}>
                {RATIO_OPTIONS.map((r) => (
                  <Radio.Button key={r.value} value={r.value} style={{ fontSize: 12 }}>
                    {r.label}
                  </Radio.Button>
                ))}
              </Radio.Group>
            </div>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>
                视频时长：<span style={{ color: '#ff4d4f' }}>{duration}s</span>
              </div>
              <Slider
                min={10}
                max={60}
                step={5}
                value={duration}
                onChange={setDuration}
                marks={{ 10: '10s', 30: '30s', 60: '60s' }}
              />
            </div>
          </div>

          <Divider />

          {generating ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <LoadingOutlined style={{ color: '#1677ff' }} />
                <span>AI 正在生成视频…</span>
                <span style={{ color: '#999', fontSize: 12 }}>{progress}%</span>
              </div>
              <Progress percent={progress} strokeColor={{ from: '#ff4d4f', to: '#ff7a45' }} />
            </div>
          ) : (
            <Button
              type="primary"
              icon={<VideoCameraAddOutlined />}
              size="large"
              onClick={handleGenerate}
              style={{ background: 'linear-gradient(135deg, #ff4d4f, #ff7a45)', border: 'none' }}
            >
              立即生成视频
            </Button>
          )}
        </Card>
      </div>

      {/* Right: history */}
      <div>
        <Card title="生成记录" styles={{ body: { padding: 0 } }}>
          {history.length === 0 ? (
            <Empty description="暂无记录" style={{ padding: 32 }} />
          ) : (
            history.map((task, i) => (
              <div
                key={task.id}
                style={{
                  padding: '14px 16px',
                  borderBottom: i < history.length - 1 ? '1px solid #f5f5f5' : undefined,
                }}
              >
                <div
                  style={{
                    height: 80,
                    background: 'linear-gradient(135deg, #f0f0f0, #e8e8e8)',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                    color: '#bbb',
                    fontSize: 24,
                    position: 'relative',
                  }}
                >
                  {task.status === 'done' ? <PlayCircleOutlined /> : <LoadingOutlined />}
                  {task.status === 'done' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        background: '#52c41a',
                        borderRadius: 4,
                        padding: '1px 6px',
                        color: '#fff',
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <CheckCircleOutlined />完成
                    </div>
                  )}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: '#555',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: 4,
                  }}
                >
                  {task.script}
                </div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                  <Tag style={{ fontSize: 11 }}>{task.style}</Tag>
                  <Tag style={{ fontSize: 11 }}>{task.duration}s</Tag>
                </div>

                {task.status === 'processing' && (
                  <Progress percent={task.progress} size="small" showInfo={false} style={{ marginBottom: 6 }} />
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#bbb', fontSize: 11 }}>{task.createdAt}</span>
                  {task.status === 'done' && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Button type="text" size="small" icon={<DownloadOutlined />} style={{ fontSize: 12 }} />
                      <Button type="text" size="small" icon={<RedoOutlined />} style={{ fontSize: 12 }} />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  )
}

// ─── 主页面 ────────────────────────────────────────────────────────────────────
export default function VideoGenPage() {
  const [activeTab, setActiveTab] = useState('storyboard')
  const [pendingScript, setPendingScript] = useState('')

  function handleUseScript(prompt: string) {
    setPendingScript(prompt)
    setActiveTab('videogen')
  }

  const tabItems = [
    {
      key: 'storyboard',
      label: (
        <span>
          <ThunderboltOutlined />
          AI 分镜脚本生成
        </span>
      ),
      children: <StoryboardTab onUseScript={handleUseScript} />,
    },
    {
      key: 'videogen',
      label: (
        <span>
          <VideoCameraAddOutlined />
          Sora 视频生成
        </span>
      ),
      children: <VideoGenTab initialScript={pendingScript} />,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>视频生成</h2>
        <p style={{ margin: '4px 0 0', color: '#999', fontSize: 13 }}>
          AI 智能分析行业内容与热点，自动生成 Sora 分镜脚本，一键驱动视频生成
        </p>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
        style={{ background: '#fff', borderRadius: 8, padding: '0 0 16px' }}
      />
    </div>
  )
}
