import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import * as recharts from "recharts";
const { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } = recharts;

// ─── MOCK DATA: Full Content Collection ─────────────────────────
const PLATFORMS = [
  { id: "all", name: "全平台", icon: "◉", color: "#FF6B35" },
  { id: "douyin", name: "抖音", icon: "♪", color: "#FE2C55" },
  { id: "kuaishou", name: "快手", icon: "⚡", color: "#FF4906" },
  { id: "xiaohongshu", name: "小红书", icon: "📕", color: "#FF2442" },
  { id: "weibo", name: "微博", icon: "◆", color: "#FF8200" },
  { id: "bilibili", name: "B站", icon: "▶", color: "#00A1D6" },
];

const TREND_DATA = [
  {
    id: "t1", topic: "#夏日冰饮DIY", cat: "美食", heat: 98, growth: 247, vol: "2.4亿", platform: "douyin", status: "爆发",
    themes: [
      { title: "3步自制水果茶", angle: "极简教程", score: 96 },
      { title: "便利店材料挑战", angle: "省钱测评", score: 91 },
      { title: "颜值冰饮合集", angle: "视觉种草", score: 88 },
      { title: "冰饮翻车现场", angle: "搞笑反转", score: 84 },
    ],
    copies: [
      { text: "姐妹们！这杯我真的喝哭了😭 3块钱成本吊打某雪的冰杯，配方放评论区！", likes: "47.2万", type: "hook", source: "douyin", author: "@甜甜的厨房" },
      { text: "便利店花18块买齐所有材料，做出6杯不同口味的水果茶，老板看了都沉默", likes: "38.6万", type: "hook", source: "douyin", author: "@省钱小天才" },
      { text: "⚠️别再买奶茶了！教你在家5分钟搞定，成本不到3块，比蜜雪冰城还好喝", likes: "29.1万", type: "title", source: "kuaishou", author: "@美食侦探" },
      { text: "🧊夏日续命冰饮｜零失败配方｜一口入夏的感觉太绝了", likes: "22.4万", type: "title", source: "xiaohongshu", author: "@日食记" },
      { text: "拒绝科技与狠活！纯天然水果冰饮，孕妇小孩都能喝，建议所有人收藏", likes: "18.9万", type: "hook", source: "douyin", author: "@营养师小白" },
      { text: "我妈看完这个视频，再也没给我买过奶茶... 因为她自己做的更好喝😂", likes: "15.3万", type: "story", source: "douyin", author: "@小鱼日记" },
    ],
    tags: ["#夏日冰饮", "#自制饮品", "#省钱攻略", "#夏天的第一杯", "#冰饮DIY", "#水果茶", "#居家美食"],
    nlpKeywords: ["冰饮", "DIY", "水果茶", "配方", "夏日", "省钱", "自制"],
    sentiment: 94,
    contentPattern: { hook比例: "42%", 教程比例: "35%", 种草比例: "23%" },
  },
  {
    id: "t2", topic: "#极简穿搭公式", cat: "穿搭", heat: 94, growth: 182, vol: "1.8亿", platform: "xiaohongshu", status: "爆发",
    themes: [
      { title: "一衣多穿7天不重样", angle: "实用教程", score: 95 },
      { title: "通勤穿搭模板", angle: "职场刚需", score: 92 },
      { title: "胶囊衣橱计划", angle: "理念输出", score: 87 },
      { title: "极简≠无聊", angle: "观点碰撞", score: 83 },
    ],
    copies: [
      { text: "终于有人说清楚了！上班穿搭就记住这3个公式，闭眼搭都不会出错👔", likes: "52.1万", type: "hook", source: "xiaohongshu", author: "@职场穿搭手册" },
      { text: "扔掉满柜子的衣服吧！只留这10件，一整年都够穿还天天被夸好看", likes: "41.8万", type: "hook", source: "xiaohongshu", author: "@断舍离日记" },
      { text: "我用5件基础款搭出了30套look | 通勤约会全搞定 | 附搭配公式", likes: "36.2万", type: "title", source: "xiaohongshu", author: "@CC的衣橱" },
      { text: "穿搭小白必看！记住"1+1+1"法则，从此告别选择困难症", likes: "28.7万", type: "hook", source: "douyin", author: "@穿搭博主Lily" },
      { text: "别再乱买了！极简穿搭的核心就这4个字：质感+剪裁", likes: "21.5万", type: "hook", source: "weibo", author: "@时尚洞察" },
    ],
    tags: ["#极简穿搭", "#通勤穿搭", "#穿搭公式", "#胶囊衣橱", "#一衣多穿", "#OOTD"],
    nlpKeywords: ["极简", "公式", "通勤", "基础款", "百搭", "胶囊衣橱"],
    sentiment: 91,
    contentPattern: { hook比例: "48%", 教程比例: "32%", 种草比例: "20%" },
  },
  {
    id: "t3", topic: "#AI绘画变装", cat: "科技", heat: 92, growth: 312, vol: "3.1亿", platform: "douyin", status: "爆发",
    themes: [
      { title: "一键变身二次元", angle: "特效展示", score: 97 },
      { title: "AI vs 真人对比", angle: "对比反差", score: 93 },
      { title: "用AI给爸妈画画像", angle: "情感共鸣", score: 90 },
      { title: "AI绘画翻车合集", angle: "搞笑", score: 86 },
    ],
    copies: [
      { text: "用AI把自己变成动漫角色，结果我妈看到直接问这是谁家的闺女😂", likes: "89.3万", type: "hook", source: "douyin", author: "@AI实验室" },
      { text: "⚡实测最火AI变装特效，7个软件对比，最后一个绝了！", likes: "67.1万", type: "title", source: "douyin", author: "@科技老王" },
      { text: "帮我奶奶用AI画了一张年轻时的照片，她看完哭了...👵", likes: "54.8万", type: "story", source: "douyin", author: "@温暖日常" },
      { text: "AI变装挑战：输入「赛博朋克」风格，我的照片直接封神", likes: "42.6万", type: "hook", source: "kuaishou", author: "@赛博玩家" },
      { text: "2024最全AI绘画工具测评｜免费好用的都在这里了｜小白也能上手", likes: "31.2万", type: "title", source: "bilibili", author: "@数码小蜗牛" },
    ],
    tags: ["#AI绘画", "#AI变装", "#二次元", "#特效", "#AI工具", "#黑科技"],
    nlpKeywords: ["AI", "变装", "绘画", "二次元", "特效", "工具"],
    sentiment: 93,
    contentPattern: { hook比例: "38%", 教程比例: "30%", 种草比例: "32%" },
  },
  {
    id: "t4", topic: "#露营季装备清单", cat: "旅行", heat: 91, growth: 156, vol: "1.2亿", platform: "xiaohongshu", status: "上升",
    themes: [
      { title: "千元搞定全套露营", angle: "性价比", score: 94 },
      { title: "新手避坑指南", angle: "经验分享", score: 90 },
      { title: "精致露营氛围感", angle: "生活方式", score: 88 },
      { title: "带娃露营攻略", angle: "亲子场景", score: 82 },
    ],
    copies: [
      { text: "第一次露营踩了8个坑，花了3000冤枉钱😭 这份避坑清单你们一定要看", likes: "44.7万", type: "hook", source: "xiaohongshu", author: "@露营新手" },
      { text: "1000块搞定露营全套装备！淘宝平替合集，颜值高到以为花了5000", likes: "38.2万", type: "hook", source: "xiaohongshu", author: "@省钱露营家" },
      { text: "🏕️露营装备清单｜新手必看｜我们一家三口的周末露营vlog", likes: "27.9万", type: "title", source: "douyin", author: "@户外一家人" },
      { text: "带孩子露营千万别忘了这5样东西，否则你会后悔一整个周末", likes: "22.1万", type: "hook", source: "xiaohongshu", author: "@辣妈户外" },
    ],
    tags: ["#露营", "#露营装备", "#周末去哪", "#户外生活", "#精致露营", "#亲子露营"],
    nlpKeywords: ["露营", "装备", "清单", "避坑", "平替", "户外"],
    sentiment: 92,
    contentPattern: { hook比例: "40%", 教程比例: "38%", 种草比例: "22%" },
  },
  {
    id: "t5", topic: "#帕梅拉新课挑战", cat: "健身", heat: 89, growth: 134, vol: "9800万", platform: "bilibili", status: "上升",
    themes: [
      { title: "7天打卡记录", angle: "挑战vlog", score: 93 },
      { title: "效果对比实测", angle: "数据说话", score: 89 },
      { title: "办公室也能做", angle: "场景迁移", score: 85 },
      { title: "体重秤不会骗人", angle: "真实反馈", score: 81 },
    ],
    copies: [
      { text: "跟练帕梅拉7天后，我的体脂率从28%降到了25.6%！附完整打卡记录", likes: "33.4万", type: "hook", source: "bilibili", author: "@健身小白日记" },
      { text: "帕梅拉新课有多狠？练完第二天腿都不是自己的了，但效果真的绝！", likes: "28.7万", type: "hook", source: "douyin", author: "@燃脂少女" },
      { text: "不想去健身房？帕梅拉这套课在家跟练就行，30天马甲线看得见", likes: "21.3万", type: "hook", source: "xiaohongshu", author: "@居家健身" },
    ],
    tags: ["#帕梅拉", "#健身打卡", "#燃脂", "#居家健身", "#马甲线挑战"],
    nlpKeywords: ["帕梅拉", "打卡", "燃脂", "体脂", "挑战", "效果"],
    sentiment: 88,
    contentPattern: { hook比例: "45%", 教程比例: "35%", 种草比例: "20%" },
  },
  {
    id: "t6", topic: "#搞笑配音名场面", cat: "搞笑", heat: 86, growth: 223, vol: "2.7亿", platform: "kuaishou", status: "爆发",
    themes: [
      { title: "经典影视配音", angle: "二创恶搞", score: 95 },
      { title: "方言版配音", angle: "地域特色", score: 91 },
      { title: "宠物配音", angle: "萌宠+搞笑", score: 88 },
      { title: "配音教学", angle: "技能分享", score: 79 },
    ],
    copies: [
      { text: "给我家猫配了个霸道总裁的音，它自己听完都懵了😂😂😂", likes: "76.8万", type: "hook", source: "kuaishou", author: "@猫猫配音社" },
      { text: "四川话配音《甄嬛传》，华妃听了都得笑出腹肌 #方言配音", likes: "58.3万", type: "hook", source: "douyin", author: "@方言达人" },
      { text: "挑战用东北话给日漫配音，弹幕全是哈哈哈哈哈哈哈", likes: "43.2万", type: "hook", source: "bilibili", author: "@东北配音王" },
    ],
    tags: ["#搞笑配音", "#名场面", "#方言配音", "#宠物配音", "#二创"],
    nlpKeywords: ["配音", "搞笑", "方言", "名场面", "二创", "宠物"],
    sentiment: 97,
    contentPattern: { hook比例: "55%", 教程比例: "15%", 种草比例: "30%" },
  },
  {
    id: "t7", topic: "#健身餐不踩雷", cat: "美食", heat: 88, growth: 145, vol: "1.1亿", platform: "douyin", status: "上升",
    themes: [
      { title: "好吃不贵的减脂餐", angle: "性价比", score: 92 },
      { title: "外卖也能吃减脂", angle: "懒人方案", score: 89 },
      { title: "高蛋白食谱", angle: "专业营养", score: 86 },
      { title: "减脂餐的谎言", angle: "辟谣科普", score: 80 },
    ],
    copies: [
      { text: "减脂期不知道吃什么？这5道菜我已经连吃一个月了，好吃到根本不像减脂餐", likes: "35.6万", type: "hook", source: "douyin", author: "@健身厨娘" },
      { text: "⚠️千万别买那些所谓的"减脂餐"！营养师教你自己做，成本低一半效果好两倍", likes: "29.4万", type: "hook", source: "xiaohongshu", author: "@营养师说" },
      { text: "外卖点单指南🔥减脂期这样点外卖，不用饿肚子也能瘦", likes: "24.1万", type: "title", source: "xiaohongshu", author: "@懒人减脂" },
    ],
    tags: ["#健身餐", "#减脂餐", "#高蛋白", "#减肥食谱", "#健康饮食"],
    nlpKeywords: ["健身餐", "减脂", "高蛋白", "食谱", "低卡", "好吃"],
    sentiment: 89,
    contentPattern: { hook比例: "40%", 教程比例: "40%", 种草比例: "20%" },
  },
  {
    id: "t8", topic: "#职场反PUA指南", cat: "教育", heat: 83, growth: 167, vol: "8900万", platform: "weibo", status: "上升",
    themes: [
      { title: "识别PUA话术", angle: "科普教育", score: 91 },
      { title: "高情商回怼合集", angle: "实操指南", score: 88 },
      { title: "离职后的逆袭", angle: "励志故事", score: 85 },
      { title: "劳动法小课堂", angle: "法律武器", score: 82 },
    ],
    copies: [
      { text: "老板说"年轻人不要太计较"的时候，其实是在PUA你。这6句话教你优雅反击", likes: "41.3万", type: "hook", source: "weibo", author: "@职场解毒" },
      { text: "在上一家公司被PUA了两年，离职后月薪翻了3倍。分享我的经历给正在迷茫的你", likes: "33.8万", type: "story", source: "xiaohongshu", author: "@打工人觉醒" },
      { text: "HR不会告诉你的5条劳动法常识，每一条都在保护你的权益💪", likes: "27.6万", type: "hook", source: "douyin", author: "@法律小课堂" },
    ],
    tags: ["#职场PUA", "#反PUA", "#职场", "#劳动法", "#打工人", "#职场成长"],
    nlpKeywords: ["PUA", "职场", "反击", "劳动法", "离职", "权益"],
    sentiment: 76,
    contentPattern: { hook比例: "50%", 教程比例: "30%", 种草比例: "20%" },
  },
];

const COPY_TYPES = { hook: { label: "开头Hook", color: "#FF4444" }, title: { label: "标题文案", color: "#FF6B35" }, story: { label: "故事型", color: "#7B61FF" }, cta: { label: "行动号召", color: "#00C9A7" } };

function genSparkline() {
  const pts = [];
  let v = 30 + Math.random() * 30;
  for (let i = 0; i < 24; i++) { v += (Math.random() - 0.4) * 18; v = Math.max(5, Math.min(100, v)); pts.push({ h: i, v: Math.round(v) }); }
  return pts;
}

// ─── COMPONENTS ─────────────────────────────────────────────────

function ScanEngine({ scanning, scanCount, onScan }) {
  return (
    <div className={`scan-engine ${scanning ? "active" : ""}`}>
      <div className="se-left">
        <div className={`se-radar ${scanning ? "spinning" : ""}`}>
          <div className="radar-ring r1" />
          <div className="radar-ring r2" />
          <div className="radar-ring r3" />
          <div className="radar-sweep" />
          <span className="radar-core">📡</span>
        </div>
        <div className="se-info">
          <div className="se-status">{scanning ? "全网扫描中..." : "扫描引擎就绪"}</div>
          <div className="se-sub">已采集 <strong>{scanCount.toLocaleString()}</strong> 条内容 · 覆盖 {PLATFORMS.length - 1} 个平台</div>
        </div>
      </div>
      <div className="se-right">
        {PLATFORMS.slice(1).map((p, i) => (
          <div key={p.id} className={`se-plat ${scanning ? "pulse" : ""}`} style={{ "--pc": p.color, animationDelay: `${i * 150}ms` }}>
            <span className="se-plat-icon">{p.icon}</span>
            <span className="se-plat-name">{p.name}</span>
            {scanning && <span className="se-plat-dot" />}
          </div>
        ))}
        <button className="se-btn" onClick={onScan} disabled={scanning}>
          {scanning ? "⏳ 采集中" : "▶ 启动采集"}
        </button>
      </div>
    </div>
  );
}

function TrendRow({ trend, index, isSelected, onClick }) {
  const st = trend.status;
  const sc = st === "爆发" ? "#FF4444" : st === "上升" ? "#FF6B35" : "#FFB300";
  const p = PLATFORMS.find((x) => x.id === trend.platform);
  return (
    <div className={`trend-row ${isSelected ? "selected" : ""}`} onClick={onClick} style={{ animationDelay: `${index * 50}ms` }}>
      <div className="tr-rank" style={index < 3 ? { color: "#FF6B35" } : {}}>{String(index + 1).padStart(2, "0")}</div>
      <div className="tr-body">
        <div className="tr-line1">
          <span className="tr-topic">{trend.topic}</span>
          <span className="tr-status" style={{ color: sc, background: sc + "14", borderColor: sc + "30" }}>{st}</span>
        </div>
        <div className="tr-line2">
          <span style={{ color: p?.color }}>{p?.icon} {p?.name}</span>
          <span>{trend.cat}</span>
          <span>文案 {trend.copies.length} 条</span>
          <span>主题 {trend.themes.length} 个</span>
          <span>标签 {trend.tags.length} 个</span>
        </div>
      </div>
      <div className="tr-metrics">
        <div className="tr-heat">
          <div className="tr-heat-bar"><div className="tr-heat-fill" style={{ width: `${trend.heat}%`, background: `linear-gradient(90deg, #FF6B35, ${sc})` }} /></div>
          <span className="tr-heat-num">{trend.heat}</span>
        </div>
        <span className="tr-growth">↑{trend.growth}%</span>
      </div>
      <div className="tr-arrow">›</div>
    </div>
  );
}

function ContentPanel({ trend }) {
  const [tab, setTab] = useState("copies");
  const sparkline = useMemo(() => genSparkline(), [trend.id]);
  const p = PLATFORMS.find((x) => x.id === trend.platform);
  const sc = trend.status === "爆发" ? "#FF4444" : trend.status === "上升" ? "#FF6B35" : "#FFB300";

  if (!trend) return <div className="cp-empty">← 选择一个热点查看详情</div>;

  return (
    <div className="content-panel">
      {/* Header */}
      <div className="cp-header">
        <div className="cp-topic-row">
          <span className="cp-status" style={{ color: sc, background: sc + "14", borderColor: sc + "30" }}>{trend.status}</span>
          <h2 className="cp-topic">{trend.topic}</h2>
        </div>
        <div className="cp-meta">
          <span style={{ color: p?.color }}>{p?.icon} {p?.name}</span>
          <span>🔥 热度 {trend.heat}</span>
          <span>📈 增速 +{trend.growth}%</span>
          <span>👁 播放 {trend.vol}</span>
          <span>😊 好评 {trend.sentiment}%</span>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="cp-chart">
        <ResponsiveContainer width="100%" height={80}>
          <AreaChart data={sparkline}>
            <defs>
              <linearGradient id="cpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6B35" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#FF6B35" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke="#FF6B35" strokeWidth={1.5} fill="url(#cpGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tabs */}
      <div className="cp-tabs">
        {[
          { id: "copies", label: `📝 爆款文案 (${trend.copies.length})` },
          { id: "themes", label: `💡 主题方向 (${trend.themes.length})` },
          { id: "tags", label: `🏷️ 标签集合 (${trend.tags.length})` },
          { id: "analysis", label: "📊 内容分析" },
        ].map((t) => (
          <button key={t.id} className={`cp-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="cp-content">
        {tab === "copies" && (
          <div className="copies-list">
            {trend.copies.map((c, i) => (
              <div key={i} className="copy-card" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="cc-header">
                  <span className="cc-type" style={{ color: COPY_TYPES[c.type]?.color, background: COPY_TYPES[c.type]?.color + "14", borderColor: COPY_TYPES[c.type]?.color + "30" }}>
                    {COPY_TYPES[c.type]?.label}
                  </span>
                  <span className="cc-source">{c.source === "douyin" ? "♪ 抖音" : c.source === "kuaishou" ? "⚡ 快手" : c.source === "xiaohongshu" ? "📕 小红书" : c.source === "bilibili" ? "▶ B站" : "◆ 微博"}</span>
                  <span className="cc-likes">❤️ {c.likes}</span>
                </div>
                <div className="cc-text">{c.text}</div>
                <div className="cc-footer">
                  <span className="cc-author">{c.author}</span>
                  <div className="cc-actions">
                    <button className="cc-btn" title="复制文案">📋 复制</button>
                    <button className="cc-btn" title="生成剧本">🚀 生成剧本</button>
                    <button className="cc-btn" title="收藏">⭐</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "themes" && (
          <div className="themes-list">
            {trend.themes.map((th, i) => (
              <div key={i} className="theme-card" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="thc-left">
                  <div className="thc-score" style={{ background: `conic-gradient(#FF6B35 ${th.score}%, rgba(255,255,255,0.06) 0)` }}>
                    <span>{th.score}</span>
                  </div>
                </div>
                <div className="thc-body">
                  <div className="thc-title">{th.title}</div>
                  <div className="thc-angle">创作角度: <strong>{th.angle}</strong></div>
                  <div className="thc-bar-wrap">
                    <div className="thc-bar"><div className="thc-bar-fill" style={{ width: `${th.score}%` }} /></div>
                    <span className="thc-bar-label">竞争热度</span>
                  </div>
                </div>
                <div className="thc-actions">
                  <button className="thc-btn primary">🚀 立即创作</button>
                  <button className="thc-btn">📌 收藏</button>
                </div>
              </div>
            ))}
            <div className="themes-summary">
              <div className="ts-title">💡 AI 建议</div>
              <div className="ts-text">该热点下「{trend.themes[0]?.angle}」角度得分最高，建议优先创作。可结合「{trend.themes[1]?.angle}」角度做差异化内容，覆盖更多人群。</div>
            </div>
          </div>
        )}

        {tab === "tags" && (
          <div className="tags-section">
            <div className="tags-grid">
              {trend.tags.map((tag, i) => (
                <div key={i} className="tag-card" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className="tag-text">{tag}</span>
                  <button className="tag-copy" title="复制">📋</button>
                </div>
              ))}
            </div>
            <div className="tags-nlp">
              <div className="nlp-title">🧠 NLP 关键词提取</div>
              <div className="nlp-words">
                {trend.nlpKeywords.map((kw, i) => (
                  <span key={i} className="nlp-word" style={{ fontSize: `${22 - i * 2}px`, opacity: 1 - i * 0.08 }}>{kw}</span>
                ))}
              </div>
            </div>
            <div className="tags-copy-all">
              <button className="copy-all-btn">📋 一键复制全部标签</button>
            </div>
          </div>
        )}

        {tab === "analysis" && (
          <div className="analysis-section">
            <div className="an-block">
              <div className="an-label">内容类型分布</div>
              <div className="an-pattern">
                {Object.entries(trend.contentPattern).map(([k, v]) => (
                  <div key={k} className="an-bar-row">
                    <span className="an-bar-name">{k}</span>
                    <div className="an-bar"><div className="an-bar-fill" style={{ width: v }} /></div>
                    <span className="an-bar-val">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="an-block">
              <div className="an-label">文案类型统计</div>
              <div className="an-type-grid">
                {Object.entries(COPY_TYPES).map(([k, v]) => {
                  const count = trend.copies.filter((c) => c.type === k).length;
                  return (
                    <div key={k} className="an-type-card">
                      <span className="an-type-count" style={{ color: v.color }}>{count}</span>
                      <span className="an-type-label">{v.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="an-block">
              <div className="an-label">平台来源分布</div>
              <div className="an-plat-grid">
                {PLATFORMS.slice(1).map((pl) => {
                  const count = trend.copies.filter((c) => c.source === pl.id).length;
                  return (
                    <div key={pl.id} className="an-plat-card" style={{ borderColor: count > 0 ? pl.color + "40" : "var(--border)" }}>
                      <span className="an-plat-icon">{pl.icon}</span>
                      <span className="an-plat-name">{pl.name}</span>
                      <span className="an-plat-count" style={{ color: count > 0 ? pl.color : "var(--text3)" }}>{count} 条</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="an-block">
              <div className="an-label">情绪分析</div>
              <div className="an-sentiment">
                <div className="an-senti-bar">
                  <div className="an-senti-fill" style={{ width: `${trend.sentiment}%` }} />
                </div>
                <div className="an-senti-info">
                  <span>正面情绪 <strong>{trend.sentiment}%</strong></span>
                  <span>中性 <strong>{Math.round((100 - trend.sentiment) * 0.7)}%</strong></span>
                  <span>负面 <strong>{Math.round((100 - trend.sentiment) * 0.3)}%</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ───────────────────────────────────────────────────────
export default function TrendDetectionV2() {
  const [scanning, setScanning] = useState(false);
  const [scanCount, setScanCount] = useState(34892);
  const [selectedId, setSelectedId] = useState("t1");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("全部");
  const scanRef = useRef(null);

  const selectedTrend = TREND_DATA.find((t) => t.id === selectedId);

  const filtered = useMemo(() => {
    return TREND_DATA.filter((t) => {
      if (platformFilter !== "all" && t.platform !== platformFilter) return false;
      if (catFilter !== "全部" && t.cat !== catFilter) return false;
      return true;
    }).sort((a, b) => b.heat - a.heat);
  }, [platformFilter, catFilter]);

  const totalCopies = TREND_DATA.reduce((s, t) => s + t.copies.length, 0);
  const totalThemes = TREND_DATA.reduce((s, t) => s + t.themes.length, 0);
  const totalTags = TREND_DATA.reduce((s, t) => s + t.tags.length, 0);

  const startScan = useCallback(() => {
    setScanning(true);
    scanRef.current = setInterval(() => {
      setScanCount((p) => p + Math.floor(Math.random() * 80 + 20));
    }, 200);
    setTimeout(() => {
      clearInterval(scanRef.current);
      setScanning(false);
    }, 6000);
  }, []);

  useEffect(() => () => clearInterval(scanRef.current), []);

  const categories = ["全部", ...new Set(TREND_DATA.map((t) => t.cat))];

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;600&family=Sora:wght@400;600;700;800&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        .app{
          --bg:#06090F;--bg2:#0C1119;--bg3:#121A28;--bg4:#1A2438;--bg5:#212D42;
          --border:rgba(255,255,255,0.05);--border2:rgba(255,255,255,0.1);
          --text1:#EDF0F5;--text2:#8A94A6;--text3:#3F4E63;
          --accent:#FF6B35;--accent2:#FF8F5E;
          font-family:'Noto Sans SC','Sora',sans-serif;
          background:var(--bg);color:var(--text1);
          min-height:100vh;display:flex;flex-direction:column;
          position:relative;
        }
        .app::before{content:'';position:fixed;inset:0;pointer-events:none;
          background:radial-gradient(ellipse 50% 40% at 10% 0%,rgba(255,107,53,0.06),transparent 60%),
          radial-gradient(ellipse 40% 40% at 90% 100%,rgba(255,68,68,0.04),transparent 50%);}

        /* ── TOP BAR ── */
        .topbar{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;
          border-bottom:1px solid var(--border);background:rgba(6,9,15,0.9);backdrop-filter:blur(16px);
          position:sticky;top:0;z-index:50;}
        .topbar-left{display:flex;align-items:center;gap:12px;}
        .tb-badge{padding:3px 10px;border-radius:5px;font-size:10px;font-weight:700;letter-spacing:2px;
          background:rgba(255,107,53,0.1);border:1px solid rgba(255,107,53,0.25);color:var(--accent);}
        .tb-title{font-family:'Sora',sans-serif;font-size:18px;font-weight:800;letter-spacing:-0.5px;}
        .tb-title span{color:var(--accent);}
        .topbar-stats{display:flex;gap:6px;}
        .ts-chip{display:flex;align-items:center;gap:5px;padding:4px 11px;border-radius:6px;
          background:var(--bg2);border:1px solid var(--border);font-size:11px;color:var(--text2);}
        .ts-chip strong{color:var(--text1);font-family:'JetBrains Mono',monospace;}

        /* ── SCAN ENGINE ── */
        .scan-engine{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;
          background:var(--bg2);border-bottom:1px solid var(--border);}
        .se-left{display:flex;align-items:center;gap:14px;}
        .se-radar{width:44px;height:44px;border-radius:50%;position:relative;
          display:flex;align-items:center;justify-content:center;}
        .radar-ring{position:absolute;border-radius:50%;border:1px solid rgba(255,107,53,0.12);}
        .r1{inset:0;}.r2{inset:4px;}.r3{inset:8px;}
        .radar-sweep{position:absolute;inset:0;border-radius:50%;
          background:conic-gradient(from 0deg,transparent 0%,rgba(255,107,53,0.2) 25%,transparent 30%);
          opacity:0;}
        .se-radar.spinning .radar-sweep{opacity:1;animation:sweep 1.5s linear infinite;}
        @keyframes sweep{to{transform:rotate(360deg);}}
        .radar-core{font-size:18px;position:relative;z-index:1;}
        .se-info{display:flex;flex-direction:column;gap:2px;}
        .se-status{font-size:13px;font-weight:700;}
        .scan-engine.active .se-status{color:var(--accent);}
        .se-sub{font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;}
        .se-sub strong{color:var(--text2);}
        .se-right{display:flex;align-items:center;gap:6px;}
        .se-plat{display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:7px;
          background:var(--bg3);border:1px solid var(--border);font-size:11px;color:var(--text2);
          position:relative;transition:all 0.3s;}
        .se-plat.pulse{animation:platPulse 1.2s ease infinite;}
        @keyframes platPulse{50%{border-color:var(--pc);box-shadow:0 0 10px color-mix(in srgb,var(--pc) 30%,transparent);}}
        .se-plat-dot{width:5px;height:5px;border-radius:50%;background:var(--pc);animation:blink 0.8s infinite alternate;}
        @keyframes blink{to{opacity:0.3;}}
        .se-btn{padding:8px 18px;border-radius:8px;border:1px solid rgba(255,107,53,0.3);
          background:linear-gradient(135deg,rgba(255,107,53,0.15),rgba(255,107,53,0.05));
          color:var(--accent2);font-size:12px;font-weight:700;cursor:pointer;transition:all 0.3s;
          font-family:'Noto Sans SC',sans-serif;margin-left:6px;}
        .se-btn:hover{box-shadow:0 0 20px rgba(255,107,53,0.2);}
        .se-btn:disabled{opacity:0.5;cursor:not-allowed;}

        /* ── FILTERS ── */
        .filters{display:flex;align-items:center;gap:6px;padding:10px 20px;border-bottom:1px solid var(--border);overflow-x:auto;}
        .filters::-webkit-scrollbar{display:none;}
        .f-btn{padding:5px 12px;border-radius:6px;border:1px solid var(--border);background:transparent;
          color:var(--text3);font-size:11px;cursor:pointer;transition:all 0.2s;white-space:nowrap;
          font-family:'Noto Sans SC',sans-serif;}
        .f-btn:hover{color:var(--text2);border-color:var(--border2);}
        .f-btn.active{color:var(--accent);border-color:var(--accent);background:rgba(255,107,53,0.08);}
        .f-sep{width:1px;height:18px;background:var(--border);flex-shrink:0;margin:0 2px;}

        /* ── MAIN LAYOUT ── */
        .main{display:grid;grid-template-columns:420px 1fr;flex:1;overflow:hidden;}

        /* ── LEFT LIST ── */
        .left-list{border-right:1px solid var(--border);overflow-y:auto;background:var(--bg);}
        .ll-header{display:flex;align-items:center;justify-content:space-between;
          padding:12px 16px;border-bottom:1px solid var(--border);position:sticky;top:0;
          background:rgba(6,9,15,0.95);backdrop-filter:blur(8px);z-index:10;}
        .ll-title{font-size:13px;font-weight:700;}
        .ll-count{font-size:10px;color:var(--text3);font-family:'JetBrains Mono',monospace;
          padding:2px 8px;border-radius:4px;background:var(--bg3);}

        .trend-row{display:flex;align-items:center;gap:12px;padding:12px 16px;
          border-bottom:1px solid var(--border);cursor:pointer;transition:all 0.25s;
          animation:rowIn 0.35s cubic-bezier(0.16,1,0.3,1) both;}
        @keyframes rowIn{from{opacity:0;transform:translateX(-12px);}}
        .trend-row:hover{background:var(--bg2);}
        .trend-row.selected{background:var(--bg3);border-left:3px solid var(--accent);}
        .tr-rank{font-family:'Sora',sans-serif;font-size:16px;font-weight:800;color:var(--text3);min-width:28px;text-align:center;}
        .tr-body{flex:1;min-width:0;}
        .tr-line1{display:flex;align-items:center;gap:7px;margin-bottom:4px;}
        .tr-topic{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .tr-status{font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;border:1px solid;flex-shrink:0;}
        .tr-line2{display:flex;gap:8px;font-size:10px;color:var(--text3);flex-wrap:wrap;}
        .tr-metrics{display:flex;flex-direction:column;align-items:flex-end;gap:4px;min-width:90px;}
        .tr-heat{display:flex;align-items:center;gap:6px;width:100%;}
        .tr-heat-bar{flex:1;height:3px;border-radius:2px;background:var(--bg4);overflow:hidden;}
        .tr-heat-fill{height:100%;border-radius:2px;transition:width 0.6s;}
        .tr-heat-num{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:var(--accent);}
        .tr-growth{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;color:#FF4444;}
        .tr-arrow{font-size:18px;color:var(--text3);transition:transform 0.2s;}
        .trend-row.selected .tr-arrow{transform:translateX(3px);color:var(--accent);}

        /* ── RIGHT CONTENT ── */
        .content-panel{overflow-y:auto;background:var(--bg2);display:flex;flex-direction:column;}
        .cp-empty{display:flex;align-items:center;justify-content:center;height:100%;color:var(--text3);font-size:14px;}
        .cp-header{padding:18px 22px 12px;border-bottom:1px solid var(--border);}
        .cp-topic-row{display:flex;align-items:center;gap:10px;margin-bottom:6px;}
        .cp-status{font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;border:1px solid;}
        .cp-topic{font-size:20px;font-weight:900;}
        .cp-meta{display:flex;gap:12px;font-size:11px;color:var(--text3);flex-wrap:wrap;}

        .cp-chart{padding:8px 22px;border-bottom:1px solid var(--border);}

        /* ── TABS ── */
        .cp-tabs{display:flex;gap:2px;padding:0 22px;border-bottom:1px solid var(--border);background:var(--bg);}
        .cp-tab{padding:10px 16px;border:none;background:transparent;color:var(--text3);
          font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;
          border-bottom:2px solid transparent;font-family:'Noto Sans SC',sans-serif;}
        .cp-tab:hover{color:var(--text2);}
        .cp-tab.active{color:var(--accent);border-bottom-color:var(--accent);}

        .cp-content{flex:1;overflow-y:auto;padding:16px 22px;}

        /* ── COPIES ── */
        .copy-card{padding:14px 16px;border-radius:12px;background:var(--bg3);border:1px solid var(--border);
          margin-bottom:10px;transition:all 0.25s;animation:cardIn 0.35s cubic-bezier(0.16,1,0.3,1) both;}
        @keyframes cardIn{from{opacity:0;transform:translateY(10px);}}
        .copy-card:hover{border-color:var(--border2);transform:translateY(-2px);
          box-shadow:0 6px 20px rgba(0,0,0,0.25);}
        .cc-header{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
        .cc-type{font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;border:1px solid;}
        .cc-source{font-size:10px;color:var(--text3);}
        .cc-likes{font-size:10px;color:var(--text3);margin-left:auto;font-family:'JetBrains Mono',monospace;}
        .cc-text{font-size:13.5px;line-height:1.8;color:var(--text1);margin-bottom:10px;
          padding:10px 14px;border-radius:8px;background:var(--bg4);border-left:3px solid var(--accent);
          user-select:text;}
        .cc-footer{display:flex;align-items:center;justify-content:space-between;}
        .cc-author{font-size:11px;color:var(--text3);}
        .cc-actions{display:flex;gap:4px;}
        .cc-btn{padding:4px 10px;border-radius:5px;border:1px solid var(--border);background:transparent;
          color:var(--text3);font-size:10px;cursor:pointer;transition:all 0.2s;font-family:'Noto Sans SC',sans-serif;}
        .cc-btn:hover{background:var(--bg4);color:var(--text2);border-color:var(--border2);}

        /* ── THEMES ── */
        .theme-card{display:flex;align-items:center;gap:16px;padding:16px;border-radius:12px;
          background:var(--bg3);border:1px solid var(--border);margin-bottom:10px;
          animation:cardIn 0.35s cubic-bezier(0.16,1,0.3,1) both;}
        .theme-card:hover{border-color:var(--border2);}
        .thc-score{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;
          flex-shrink:0;}
        .thc-score span{font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;
          background:var(--bg3);width:40px;height:40px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;}
        .thc-body{flex:1;}
        .thc-title{font-size:14px;font-weight:700;margin-bottom:4px;}
        .thc-angle{font-size:11px;color:var(--text3);margin-bottom:8px;}
        .thc-angle strong{color:var(--accent2);}
        .thc-bar-wrap{display:flex;align-items:center;gap:8px;}
        .thc-bar{flex:1;height:3px;border-radius:2px;background:var(--bg4);overflow:hidden;}
        .thc-bar-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,#FF6B35,#FF4444);
          transition:width 0.6s;}
        .thc-bar-label{font-size:9px;color:var(--text3);}
        .thc-actions{display:flex;flex-direction:column;gap:4px;flex-shrink:0;}
        .thc-btn{padding:6px 12px;border-radius:6px;border:1px solid var(--border);background:transparent;
          color:var(--text3);font-size:11px;cursor:pointer;transition:all 0.2s;white-space:nowrap;
          font-family:'Noto Sans SC',sans-serif;}
        .thc-btn:hover{background:var(--bg4);color:var(--text2);}
        .thc-btn.primary{border-color:rgba(255,107,53,0.3);
          background:linear-gradient(135deg,rgba(255,107,53,0.12),rgba(255,107,53,0.04));color:var(--accent2);}
        .thc-btn.primary:hover{box-shadow:0 0 14px rgba(255,107,53,0.15);}
        .themes-summary{padding:14px 16px;border-radius:10px;background:rgba(255,107,53,0.06);
          border:1px solid rgba(255,107,53,0.15);margin-top:8px;}
        .ts-title{font-size:12px;font-weight:700;color:var(--accent);margin-bottom:6px;}
        .ts-text{font-size:12px;color:var(--text2);line-height:1.7;}

        /* ── TAGS ── */
        .tags-grid{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;}
        .tag-card{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;
          background:var(--bg3);border:1px solid var(--border);transition:all 0.2s;
          animation:cardIn 0.3s cubic-bezier(0.16,1,0.3,1) both;}
        .tag-card:hover{border-color:var(--accent);background:rgba(255,107,53,0.06);}
        .tag-text{font-size:13px;font-weight:600;color:var(--accent2);}
        .tag-copy{border:none;background:transparent;cursor:pointer;font-size:12px;opacity:0.4;transition:opacity 0.2s;}
        .tag-card:hover .tag-copy{opacity:1;}
        .nlp-title{font-size:12px;font-weight:700;color:var(--text2);margin-bottom:10px;}
        .nlp-words{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:20px;}
        .nlp-word{font-weight:700;color:var(--text1);cursor:default;transition:color 0.2s;}
        .nlp-word:hover{color:var(--accent);}
        .copy-all-btn{width:100%;padding:10px;border-radius:8px;border:1px solid rgba(255,107,53,0.3);
          background:linear-gradient(135deg,rgba(255,107,53,0.1),transparent);color:var(--accent2);
          font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:'Noto Sans SC',sans-serif;}
        .copy-all-btn:hover{box-shadow:0 0 16px rgba(255,107,53,0.15);}

        /* ── ANALYSIS ── */
        .an-block{margin-bottom:20px;}
        .an-label{font-size:11px;font-weight:700;color:var(--text2);letter-spacing:1px;margin-bottom:10px;}
        .an-bar-row{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
        .an-bar-name{font-size:11px;color:var(--text3);min-width:70px;}
        .an-bar{flex:1;height:6px;border-radius:3px;background:var(--bg4);overflow:hidden;}
        .an-bar-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#FF6B35,#FF8F5E);transition:width 0.5s;}
        .an-bar-val{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;color:var(--accent);min-width:36px;text-align:right;}
        .an-type-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
        .an-type-card{text-align:center;padding:12px 8px;border-radius:10px;background:var(--bg3);border:1px solid var(--border);}
        .an-type-count{display:block;font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;}
        .an-type-label{font-size:10px;color:var(--text3);}
        .an-plat-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;}
        .an-plat-card{text-align:center;padding:10px 6px;border-radius:8px;background:var(--bg3);border:1px solid var(--border);}
        .an-plat-icon{display:block;font-size:16px;margin-bottom:4px;}
        .an-plat-name{display:block;font-size:10px;color:var(--text3);margin-bottom:2px;}
        .an-plat-count{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;}
        .an-sentiment{margin-top:4px;}
        .an-senti-bar{height:10px;border-radius:5px;background:var(--bg4);overflow:hidden;margin-bottom:8px;}
        .an-senti-fill{height:100%;border-radius:5px;background:linear-gradient(90deg,#00C9A7,#4ADE80);transition:width 0.6s;}
        .an-senti-info{display:flex;gap:16px;font-size:11px;color:var(--text3);}
        .an-senti-info strong{color:var(--text1);}

        /* ── RESPONSIVE ── */
        @media(max-width:900px){
          .main{grid-template-columns:1fr;}
          .left-list{max-height:40vh;}
          .topbar-stats{display:none;}
          .se-plat{display:none;}
        }
      `}</style>

      {/* Top Bar */}
      <div className="topbar">
        <div className="topbar-left">
          <span className="tb-badge">01</span>
          <h1 className="tb-title">🔥 热点<span>感知</span> · 内容采集</h1>
        </div>
        <div className="topbar-stats">
          <div className="ts-chip">🔍 热点 <strong>{TREND_DATA.length}</strong></div>
          <div className="ts-chip">📝 文案 <strong>{totalCopies}</strong></div>
          <div className="ts-chip">💡 主题 <strong>{totalThemes}</strong></div>
          <div className="ts-chip">🏷️ 标签 <strong>{totalTags}</strong></div>
        </div>
      </div>

      {/* Scan Engine */}
      <ScanEngine scanning={scanning} scanCount={scanCount} onScan={startScan} />

      {/* Filters */}
      <div className="filters">
        {PLATFORMS.map((p) => (
          <button key={p.id} className={`f-btn ${platformFilter === p.id ? "active" : ""}`}
            style={platformFilter === p.id ? { borderColor: p.color, color: p.color, background: p.color + "10" } : {}}
            onClick={() => setPlatformFilter(p.id)}>
            {p.icon} {p.name}
          </button>
        ))}
        <div className="f-sep" />
        {categories.map((c) => (
          <button key={c} className={`f-btn ${catFilter === c ? "active" : ""}`}
            onClick={() => setCatFilter(c)}>{c}</button>
        ))}
      </div>

      {/* Main */}
      <div className="main">
        {/* Left: Trend List */}
        <div className="left-list">
          <div className="ll-header">
            <span className="ll-title">热点列表</span>
            <span className="ll-count">{filtered.length} 条</span>
          </div>
          {filtered.map((t, i) => (
            <TrendRow key={t.id} trend={t} index={i}
              isSelected={selectedId === t.id}
              onClick={() => setSelectedId(t.id)} />
          ))}
        </div>

        {/* Right: Content Detail */}
        {selectedTrend ? <ContentPanel trend={selectedTrend} /> : <div className="content-panel"><div className="cp-empty">← 选择一个热点查看详情</div></div>}
      </div>
    </div>
  );
}
