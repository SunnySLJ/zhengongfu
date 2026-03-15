import { useState, useEffect } from "react";

// ─── 模拟脚本数据 ────────────────────────────────────────────────────────────
const MOCK_SCRIPTS = [
  {
    topic: "#315晚会今晚直播#", category: "社会", platform_target: "抖音",
    style: "情感共鸣", title: "315晚会这次会曝光谁？",
    hook: "你上次被坑过吗？今晚可能有答案！",
    segments: [
      { time: "0-3s",   type: "hook",     text: "年年315，哪次让你最心痛？",          visual: "315晚会历年截图快速闪过" },
      { time: "3-15s",  type: "conflict", text: "你用过的品牌，今晚可能上榜！",        visual: "超市商品货架扫描镜头" },
      { time: "15-45s", type: "content",  text: "今晚直播315晚会，历年曝光：食品安全83次、医疗美容47次……新增关注AI应用安全", visual: "数据可视化动画" },
      { time: "45-60s", type: "cta",      text: "关注我，今晚直播间一起守护权益！",    visual: "直播间引导界面" },
    ],
    hashtags: ["#315晚会", "#消费者权益", "#避坑指南", "#今晚直播", "#315曝光"],
    bgm_style: "紧张悬疑", conversion_goal: "涨粉", difficulty: "低",
    estimated_views: "50万-200万", raw_rank: 1, raw_heat: "热 9.8亿",
  },
  {
    topic: "#微信三大功能更新#", category: "科技", platform_target: "B站",
    style: "干货知识", title: "微信悄悄更新，你发现了吗？",
    hook: "10亿人用的App，这3个功能你不知道？",
    segments: [
      { time: "0-3s",   type: "hook",     text: "微信刚更新，90%的人不知道！",        visual: "手机屏幕微信界面特写" },
      { time: "3-15s",  type: "conflict", text: "被领导拉群、深夜骚扰……你有这种困扰？", visual: "情景再现：深夜手机来电" },
      { time: "15-45s", type: "content",  text: "功能①忽略来电：静音但不拒接。功能②长文转发原格式不变形。功能③消息快捷回复……", visual: "手机操作实录演示" },
      { time: "45-60s", type: "cta",      text: "三连收藏，下次用得到！",             visual: "点赞收藏动画" },
    ],
    hashtags: ["#微信新功能", "#微信技巧", "#手机技巧", "#科技分享", "#数码"],
    bgm_style: "轻快活泼", conversion_goal: "涨粉", difficulty: "低",
    estimated_views: "20万-100万", raw_rank: 4, raw_heat: "热 4.6亿",
  },
  {
    topic: "#理想官宣推出理想i9#", category: "财经", platform_target: "抖音",
    style: "干货知识", title: "理想i9定价50万+，值吗？",
    hook: "理想要出50万的车！买还是不买？",
    segments: [
      { time: "0-3s",   type: "hook",     text: "理想i9即将上市，你猜多少钱？",        visual: "理想i9渲染图动态展示" },
      { time: "3-15s",  type: "conflict", text: "50万买理想，还是BBA？你会怎么选？",   visual: "分屏对比：i9 vs 奔驰GLS vs 宝马X7" },
      { time: "15-45s", type: "content",  text: "理想i9：6座纯电旗舰SUV，预计续航800km+，华为智驾合作，同价位对手竟是劳斯莱斯！", visual: "参数对比动画" },
      { time: "45-60s", type: "cta",      text: "你会买吗？评论区告诉我！",            visual: "评论区互动引导" },
    ],
    hashtags: ["#理想i9", "#理想汽车", "#新能源SUV", "#50万买什么车", "#汽车测评"],
    bgm_style: "大气磅礴", conversion_goal: "流量", difficulty: "中",
    estimated_views: "30万-150万", raw_rank: 3, raw_heat: "热 3.1亿",
  },
  {
    topic: "#AI养虾装虾499卸载299#", category: "科技", platform_target: "B站",
    style: "娱乐搞笑", title: "AI养虾翻车现场，我没忍住笑了",
    hook: "程序员用AI养虾，结果虾死了，AI没死",
    segments: [
      { time: "0-3s",   type: "hook",     text: "程序员花1000块让AI养虾，出大事了！", visual: "虾缸+代码界面分屏特写" },
      { time: "3-15s",  type: "conflict", text: "499买AI养虾系统，还要299卸载费？虾死了他哭了", visual: "截图+弹幕刷屏动画" },
      { time: "15-45s", type: "content",  text: "某程序员花499元购买AI虾苗监控系统，AI过度投喂虾全死。联系客服：卸载需另付299元。帖子发出一夜3000条评论", visual: "事件时间线动画" },
      { time: "45-60s", type: "cta",      text: "AI消费陷阱，你踩过吗？评论区说！",  visual: "评论区弹幕飞过" },
    ],
    hashtags: ["#AI养虾", "#科技翻车", "#消费维权", "#315", "#AI应用"],
    bgm_style: "轻松搞笑", conversion_goal: "流量", difficulty: "低",
    estimated_views: "100万-500万", raw_rank: 2, raw_heat: "热 5.2亿",
  },
  {
    topic: "#黄金价格创历史新高#", category: "财经", platform_target: "抖音",
    style: "干货知识", title: "黄金暴涨！现在还能买吗？",
    hook: "你妈囤的黄金涨了多少？我算了一下…",
    segments: [
      { time: "0-3s",   type: "hook",     text: "黄金又创新高！你妈已经赚了多少钱？",  visual: "金价K线图向上突破动画" },
      { time: "3-15s",  type: "conflict", text: "你说买买买，她说等等等，结果……",     visual: "情景对话漫画" },
      { time: "15-45s", type: "content",  text: "3年前580/克，现在超过780/克。10克金条涨2000元。一条金链100克涨2万！分析师：仍有上涨空间……", visual: "计算器动画+数字对比" },
      { time: "45-60s", type: "cta",      text: "想知道黄金投资攻略？关注我！",       visual: "引导关注界面" },
    ],
    hashtags: ["#黄金价格", "#黄金投资", "#黄金涨价", "#理财", "#投资"],
    bgm_style: "紧张上升", conversion_goal: "涨粉", difficulty: "低",
    estimated_views: "80万-300万", raw_rank: 8, raw_heat: "热 1.8亿",
  },
];

const CONV_COLORS  = { 涨粉:"#7B61FF", 带货:"#FF6B35", 品牌:"#00C9A7", 流量:"#FFB300" };
const DIFF_COLORS  = { 低:"#4ADE80", 中:"#FFB300", 高:"#FF4081" };
const SEG_COLORS   = { hook:"#FF6B35", conflict:"#FFB300", content:"#7B61FF", cta:"#00C9A7" };
const SEG_LABELS   = { hook:"钩子", conflict:"冲突", content:"内容", cta:"行动" };
const PLAT_COLORS  = { 抖音:"#FE2C55", B站:"#00A1D6", 小红书:"#FF2442", 微博:"#FF8200", 知乎:"#0066FF" };

export default function ScriptGenerator() {
  const [scripts, setScripts]         = useState(MOCK_SCRIPTS);
  const [selected, setSelected]       = useState(0);
  const [generating, setGenerating]   = useState(false);
  const [copiedIdx, setCopiedIdx]     = useState(null);
  const [filterGoal, setFilterGoal]   = useState("全部");
  const [filterDiff, setFilterDiff]   = useState("全部");
  const [searchText, setSearchText]   = useState("");
  const [sortBy, setSortBy]           = useState("rank");

  const filteredScripts = scripts
    .filter(s => filterGoal === "全部" || s.conversion_goal === filterGoal)
    .filter(s => filterDiff === "全部" || s.difficulty === filterDiff)
    .filter(s => !searchText || s.title.includes(searchText) || s.topic.includes(searchText))
    .sort((a, b) => {
      if (sortBy === "rank")  return (a.raw_rank || 99) - (b.raw_rank || 99);
      if (sortBy === "views") return b.estimated_views.localeCompare(a.estimated_views);
      return 0;
    });

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 3000);
  };

  const copyScript = (s, idx) => {
    const text = `【${s.title}】\n🎣 钩子：${s.hook}\n\n` +
      s.segments.map(seg => `[${seg.time} ${SEG_LABELS[seg.type] || seg.type}]\n${seg.text}\n画面：${seg.visual}`).join("\n\n") +
      `\n\n标签：${s.hashtags.join(" ")}\nBGM：${s.bgm_style}`;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const cur = filteredScripts[selected] || filteredScripts[0] || scripts[0];

  return (
    <div style={{ fontFamily: "'PingFang SC','Noto Sans SC',sans-serif", background: "#06090F", color: "#EDF0F5", minHeight: "100vh" }}>
      {/* ── 顶部 Header ── */}
      <div style={{ background: "linear-gradient(135deg,#0C1119 0%,#12182B 100%)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 28 }}>✍️</span>
                <h1 style={{ fontSize: 22, fontWeight: 900, background: "linear-gradient(90deg,#7B61FF,#C77DFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>剧本创意中心</h1>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "rgba(123,97,255,0.15)", color: "#7B61FF", border: "1px solid rgba(123,97,255,0.3)" }}>② Script Generation</span>
              </div>
              <div style={{ fontSize: 12, color: "#4A5568" }}>基于热点话题 · 通义千问自动生成爆款短视频脚本</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleGenerate}
                disabled={generating}
                style={{ padding: "10px 20px", borderRadius: 8, background: generating ? "rgba(123,97,255,0.3)" : "linear-gradient(135deg,#7B61FF,#9D7FFF)", color: "#fff", border: "none", cursor: generating ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
              >
                {generating ? (
                  <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span> 生成中...</>
                ) : "⚡ 一键生成脚本"}
              </button>
            </div>
          </div>

          {/* 统计条 */}
          <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
            {[
              { icon: "✍️", label: "脚本总数",   value: scripts.length + " 个" },
              { icon: "🎯", label: "转化目标",   value: [...new Set(scripts.map(s => s.conversion_goal))].join(" / ") },
              { icon: "📈", label: "最高预估",   value: "500万+" },
              { icon: "🤖", label: "AI模型",     value: "Qwen Plus" },
            ].map(s => (
              <div key={s.label} style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 12 }}>
                {s.icon} <span style={{ color: "#8A94A6" }}>{s.label}：</span><span style={{ fontWeight: 700, color: "#EDF0F5" }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px", display: "flex", gap: 20 }}>
        {/* ── 左侧列表 ── */}
        <div style={{ width: 320, flexShrink: 0 }}>
          {/* 筛选 */}
          <div style={{ background: "#0C1119", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: 12, marginBottom: 12 }}>
            <input
              value={searchText}
              onChange={e => { setSearchText(e.target.value); setSelected(0); }}
              placeholder="🔍 搜索标题 / 话题..."
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#EDF0F5", fontSize: 12, marginBottom: 8, outline: "none" }}
            />
            <div style={{ display: "flex", gap: 6 }}>
              <select value={filterGoal} onChange={e => { setFilterGoal(e.target.value); setSelected(0); }}
                style={{ flex: 1, padding: "6px 8px", borderRadius: 6, background: "#0A0F1A", border: "1px solid rgba(255,255,255,0.08)", color: "#EDF0F5", fontSize: 11 }}>
                {["全部", "涨粉", "带货", "流量", "品牌"].map(v => <option key={v}>{v}</option>)}
              </select>
              <select value={filterDiff} onChange={e => { setFilterDiff(e.target.value); setSelected(0); }}
                style={{ flex: 1, padding: "6px 8px", borderRadius: 6, background: "#0A0F1A", border: "1px solid rgba(255,255,255,0.08)", color: "#EDF0F5", fontSize: 11 }}>
                {["全部", "低", "中", "高"].map(v => <option key={v}>{v}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ flex: 1, padding: "6px 8px", borderRadius: 6, background: "#0A0F1A", border: "1px solid rgba(255,255,255,0.08)", color: "#EDF0F5", fontSize: 11 }}>
                <option value="rank">按热度</option>
                <option value="views">按预估</option>
              </select>
            </div>
          </div>

          {/* 脚本列表 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredScripts.map((s, i) => {
              const cc = CONV_COLORS[s.conversion_goal] || "#8A94A6";
              const dc = DIFF_COLORS[s.difficulty]      || "#8A94A6";
              const pc = PLAT_COLORS[s.platform_target] || "#8A94A6";
              const active = i === selected;
              return (
                <div key={i} onClick={() => setSelected(i)}
                  style={{ padding: 12, borderRadius: 10, background: active ? "rgba(123,97,255,0.12)" : "#0C1119", border: `1px solid ${active ? "rgba(123,97,255,0.4)" : "rgba(255,255,255,0.06)"}`, cursor: "pointer", transition: "all 0.2s" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                    <span style={{ minWidth: 22, height: 22, borderRadius: 5, background: active ? "#7B61FF" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: active ? "#fff" : "#8A94A6" }}>{i + 1}</span>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>{s.title}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#4A5568", marginBottom: 6 }}>{s.topic.replace(/#/g, "").substring(0, 25)}...</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, color: pc, background: `${pc}15`, border: `1px solid ${pc}30` }}>{s.platform_target}</span>
                    <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, color: cc, background: `${cc}15`, border: `1px solid ${cc}30` }}>{s.conversion_goal}</span>
                    <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, color: dc, background: `${dc}15`, border: `1px solid ${dc}30` }}>难度:{s.difficulty}</span>
                    <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, color: "#FF6B35", background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)" }}>#{s.raw_rank}</span>
                  </div>
                </div>
              );
            })}
            {filteredScripts.length === 0 && (
              <div style={{ textAlign: "center", color: "#4A5568", padding: 40, fontSize: 13 }}>无匹配脚本</div>
            )}
          </div>
        </div>

        {/* ── 右侧详情 ── */}
        {cur && (
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* 标题栏 */}
            <div style={{ background: "#0C1119", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", borderLeft: "4px solid #7B61FF", display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>{cur.title}</h2>
                  <div style={{ fontSize: 12, color: "#8A94A6", marginBottom: 8 }}>来源：{cur.topic} · 热度：{cur.raw_heat}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, color: PLAT_COLORS[cur.platform_target] || "#8A94A6", background: `${PLAT_COLORS[cur.platform_target] || "#8A94A6"}15`, border: `1px solid ${PLAT_COLORS[cur.platform_target] || "#8A94A6"}30` }}>{cur.platform_target}</span>
                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, color: "#00C9A7", background: "rgba(0,201,167,0.1)", border: "1px solid rgba(0,201,167,0.2)" }}>{cur.style}</span>
                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, color: CONV_COLORS[cur.conversion_goal], background: `${CONV_COLORS[cur.conversion_goal]}15`, border: `1px solid ${CONV_COLORS[cur.conversion_goal]}30` }}>{cur.conversion_goal}</span>
                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, color: DIFF_COLORS[cur.difficulty], background: `${DIFF_COLORS[cur.difficulty]}15`, border: `1px solid ${DIFF_COLORS[cur.difficulty]}30` }}>难度:{cur.difficulty}</span>
                  </div>
                </div>
                <button onClick={() => copyScript(cur, selected)}
                  style={{ padding: "8px 16px", borderRadius: 8, background: copiedIdx === selected ? "rgba(0,201,167,0.2)" : "rgba(123,97,255,0.15)", color: copiedIdx === selected ? "#00C9A7" : "#7B61FF", border: `1px solid ${copiedIdx === selected ? "rgba(0,201,167,0.3)" : "rgba(123,97,255,0.3)"}`, cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                  {copiedIdx === selected ? "✓ 已复制" : "📋 复制脚本"}
                </button>
              </div>

              {/* 开场钩子 */}
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,107,53,0.05)" }}>
                <div style={{ fontSize: 11, color: "#FF6B35", fontWeight: 700, marginBottom: 6 }}>🎣 开场钩子（前3秒留住观众）</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#FF6B35" }}>{cur.hook}</div>
              </div>

              {/* 分段脚本 */}
              <div style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: 12, color: "#8A94A6", fontWeight: 700, marginBottom: 12 }}>📝 分段脚本（共 60 秒）</div>
                {cur.segments.map((seg, i) => {
                  const sc = SEG_COLORS[seg.type] || "#8A94A6";
                  return (
                    <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 10, borderLeft: `3px solid ${sc}` }}>
                      <div style={{ minWidth: 60 }}>
                        <div style={{ fontSize: 10, fontFamily: "monospace", color: sc, fontWeight: 700 }}>{seg.time}</div>
                        <div style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: `${sc}20`, color: sc, border: `1px solid ${sc}30`, marginTop: 3, display: "inline-block" }}>{SEG_LABELS[seg.type] || seg.type}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#C5CDD8", marginBottom: 5, lineHeight: 1.5 }}>{seg.text}</div>
                        <div style={{ fontSize: 11, color: "#4A5568" }}>📷 {seg.visual}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 底部信息 */}
              <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)" }}>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
                  <div><span style={{ fontSize: 11, color: "#4A5568" }}>🎵 BGM：</span><span style={{ fontSize: 12, color: "#EDF0F5" }}>{cur.bgm_style}</span></div>
                  <div><span style={{ fontSize: 11, color: "#4A5568" }}>📈 预估播放：</span><span style={{ fontSize: 12, fontWeight: 700, color: "#FFB300" }}>{cur.estimated_views}</span></div>
                  <div><span style={{ fontSize: 11, color: "#4A5568" }}>⭐ 内容分类：</span><span style={{ fontSize: 12, color: "#EDF0F5" }}>{cur.category}</span></div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {cur.hashtags.map((ht, i) => (
                    <span key={i} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, color: "#7B61FF", background: "rgba(123,97,255,0.1)", border: "1px solid rgba(123,97,255,0.2)" }}>{ht}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* 使用说明 */}
            <div style={{ background: "#0C1119", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: 16 }}>
              <div style={{ fontSize: 12, color: "#8A94A6", fontWeight: 700, marginBottom: 10 }}>🚀 使用 Python 脚本批量生成</div>
              <div style={{ background: "#06090F", borderRadius: 8, padding: 12, fontFamily: "monospace", fontSize: 11, color: "#4ADE80", lineHeight: 1.8 }}>
                <div style={{ color: "#4A5568" }}># 从热点数据自动生成脚本（需先运行 daily_fetch.py）</div>
                <div>python scripts/script_generator.py -n 5</div>
                <div style={{ marginTop: 4, color: "#4A5568" }}># 模拟模式（无需API）</div>
                <div>python scripts/script_generator.py --mock</div>
                <div style={{ marginTop: 4, color: "#4A5568" }}># 直接输入话题</div>
                <div>python scripts/script_generator.py --topic "你的话题"</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
