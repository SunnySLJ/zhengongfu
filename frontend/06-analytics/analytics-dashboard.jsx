import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

// ─── 模拟数据 ────────────────────────────────────────────────────────────────
const WEEK_DATA = [
  { day: "03/09", views: 128, scripts: 8,  published: 22, fans: 340 },
  { day: "03/10", views: 243, scripts: 12, published: 35, fans: 520 },
  { day: "03/11", views: 189, scripts: 7,  published: 19, fans: 280 },
  { day: "03/12", views: 367, scripts: 15, published: 44, fans: 780 },
  { day: "03/13", views: 412, scripts: 18, published: 52, fans: 890 },
  { day: "03/14", views: 298, scripts: 11, published: 31, fans: 620 },
  { day: "03/15", views: 534, scripts: 20, published: 58, fans: 1100 },
];

const CAT_DATA = [
  { name: "科技", value: 32, color: "#7B61FF" },
  { name: "娱乐", value: 28, color: "#FF4081" },
  { name: "社会", value: 20, color: "#FF6B35" },
  { name: "财经", value: 18, color: "#FFB300" },
  { name: "体育", value: 12, color: "#00C9A7" },
  { name: "生活", value: 10, color: "#448AFF" },
];

const PLAT_DATA = [
  { name: "抖音",   videos: 580, views: 8200, fans: 3400, color: "#FE2C55" },
  { name: "B站",    videos: 290, views: 6100, fans: 1800, color: "#00A1D6" },
  { name: "小红书", videos: 290, views: 4200, fans: 2200, color: "#FF2442" },
  { name: "微博",   videos: 145, views: 2800, fans: 900,  color: "#FF8200" },
  { name: "知乎",   videos: 72,  views: 1500, fans: 600,  color: "#0066FF" },
];

const RADAR_DATA = [
  { metric: "播放量", value: 85 },
  { metric: "完播率", value: 68 },
  { metric: "互动率", value: 72 },
  { metric: "转化率", value: 54 },
  { metric: "粉丝增长", value: 79 },
  { metric: "爆款率",  value: 61 },
];

const METRICS_38 = [
  // 生产
  { section: "🏭 生产效率", key: "trends_fetched",    label: "采集热点",    value: 120,   unit: "条",     color: "#FF6B35", trend: "+12%" },
  { section: "🏭 生产效率", key: "scripts_generated", label: "生成脚本",    value: 48,    unit: "个",     color: "#FF6B35", trend: "+8%" },
  { section: "🏭 生产效率", key: "assets_matched",    label: "匹配素材",    value: 35,    unit: "次",     color: "#FF6B35", trend: "+15%" },
  { section: "🏭 生产效率", key: "videos_produced",   label: "生产视频",    value: 1377,  unit: "个",     color: "#FF6B35", trend: "+22%" },
  { section: "🏭 生产效率", key: "avg_script_time",   label: "脚本耗时",    value: 18.4,  unit: "秒",     color: "#FF6B35", trend: "-5%" },
  { section: "🏭 生产效率", key: "avg_match_time",    label: "匹配耗时",    value: 47,    unit: "ms",     color: "#FF6B35", trend: "-12%" },
  { section: "🏭 生产效率", key: "daily_output",      label: "日均产出",    value: 197,   unit: "个/日",  color: "#FF6B35", trend: "+18%" },
  { section: "🏭 生产效率", key: "pipeline_success",  label: "流水线成功率",value: 97.2,  unit: "%",      color: "#FF6B35", trend: "+0.3%" },
  // 发布
  { section: "📡 发布数据", key: "total_published",   label: "累计发布",    value: 1170,  unit: "个",     color: "#7B61FF", trend: "+25%" },
  { section: "📡 发布数据", key: "platforms_used",    label: "覆盖平台",    value: 5,     unit: "个",     color: "#7B61FF", trend: "" },
  { section: "📡 发布数据", key: "accounts_active",   label: "活跃账号",    value: 8,     unit: "个",     color: "#7B61FF", trend: "+2" },
  { section: "📡 发布数据", key: "scheduled_count",   label: "待发布排期",  value: 63,    unit: "个",     color: "#7B61FF", trend: "" },
  { section: "📡 发布数据", key: "best_time_slot",    label: "最佳时段",    value: "18-21时", unit: "",   color: "#7B61FF", trend: "" },
  { section: "📡 发布数据", key: "auto_rate",         label: "自动化率",    value: 96.8,  unit: "%",      color: "#7B61FF", trend: "+1.2%" },
  // 流量
  { section: "👁️ 流量数据", key: "total_views",       label: "总播放量",    value: 2171,  unit: "万",     color: "#00C9A7", trend: "+34%" },
  { section: "👁️ 流量数据", key: "avg_views",         label: "平均播放",    value: 18.6,  unit: "万",     color: "#00C9A7", trend: "+8%" },
  { section: "👁️ 流量数据", key: "peak_views",        label: "单视频峰值",  value: 347,   unit: "万",     color: "#00C9A7", trend: "" },
  { section: "👁️ 流量数据", key: "total_likes",       label: "总点赞",      value: 130,   unit: "万",     color: "#00C9A7", trend: "+41%" },
  { section: "👁️ 流量数据", key: "total_comments",    label: "总评论",      value: 32,    unit: "万",     color: "#00C9A7", trend: "+28%" },
  { section: "👁️ 流量数据", key: "total_shares",      label: "总转发",      value: 54,    unit: "万",     color: "#00C9A7", trend: "+56%" },
  { section: "👁️ 流量数据", key: "total_saves",       label: "总收藏",      value: 76,    unit: "万",     color: "#00C9A7", trend: "+32%" },
  { section: "👁️ 流量数据", key: "completion_rate",   label: "完播率",      value: 63.2,  unit: "%",      color: "#00C9A7", trend: "+2.1%" },
  // 粉丝
  { section: "👥 粉丝数据", key: "total_fans",        label: "总粉丝",      value: 1.24,  unit: "万",     color: "#FFB300", trend: "+890今日" },
  { section: "👥 粉丝数据", key: "new_fans_today",    label: "今日新增",    value: 890,   unit: "人",     color: "#FFB300", trend: "+12%" },
  { section: "👥 粉丝数据", key: "fan_growth_rate",   label: "粉丝增长率",  value: 7.18,  unit: "%",      color: "#FFB300", trend: "" },
  { section: "👥 粉丝数据", key: "fan_retention",     label: "粉丝留存率",  value: 74.3,  unit: "%",      color: "#FFB300", trend: "+3.2%" },
  // 变现
  { section: "💰 变现数据", key: "total_revenue",     label: "累计收益",    value: 38420, unit: "元",     color: "#FF4081", trend: "+28%" },
  { section: "💰 变现数据", key: "cpm",               label: "千次播放收益",value: 17.7,  unit: "元",     color: "#FF4081", trend: "+5%" },
  { section: "💰 变现数据", key: "conversion_rate",   label: "转化率",      value: 4.8,   unit: "%",      color: "#FF4081", trend: "+0.6%" },
  { section: "💰 变现数据", key: "roi",               label: "投入产出比",  value: 16.0,  unit: "x",      color: "#FF4081", trend: "" },
  { section: "💰 变现数据", key: "top_earner",        label: "单视频最高",  value: 7840,  unit: "元",     color: "#FF4081", trend: "" },
  { section: "💰 变现数据", key: "monthly_target",    label: "月目标完成",  value: 76.8,  unit: "%",      color: "#FF4081", trend: "" },
  // 质量
  { section: "⭐ 内容质量", key: "avg_engagement",    label: "平均互动率",  value: 6.3,   unit: "%",      color: "#448AFF", trend: "+0.8%" },
  { section: "⭐ 内容质量", key: "viral_count",       label: "爆款视频",    value: 94,    unit: "个",     color: "#448AFF", trend: "+11个" },
  { section: "⭐ 内容质量", key: "viral_rate",        label: "爆款率",      value: 8.0,   unit: "%",      color: "#448AFF", trend: "+1.2%" },
  { section: "⭐ 内容质量", key: "best_category",     label: "最佳分类",    value: "科技",unit: "",       color: "#448AFF", trend: "" },
  { section: "⭐ 内容质量", key: "script_score",      label: "脚本质量分",  value: 8.4,   unit: "分",     color: "#448AFF", trend: "+0.3" },
  { section: "⭐ 内容质量", key: "duplicate_rate",    label: "重复率",      value: 0.8,   unit: "%",      color: "#448AFF", trend: "-0.3%" },
];

const SECTIONS = [...new Set(METRICS_38.map(m => m.section))];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0C1119", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <div style={{ color: "#8A94A6", marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color || "#EDF0F5" }}>
          {p.name}: <strong>{p.value.toLocaleString()}</strong>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsDashboard() {
  const [activeSection, setActiveSection] = useState("全部");
  const [chartType, setChartType]         = useState("views");
  const [activePlatTab, setActivePlatTab] = useState("views");

  const filtered = activeSection === "全部"
    ? METRICS_38
    : METRICS_38.filter(m => m.section === activeSection);

  const grouped = {};
  filtered.forEach(m => {
    if (!grouped[m.section]) grouped[m.section] = [];
    grouped[m.section].push(m);
  });

  const chartDataKey = { views: "views", scripts: "scripts", fans: "fans", published: "published" };
  const chartColors  = { views: "#00C9A7", scripts: "#7B61FF", fans: "#FFB300", published: "#FF6B35" };
  const chartLabels  = { views: "播放量(万)", scripts: "脚本数", fans: "新增粉丝", published: "发布数" };

  return (
    <div style={{ fontFamily: "'PingFang SC','Noto Sans SC',sans-serif", background: "#06090F", color: "#EDF0F5", minHeight: "100vh" }}>
      {/* ── Header ── */}
      <div style={{ background: "linear-gradient(135deg,#0C1119 0%,#12182B 100%)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 24px" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>📊</span>
            <h1 style={{ fontSize: 22, fontWeight: 900, background: "linear-gradient(90deg,#448AFF,#7B61FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>数据分析中心</h1>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "rgba(68,138,255,0.15)", color: "#448AFF", border: "1px solid rgba(68,138,255,0.3)" }}>⑥ Analytics · 38项指标</span>
          </div>
          <div style={{ fontSize: 12, color: "#4A5568" }}>全维度追踪流水线生产、发布、流量、粉丝、变现、质量数据</div>
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "20px 24px" }}>
        {/* ── 核心KPI卡片 ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { icon: "🔥", label: "采集热点",   value: "120条",    sub: "+12% 今日",  color: "#FF6B35" },
            { icon: "✍️", label: "生成脚本",   value: "48个",     sub: "+8% 今日",   color: "#7B61FF" },
            { icon: "🎬", label: "生产视频",   value: "1,377个",  sub: "+22% 今日",  color: "#FF4081" },
            { icon: "👁️", label: "总播放量",   value: "2,171万",  sub: "+34% 本周",  color: "#00C9A7" },
            { icon: "👥", label: "总粉丝",     value: "1.24万",   sub: "+890 今日",  color: "#FFB300" },
            { icon: "💰", label: "累计收益",   value: "¥38,420",  sub: "ROI: 16x",   color: "#FF4081" },
            { icon: "🔥", label: "爆款视频",   value: "94个",     sub: "爆款率 8%",  color: "#FF6B35" },
            { icon: "✅", label: "月目标完成", value: "76.8%",    sub: "距月末16天", color: "#448AFF" },
          ].map(k => (
            <div key={k.label} style={{ background: "#0C1119", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px", borderTop: `2px solid ${k.color}` }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{k.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 11, color: "#8A94A6", marginTop: 2 }}>{k.label}</div>
              <div style={{ fontSize: 10, color: "#4A5568", marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ── 图表区 ── */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* 趋势折线图 */}
          <div style={{ background: "#0C1119", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700 }}>📈 近7日趋势</h3>
              <div style={{ display: "flex", gap: 6 }}>
                {Object.entries(chartLabels).map(([k, v]) => (
                  <button key={k} onClick={() => setChartType(k)}
                    style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: `1px solid ${chartType === k ? chartColors[k] : "rgba(255,255,255,0.08)"}`, background: chartType === k ? `${chartColors[k]}20` : "transparent", color: chartType === k ? chartColors[k] : "#8A94A6", cursor: "pointer" }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={WEEK_DATA}>
                <XAxis dataKey="day" stroke="#4A5568" tick={{ fontSize: 11 }} />
                <YAxis stroke="#4A5568" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey={chartDataKey[chartType]} stroke={chartColors[chartType]} strokeWidth={2} dot={{ fill: chartColors[chartType], r: 4 }} name={chartLabels[chartType]} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 雷达图 */}
          <div style={{ background: "#0C1119", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>🎯 内容综合评分</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#8A94A6", fontSize: 10 }} />
                <Radar name="评分" dataKey="value" stroke="#7B61FF" fill="#7B61FF" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── 平台 + 分类 ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* 平台分布 */}
          <div style={{ background: "#0C1119", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700 }}>🌐 平台发布分布</h3>
              <div style={{ display: "flex", gap: 4 }}>
                {["videos","views","fans"].map(t => (
                  <button key={t} onClick={() => setActivePlatTab(t)}
                    style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, border: `1px solid ${activePlatTab===t?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.06)"}`, background: activePlatTab===t?"rgba(255,255,255,0.1)":"transparent", color: activePlatTab===t?"#EDF0F5":"#4A5568", cursor: "pointer" }}>
                    {t==="videos"?"视频数":t==="views"?"播放量":"粉丝"}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={PLAT_DATA} layout="vertical">
                <XAxis type="number" stroke="#4A5568" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" stroke="#4A5568" tick={{ fontSize: 11 }} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey={activePlatTab} radius={[0,4,4,0]}>
                  {PLAT_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 内容分类 */}
          <div style={{ background: "#0C1119", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📋 内容分类分布</h3>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <PieChart width={140} height={140}>
                <Pie data={CAT_DATA} cx={65} cy={65} innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={2}>
                  {CAT_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
              <div style={{ flex: 1 }}>
                {CAT_DATA.map((c, i) => {
                  const total = CAT_DATA.reduce((s, x) => s + x.value, 0);
                  return (
                    <div key={i} style={{ marginBottom: 7 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
                        <span style={{ color: c.color, fontWeight: 600 }}>{c.name}</span>
                        <span style={{ color: "#4A5568" }}>{c.value}条 ({(c.value/total*100).toFixed(0)}%)</span>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 3, height: 5, overflow: "hidden" }}>
                        <div style={{ height: "100%", background: c.color, width: `${c.value/total*100}%`, borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── 38项指标全览 ── */}
        <div style={{ background: "#0C1119", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700 }}>📊 38项指标全览</h2>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["全部", ...SECTIONS].map(sec => (
                <button key={sec} onClick={() => setActiveSection(sec)}
                  style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: `1px solid ${activeSection===sec?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.06)"}`, background: activeSection===sec?"rgba(255,255,255,0.1)":"transparent", color: activeSection===sec?"#EDF0F5":"#4A5568", cursor: "pointer" }}>
                  {sec === "全部" ? "全部" : sec.split(" ")[1]}
                </button>
              ))}
            </div>
          </div>

          {Object.entries(grouped).map(([section, metrics]) => (
            <div key={section} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: metrics[0].color, marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${metrics[0].color}20` }}>{section}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 8 }}>
                {metrics.map(m => (
                  <div key={m.key} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: m.color, marginBottom: 3 }}>
                      {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
                      {m.unit && <span style={{ fontSize: 11, fontWeight: 400, color: "#8A94A6", marginLeft: 2 }}>{m.unit}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#8A94A6" }}>{m.label}</div>
                    {m.trend && (
                      <div style={{ fontSize: 10, marginTop: 4, color: m.trend.startsWith("+") ? "#4ADE80" : m.trend.startsWith("-") ? "#FF4081" : "#8A94A6" }}>
                        {m.trend}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
