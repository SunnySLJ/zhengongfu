import { useState, useEffect, useCallback, useRef } from "react";

const STAGES = [
  {
    id: "trend",
    num: "01",
    title: "热点感知",
    titleEn: "Trend Detection",
    icon: "🔥",
    desc: "分钟级扫描全网爆款趋势，主动捕捉流量风口",
    speed: "< 5 分钟",
    speedLabel: "响应速度",
    color: "#FF6B35",
    colorLight: "rgba(255,107,53,0.12)",
    techs: ["多平台数据抓取", "NLP 语义分析", "趋势预测算法"],
    platforms: ["抖音", "快手", "小红书"],
    metrics: { scanned: 0, hotTopics: 0, accuracy: 0 },
    metricsTarget: { scanned: 12847, hotTopics: 36, accuracy: 94.7 },
    metricsLabels: { scanned: "扫描话题", hotTopics: "热点捕获", accuracy: "准确率%" },
  },
  {
    id: "script",
    num: "02",
    title: "剧本创意",
    titleEn: "Script Generation",
    icon: "✍️",
    desc: "基于品牌调性自动生成高转化脚本",
    speed: "1000+ / 日",
    speedLabel: "创作效率",
    color: "#7B61FF",
    colorLight: "rgba(123,97,255,0.12)",
    techs: ["LLM 大模型生成", "SOUL.md 品牌学习", "A/B 测试优化"],
    platforms: ["GPT-4o", "Claude", "Gemini"],
    metrics: { generated: 0, convRate: 0, variants: 0 },
    metricsTarget: { generated: 1247, convRate: 8.3, variants: 3742 },
    metricsLabels: { generated: "已生成脚本", convRate: "转化率%", variants: "A/B变体" },
  },
  {
    id: "asset",
    num: "03",
    title: "素材匹配",
    titleEn: "Asset Matching",
    icon: "🎯",
    desc: "毫秒级调用私有素材库，音画同步自动对位",
    speed: "< 100ms",
    speedLabel: "匹配速度",
    color: "#00C9A7",
    colorLight: "rgba(0,201,167,0.12)",
    techs: ["向量数据库存储", "语义相似度匹配", "自动剪辑同步"],
    platforms: ["Milvus", "Pinecone", "Weaviate"],
    metrics: { matched: 0, avgTime: 0, library: 0 },
    metricsTarget: { matched: 8934, avgTime: 47, library: 284750 },
    metricsLabels: { matched: "已匹配素材", avgTime: "平均耗时ms", library: "素材库总量" },
  },
  {
    id: "produce",
    num: "04",
    title: "批量生产",
    titleEn: "Mass Production",
    icon: "🏭",
    desc: "工业化云端渲染，日产10万+原创视频",
    speed: "100,000+ / 日",
    speedLabel: "生产能力",
    color: "#FF4081",
    colorLight: "rgba(255,64,129,0.12)",
    techs: ["分布式渲染集群", "AI 混剪去重", "多分辨率适配"],
    platforms: ["AWS", "阿里云", "腾讯云"],
    metrics: { produced: 0, rendering: 0, dedup: 0 },
    metricsTarget: { produced: 104283, rendering: 847, dedup: 99.2 },
    metricsLabels: { produced: "今日产量", rendering: "渲染中", dedup: "去重率%" },
  },
  {
    id: "publish",
    num: "05",
    title: "定时上传",
    titleEn: "Scheduled Publishing",
    icon: "📡",
    desc: "模拟真人操作，自动跨平台多账号定时投放",
    speed: "65+ 平台",
    speedLabel: "支持平台",
    color: "#448AFF",
    colorLight: "rgba(68,138,255,0.12)",
    techs: ["多平台 API 对接", "智能发布优化", "差异化标题标签"],
    platforms: ["抖音", "快手", "B站", "小红书", "视频号", "YouTube"],
    metrics: { published: 0, accounts: 0, platforms: 0 },
    metricsTarget: { published: 87420, accounts: 342, platforms: 65 },
    metricsLabels: { published: "已发布", accounts: "活跃账号", platforms: "覆盖平台" },
  },
  {
    id: "analytics",
    num: "06",
    title: "数据分析",
    titleEn: "Data Analytics",
    icon: "📊",
    desc: "自动监测播放/转化数据，反向优化创意逻辑",
    speed: "+300%",
    speedLabel: "转化提升",
    color: "#FFB300",
    colorLight: "rgba(255,179,0,0.12)",
    techs: ["38项核心指标", "智能归因分析", "A/B 自动化测试"],
    platforms: ["播放量", "互动率", "转化率", "ROI"],
    metrics: { views: 0, engagement: 0, conversion: 0 },
    metricsTarget: { views: 48720000, engagement: 12.4, conversion: 4.7 },
    metricsLabels: { views: "总播放量", engagement: "互动率%", conversion: "转化率%" },
  },
];

function formatNum(n) {
  if (n >= 1e8) return (n / 1e8).toFixed(1) + "亿";
  if (n >= 1e4) return (n / 1e4).toFixed(1) + "万";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
  return typeof n === "number" ? (Number.isInteger(n) ? n.toString() : n.toFixed(1)) : n;
}

function PipelineNode({ stage, index, isActive, isRunning, onClick, animDelay }) {
  const [metrics, setMetrics] = useState({ ...stage.metrics });
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      const keys = Object.keys(stage.metricsTarget);
      intervalRef.current = setInterval(() => {
        setMetrics((prev) => {
          const next = { ...prev };
          let allDone = true;
          keys.forEach((k) => {
            const target = stage.metricsTarget[k];
            const step = Math.max(1, Math.ceil(target / 60));
            if (prev[k] < target) {
              next[k] = Math.min(prev[k] + step + Math.random() * step * 0.5, target);
              allDone = false;
            }
          });
          return next;
        });
      }, 50);
    } else if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const metricKeys = Object.keys(stage.metricsLabels);

  return (
    <div
      className={`pipeline-node ${isActive ? "active" : ""} ${isRunning ? "running" : ""}`}
      style={{
        "--node-color": stage.color,
        "--node-bg": stage.colorLight,
        animationDelay: `${animDelay}ms`,
      }}
      onClick={onClick}
    >
      <div className="node-header">
        <span className="node-num">{stage.num}</span>
        <span className="node-icon">{stage.icon}</span>
        {isRunning && <span className="pulse-dot" />}
      </div>

      <h3 className="node-title">{stage.title}</h3>
      <p className="node-title-en">{stage.titleEn}</p>
      <p className="node-desc">{stage.desc}</p>

      <div className="node-speed">
        <span className="speed-label">{stage.speedLabel}</span>
        <span className="speed-value">{stage.speed}</span>
      </div>

      <div className="node-techs">
        {stage.techs.map((t) => (
          <span key={t} className="tech-tag">{t}</span>
        ))}
      </div>

      <div className="node-metrics">
        {metricKeys.map((k) => (
          <div key={k} className="metric-item">
            <span className="metric-value">{formatNum(metrics[k])}</span>
            <span className="metric-label">{stage.metricsLabels[k]}</span>
          </div>
        ))}
      </div>

      {isActive && (
        <div className="node-platforms">
          {stage.platforms.map((p) => (
            <span key={p} className="platform-tag">{p}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function FlowArrow({ from, to, isActive }) {
  return (
    <div className={`flow-arrow ${isActive ? "active" : ""}`}>
      <div className="arrow-line">
        <div className="arrow-particle" />
      </div>
      <svg width="12" height="12" viewBox="0 0 12 12">
        <path d="M2 1L10 6L2 11" fill="currentColor" opacity="0.6" />
      </svg>
    </div>
  );
}

function TopBar({ pipelineRunning, onToggle, totalMetrics }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="top-bar">
      <div className="top-left">
        <div className="logo-mark">
          <span className="logo-icon">◆</span>
          <div>
            <h1 className="logo-title">AutoPipeline</h1>
            <p className="logo-sub">六位一体 · 无人值守流水线</p>
          </div>
        </div>
      </div>
      <div className="top-center">
        <div className="global-stats">
          <div className="stat-chip">
            <span className="stat-dot" style={{ background: "#00C9A7" }} />
            <span>日产量</span>
            <strong>{totalMetrics.daily}</strong>
          </div>
          <div className="stat-chip">
            <span className="stat-dot" style={{ background: "#448AFF" }} />
            <span>覆盖平台</span>
            <strong>65+</strong>
          </div>
          <div className="stat-chip">
            <span className="stat-dot" style={{ background: "#FFB300" }} />
            <span>核心指标</span>
            <strong>38项</strong>
          </div>
        </div>
      </div>
      <div className="top-right">
        <span className="time-display">
          {time.toLocaleTimeString("zh-CN", { hour12: false })}
        </span>
        <button
          className={`run-btn ${pipelineRunning ? "running" : ""}`}
          onClick={onToggle}
        >
          <span className="btn-icon">{pipelineRunning ? "⏸" : "▶"}</span>
          {pipelineRunning ? "暂停流水线" : "启动流水线"}
        </button>
      </div>
    </header>
  );
}

function LogPanel({ logs }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);

  return (
    <div className="log-panel">
      <div className="log-header">
        <span className="log-title">⚡ 实时日志</span>
        <span className="log-count">{logs.length} entries</span>
      </div>
      <div className="log-body" ref={ref}>
        {logs.map((l, i) => (
          <div key={i} className="log-entry" style={{ "--entry-color": l.color }}>
            <span className="log-time">{l.time}</span>
            <span className="log-stage">[{l.stage}]</span>
            <span className="log-msg">{l.msg}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="log-empty">点击「启动流水线」开始运行...</div>
        )}
      </div>
    </div>
  );
}

const LOG_TEMPLATES = [
  { stage: "热点感知", msgs: ["扫描抖音热搜榜 Top50...", "检测到新热点: #夏日穿搭挑战", "小红书趋势分析完成，发现12个潜力话题", "快手爆款视频语义分析中...", "NLP识别高频关键词: 旅行/美食/健身", "趋势预测: #露营季 未来48h将爆发"], color: "#FF6B35" },
  { stage: "剧本创意", msgs: ["基于热点生成脚本模板...", "SOUL.md品牌调性加载完成", "已生成15条高转化脚本变体", "A/B结构优化: Hook前置+CTA强化", "LLM创意脚本批量生成中...", "脚本质量评分: 8.7/10"], color: "#7B61FF" },
  { stage: "素材匹配", msgs: ["向量检索私有素材库...", "找到847条高相似度素材", "音画同步校准完成", "自动剪辑节奏匹配: BPM=120", "素材去水印处理中...", "语义匹配置信度: 96.3%"], color: "#00C9A7" },
  { stage: "批量生产", msgs: ["云端渲染集群启动 (32节点)", "正在渲染批次 #2847...", "AI混剪去重完成，独创率99.2%", "多分辨率输出: 1080p/720p/4K", "今日已完成渲染 104,283 条", "GPU利用率: 94.7%"], color: "#FF4081" },
  { stage: "定时上传", msgs: ["智能排期: 今日18:00-22:00高峰投放", "正在上传至抖音 (账号组A)...", "B站投放完成，覆盖3个分区", "小红书标题差异化处理中...", "已完成跨平台同步: 42/65", "模拟真人操作延迟: 随机2-8s"], color: "#448AFF" },
  { stage: "数据分析", msgs: ["采集昨日全平台播放数据...", "归因分析: 脚本类型A转化率+47%", "ROI实时计算完成: 5.8x", "A/B测试结论: 竖版>横版 (+23%)", "38项指标仪表盘已更新", "智能推荐: 增加美食类内容占比"], color: "#FFB300" },
];

export default function App() {
  const [activeStage, setActiveStage] = useState(null);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [runningStages, setRunningStages] = useState(new Set());
  const [logs, setLogs] = useState([]);
  const [view, setView] = useState("pipeline"); // pipeline | detail
  const logInterval = useRef(null);
  const stageInterval = useRef(null);

  const addLog = useCallback((stage, msg, color) => {
    const now = new Date();
    const time = now.toLocaleTimeString("zh-CN", { hour12: false }) + "." + String(now.getMilliseconds()).padStart(3, "0");
    setLogs((prev) => [...prev.slice(-80), { time, stage, msg, color }]);
  }, []);

  const startPipeline = useCallback(() => {
    setPipelineRunning(true);
    setRunningStages(new Set());
    setLogs([]);

    let stageIdx = 0;
    stageInterval.current = setInterval(() => {
      if (stageIdx < STAGES.length) {
        setRunningStages((prev) => new Set([...prev, STAGES[stageIdx].id]));
        stageIdx++;
      }
    }, 800);

    logInterval.current = setInterval(() => {
      const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
      const msg = template.msgs[Math.floor(Math.random() * template.msgs.length)];
      setLogs((prev) => {
        const now = new Date();
        const time = now.toLocaleTimeString("zh-CN", { hour12: false }) + "." + String(now.getMilliseconds()).padStart(3, "0");
        return [...prev.slice(-80), { time, stage: template.stage, msg, color: template.color }];
      });
    }, 600);
  }, []);

  const stopPipeline = useCallback(() => {
    setPipelineRunning(false);
    setRunningStages(new Set());
    clearInterval(logInterval.current);
    clearInterval(stageInterval.current);
  }, []);

  useEffect(() => () => { clearInterval(logInterval.current); clearInterval(stageInterval.current); }, []);

  return (
    <div className="app-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@300;400;600;800&display=swap');

        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

        .app-root {
          --bg-primary: #0A0E17;
          --bg-secondary: #111827;
          --bg-card: #161E2E;
          --bg-card-hover: #1C2640;
          --border: rgba(255,255,255,0.06);
          --border-active: rgba(255,255,255,0.15);
          --text-primary: #F0F2F5;
          --text-secondary: #8B95A5;
          --text-muted: #4A5568;
          --glow-spread: 40px;
          font-family: 'Noto Sans SC', 'Outfit', sans-serif;
          background: var(--bg-primary);
          color: var(--text-primary);
          min-height: 100vh;
          overflow-x: hidden;
        }

        .app-root::before {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background:
            radial-gradient(ellipse 80% 50% at 20% 0%, rgba(123,97,255,0.08) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(255,107,53,0.06) 0%, transparent 50%),
            radial-gradient(ellipse 40% 30% at 50% 50%, rgba(0,201,167,0.04) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }

        /* ---- TOP BAR ---- */
        .top-bar {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 28px;
          background: rgba(10,14,23,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .top-left { display: flex; align-items: center; gap: 12px; }
        .logo-mark { display: flex; align-items: center; gap: 10px; }
        .logo-icon {
          font-size: 22px; color: #7B61FF;
          filter: drop-shadow(0 0 8px rgba(123,97,255,0.5));
        }
        .logo-title {
          font-family: 'Outfit', sans-serif;
          font-size: 20px; font-weight: 800;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #F0F2F5, #7B61FF);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .logo-sub { font-size: 11px; color: var(--text-muted); letter-spacing: 2px; }

        .top-center { display: flex; gap: 8px; }
        .global-stats { display: flex; gap: 6px; }
        .stat-chip {
          display: flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 20px;
          background: var(--bg-secondary); border: 1px solid var(--border);
          font-size: 12px; color: var(--text-secondary);
        }
        .stat-chip strong { color: var(--text-primary); font-family: 'JetBrains Mono', monospace; font-size: 13px; }
        .stat-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .top-right { display: flex; align-items: center; gap: 14px; }
        .time-display {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px; color: var(--text-muted);
          letter-spacing: 1px;
        }
        .run-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 20px; border-radius: 10px;
          border: 1px solid rgba(123,97,255,0.3);
          background: linear-gradient(135deg, rgba(123,97,255,0.15), rgba(123,97,255,0.05));
          color: #B8A4FF; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.3s;
          font-family: 'Noto Sans SC', sans-serif;
        }
        .run-btn:hover {
          background: linear-gradient(135deg, rgba(123,97,255,0.3), rgba(123,97,255,0.1));
          border-color: rgba(123,97,255,0.5);
          box-shadow: 0 0 20px rgba(123,97,255,0.2);
        }
        .run-btn.running {
          border-color: rgba(255,64,129,0.4);
          background: linear-gradient(135deg, rgba(255,64,129,0.15), rgba(255,64,129,0.05));
          color: #FF80AB;
        }
        .btn-icon { font-size: 10px; }

        /* ---- SECTION LABELS ---- */
        .section-row {
          display: flex; align-items: center; gap: 16px;
          padding: 20px 28px 10px;
          position: relative; z-index: 1;
        }
        .section-badge {
          display: flex; align-items: center; gap: 6px;
          padding: 4px 14px; border-radius: 6px;
          font-size: 11px; font-weight: 600; letter-spacing: 1px;
          text-transform: uppercase;
        }
        .section-badge.upper {
          background: rgba(255,107,53,0.1); color: #FF6B35;
          border: 1px solid rgba(255,107,53,0.2);
        }
        .section-badge.lower {
          background: rgba(68,138,255,0.1); color: #448AFF;
          border: 1px solid rgba(68,138,255,0.2);
        }
        .section-line { flex: 1; height: 1px; background: var(--border); }
        .section-text { font-size: 12px; color: var(--text-muted); }

        /* ---- PIPELINE GRID ---- */
        .pipeline-section {
          padding: 0 28px 12px;
          position: relative; z-index: 1;
        }
        .pipeline-row {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr;
          gap: 0;
          align-items: stretch;
        }

        /* ---- NODE ---- */
        .pipeline-node {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
          animation: nodeEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: var(--anim-delay, 0ms);
        }
        @keyframes nodeEnter {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .pipeline-node::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--node-color), transparent);
          opacity: 0; transition: opacity 0.3s;
        }
        .pipeline-node:hover {
          border-color: var(--border-active);
          background: var(--bg-card-hover);
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.3), 0 0 var(--glow-spread) var(--node-bg);
        }
        .pipeline-node:hover::before { opacity: 1; }
        .pipeline-node.active {
          border-color: var(--node-color);
          box-shadow: 0 0 30px var(--node-bg), 0 8px 32px rgba(0,0,0,0.3);
        }
        .pipeline-node.active::before { opacity: 1; }
        .pipeline-node.running::after {
          content: '';
          position: absolute; top: 0; left: -100%; right: 0; bottom: 0;
          background: linear-gradient(90deg, transparent, var(--node-bg), transparent);
          animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
          to { left: 100%; }
        }

        .node-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .node-num {
          font-family: 'Outfit', sans-serif;
          font-size: 11px; font-weight: 600;
          color: var(--node-color); opacity: 0.7;
          letter-spacing: 2px;
        }
        .node-icon { font-size: 22px; }
        .pulse-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--node-color);
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 var(--node-bg); }
          50% { opacity: 0.7; box-shadow: 0 0 0 8px transparent; }
        }

        .node-title {
          font-size: 18px; font-weight: 700;
          margin-bottom: 2px;
        }
        .node-title-en {
          font-family: 'Outfit', sans-serif;
          font-size: 11px; color: var(--text-muted);
          letter-spacing: 1px; margin-bottom: 8px;
        }
        .node-desc {
          font-size: 12.5px; color: var(--text-secondary);
          line-height: 1.6; margin-bottom: 12px;
        }

        .node-speed {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 12px; border-radius: 8px;
          background: var(--node-bg); margin-bottom: 12px;
        }
        .speed-label { font-size: 11px; color: var(--text-muted); }
        .speed-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px; font-weight: 600; color: var(--node-color);
        }

        .node-techs { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 14px; }
        .tech-tag {
          padding: 3px 8px; border-radius: 4px;
          font-size: 10px; color: var(--text-secondary);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
        }

        .node-metrics {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
          padding-top: 12px; border-top: 1px solid var(--border);
        }
        .metric-item { text-align: center; }
        .metric-value {
          display: block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 15px; font-weight: 600; color: var(--text-primary);
        }
        .metric-label { font-size: 10px; color: var(--text-muted); }

        .node-platforms {
          display: flex; flex-wrap: wrap; gap: 4px; margin-top: 10px;
          padding-top: 10px; border-top: 1px solid var(--border);
        }
        .platform-tag {
          padding: 2px 8px; border-radius: 4px;
          font-size: 10px; font-weight: 500;
          color: var(--node-color); background: var(--node-bg);
        }

        /* ---- FLOW ARROW ---- */
        .flow-arrow {
          display: flex; align-items: center; gap: 0;
          padding: 0 6px; opacity: 0.3;
          transition: opacity 0.4s;
          color: var(--text-muted);
        }
        .flow-arrow.active { opacity: 1; }
        .arrow-line {
          width: 28px; height: 2px;
          background: rgba(255,255,255,0.15);
          position: relative; overflow: hidden;
          border-radius: 1px;
        }
        .flow-arrow.active .arrow-line { background: rgba(123,97,255,0.3); }
        .arrow-particle {
          position: absolute; top: -1px; left: -8px;
          width: 8px; height: 4px; border-radius: 2px;
          background: #7B61FF;
          opacity: 0;
        }
        .flow-arrow.active .arrow-particle {
          opacity: 1;
          animation: particleFlow 1.5s infinite;
        }
        @keyframes particleFlow {
          0% { left: -8px; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        .flow-arrow svg { color: var(--text-muted); }
        .flow-arrow.active svg { color: #7B61FF; }

        /* ---- LOG PANEL ---- */
        .log-panel {
          margin: 0 28px 28px;
          border-radius: 14px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          overflow: hidden;
          position: relative; z-index: 1;
        }
        .log-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 18px;
          border-bottom: 1px solid var(--border);
        }
        .log-title { font-size: 13px; font-weight: 600; }
        .log-count { font-size: 11px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }
        .log-body {
          height: 180px; overflow-y: auto;
          padding: 8px 0;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .log-entry {
          display: flex; gap: 10px; padding: 3px 18px;
          font-size: 12px; line-height: 1.7;
          animation: logIn 0.3s ease;
        }
        @keyframes logIn {
          from { opacity: 0; transform: translateX(-10px); }
        }
        .log-time { font-family: 'JetBrains Mono', monospace; color: var(--text-muted); font-size: 11px; flex-shrink: 0; }
        .log-stage { color: var(--entry-color); font-weight: 600; flex-shrink: 0; min-width: 70px; }
        .log-msg { color: var(--text-secondary); }
        .log-empty { padding: 40px; text-align: center; color: var(--text-muted); font-size: 13px; }

        /* ---- DETAIL PANEL ---- */
        .detail-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
          z-index: 200; display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } }
        .detail-card {
          width: 560px; max-height: 80vh;
          background: var(--bg-card); border: 1px solid var(--border-active);
          border-radius: 20px; padding: 32px;
          position: relative; overflow-y: auto;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.96); }
        }
        .detail-close {
          position: absolute; top: 16px; right: 16px;
          width: 32px; height: 32px; border-radius: 8px;
          border: 1px solid var(--border); background: var(--bg-secondary);
          color: var(--text-secondary); font-size: 16px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .detail-close:hover { background: var(--bg-card-hover); color: var(--text-primary); }
        .detail-num {
          font-family: 'Outfit', sans-serif;
          font-size: 48px; font-weight: 800;
          background: linear-gradient(135deg, var(--node-color), transparent);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          opacity: 0.3; line-height: 1;
        }
        .detail-title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
        .detail-title { font-size: 26px; font-weight: 900; }
        .detail-icon { font-size: 28px; }
        .detail-en { font-family: 'Outfit', sans-serif; font-size: 13px; color: var(--text-muted); letter-spacing: 2px; margin-bottom: 16px; }
        .detail-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.8; margin-bottom: 24px; }

        .detail-section-label {
          font-size: 11px; font-weight: 600; color: var(--text-muted);
          letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px;
        }
        .detail-tech-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
          margin-bottom: 24px;
        }
        .detail-tech-item {
          padding: 10px 14px; border-radius: 10px;
          background: var(--node-bg); text-align: center;
          font-size: 12px; font-weight: 500;
          color: var(--node-color);
          border: 1px solid rgba(255,255,255,0.04);
        }
        .detail-metrics-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
          margin-bottom: 24px;
        }
        .detail-metric-card {
          padding: 14px; border-radius: 10px;
          background: var(--bg-secondary); text-align: center;
          border: 1px solid var(--border);
        }
        .detail-metric-val {
          font-family: 'JetBrains Mono', monospace;
          font-size: 20px; font-weight: 600; color: var(--node-color);
        }
        .detail-metric-lbl { font-size: 11px; color: var(--text-muted); margin-top: 4px; }

        .detail-speed-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px; border-radius: 12px;
          background: var(--node-bg);
          border: 1px solid rgba(255,255,255,0.04);
        }
        .detail-speed-label { font-size: 12px; color: var(--text-secondary); }
        .detail-speed-val {
          font-family: 'JetBrains Mono', monospace;
          font-size: 18px; font-weight: 700; color: var(--node-color);
        }

        /* ---- FOOTER ---- */
        .footer {
          text-align: center; padding: 20px;
          font-size: 11px; color: var(--text-muted);
          position: relative; z-index: 1;
          border-top: 1px solid var(--border);
          margin: 0 28px;
        }
        .footer-flow {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; margin-bottom: 8px; flex-wrap: wrap;
        }
        .footer-step {
          padding: 3px 10px; border-radius: 4px;
          font-size: 10px; font-weight: 600;
          border: 1px solid var(--border);
          color: var(--text-secondary);
        }
        .footer-arrow { color: var(--text-muted); font-size: 10px; }

        /* ---- RESPONSIVE ---- */
        @media (max-width: 1100px) {
          .pipeline-row { grid-template-columns: 1fr; gap: 8px; }
          .flow-arrow { transform: rotate(90deg); justify-content: center; padding: 4px 0; }
          .global-stats { display: none; }
        }
      `}</style>

      <TopBar
        pipelineRunning={pipelineRunning}
        onToggle={pipelineRunning ? stopPipeline : startPipeline}
        totalMetrics={{ daily: "10万+" }}
      />

      {/* Upper Pipeline */}
      <div className="section-row">
        <span className="section-badge upper">▲ 上游</span>
        <span className="section-text">从热点感知到素材匹配的智能生产流程</span>
        <div className="section-line" />
      </div>
      <div className="pipeline-section">
        <div className="pipeline-row">
          {STAGES.slice(0, 3).map((stage, i) => (
            <>
              {i > 0 && (
                <FlowArrow
                  key={`arrow-${i}`}
                  isActive={runningStages.has(STAGES[i - 1].id) && runningStages.has(stage.id)}
                />
              )}
              <PipelineNode
                key={stage.id}
                stage={stage}
                index={i}
                isActive={activeStage === stage.id}
                isRunning={runningStages.has(stage.id)}
                animDelay={i * 120}
                onClick={() => setActiveStage(activeStage === stage.id ? null : stage.id)}
              />
            </>
          ))}
        </div>
      </div>

      {/* Lower Pipeline */}
      <div className="section-row">
        <span className="section-badge lower">▼ 下游</span>
        <span className="section-text">从批量生产到数据分析的完整工作流</span>
        <div className="section-line" />
      </div>
      <div className="pipeline-section">
        <div className="pipeline-row">
          {STAGES.slice(3, 6).map((stage, i) => (
            <>
              {i > 0 && (
                <FlowArrow
                  key={`arrow-${i + 3}`}
                  isActive={runningStages.has(STAGES[i + 2].id) && runningStages.has(stage.id)}
                />
              )}
              <PipelineNode
                key={stage.id}
                stage={stage}
                index={i + 3}
                isActive={activeStage === stage.id}
                isRunning={runningStages.has(stage.id)}
                animDelay={(i + 3) * 120}
                onClick={() => setActiveStage(activeStage === stage.id ? null : stage.id)}
              />
            </>
          ))}
        </div>
      </div>

      {/* Log Panel */}
      <LogPanel logs={logs} />

      {/* Footer */}
      <div className="footer">
        <div className="footer-flow">
          {STAGES.map((s, i) => (
            <>
              <span className="footer-step" key={s.id} style={{ color: s.color, borderColor: s.color + "40" }}>
                {s.icon} {s.title}
              </span>
              {i < 5 && <span className="footer-arrow" key={`fa-${i}`}>→</span>}
            </>
          ))}
        </div>
        六位一体 · 无人值守流水线 — 自循环增长飞轮
      </div>

      {/* Detail Modal */}
      {activeStage && (() => {
        const s = STAGES.find((x) => x.id === activeStage);
        if (!s) return null;
        const mKeys = Object.keys(s.metricsLabels);
        return (
          <div className="detail-overlay" onClick={() => setActiveStage(null)}>
            <div className="detail-card" style={{ "--node-color": s.color, "--node-bg": s.colorLight }} onClick={(e) => e.stopPropagation()}>
              <button className="detail-close" onClick={() => setActiveStage(null)}>✕</button>
              <div className="detail-num">{s.num}</div>
              <div className="detail-title-row">
                <span className="detail-title">{s.title}</span>
                <span className="detail-icon">{s.icon}</span>
              </div>
              <div className="detail-en">{s.titleEn}</div>
              <div className="detail-desc">{s.desc}</div>

              <div className="detail-section-label">技术实现</div>
              <div className="detail-tech-grid">
                {s.techs.map((t) => <div className="detail-tech-item" key={t}>{t}</div>)}
              </div>

              <div className="detail-section-label">核心指标</div>
              <div className="detail-metrics-grid">
                {mKeys.map((k) => (
                  <div className="detail-metric-card" key={k}>
                    <div className="detail-metric-val">{formatNum(s.metricsTarget[k])}</div>
                    <div className="detail-metric-lbl">{s.metricsLabels[k]}</div>
                  </div>
                ))}
              </div>

              <div className="detail-section-label">性能指标</div>
              <div className="detail-speed-bar">
                <span className="detail-speed-label">{s.speedLabel}</span>
                <span className="detail-speed-val">{s.speed}</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
