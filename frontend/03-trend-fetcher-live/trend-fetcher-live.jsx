import { useState, useCallback, useRef, useEffect } from "react";

const PLATFORMS = [
  { id: "weibo", name: "微博", icon: "◆", color: "#FF8200" },
  { id: "douyin", name: "抖音", icon: "♪", color: "#FE2C55" },
  { id: "xiaohongshu", name: "小红书", icon: "📕", color: "#FF2442" },
  { id: "bilibili", name: "B站", icon: "▶", color: "#00A1D6" },
  { id: "zhihu", name: "知乎", icon: "知", color: "#0066FF" },
  { id: "baidu", name: "百度", icon: "BD", color: "#3388FF" },
];

const CAT_COLORS = {
  "科技":"#7B61FF","娱乐":"#FF4081","社会":"#FF6B35","财经":"#FFB300",
  "体育":"#00C9A7","政策":"#448AFF","生活":"#FF8F5E","教育":"#4ADE80",
  "国际":"#E040FB","其他":"#78909C","热搜":"#FF6B35",
};

const TODAY = new Date().toLocaleDateString("zh-CN", { year:"numeric", month:"2-digit", day:"2-digit" });

// ─── JSON extraction with multiple strategies ───
function extractJSON(text) {
  if (!text) return null;
  let c = text.replace(/```json\s*/gi,"").replace(/```\s*/gi,"").trim();
  const s = c.indexOf("["), e = c.lastIndexOf("]");
  if (s !== -1 && e > s) {
    try { return JSON.parse(c.substring(s, e + 1)); } catch {}
  }
  // Try finding individual JSON objects
  const objs = [];
  const regex = /\{[^{}]*"title"\s*:\s*"[^"]+?"[^{}]*\}/g;
  let m;
  while ((m = regex.exec(c)) !== null) {
    try { objs.push(JSON.parse(m[0])); } catch {}
  }
  return objs.length > 0 ? objs : null;
}

// ─── Extract titles from freeform text ───
function extractTitlesFromText(text) {
  if (!text) return [];
  const items = [];
  const lines = text.split("\n");
  let idx = 1;
  for (const line of lines) {
    let clean = line.trim();
    if (!clean || clean.length < 3) continue;
    // Remove numbering patterns
    clean = clean.replace(/^\d+[\.\)、：:\-\]\s]+/, "").trim();
    clean = clean.replace(/^[#*\-•→►]\s*/, "").trim();
    clean = clean.replace(/^\*\*(.+?)\*\*/, "$1").trim();
    // Remove trailing metadata
    clean = clean.replace(/[\s]+[-—–]\s*.*$/, "").trim();
    clean = clean.replace(/\s*[（(].*?[）)]$/, "").trim();
    // Skip if it looks like metadata/instructions
    if (clean.startsWith("{") || clean.startsWith("[") || clean.toLowerCase().includes("json") ||
        clean.includes("category") || clean.includes("rank") || clean.length > 120 || clean.length < 4) continue;
    items.push({ rank: idx++, title: clean, heat: "", category: "热搜" });
    if (idx > 20) break;
  }
  return items;
}

// ─── Core API call ───
async function callAPI(platform, useSearch, addLog) {
  const prompt = useSearch
    ? `Search for today's top 20 trending topics on ${platform.name} (${TODAY}). After searching, return ONLY a JSON array:
[{"rank":1,"title":"话题标题","heat":"热度","category":"分类"}]
category: 科技/娱乐/社会/财经/体育/政策/生活/教育/国际/其他. Only JSON, no other text.`
    : `请列出${platform.name}今天(${TODAY})的热搜榜Top20。只返回JSON数组，不要其他文字：
[{"rank":1,"title":"话题标题","heat":"热度值","category":"分类"}]
分类选项：科技/娱乐/社会/财经/体育/政策/生活/教育/国际/其他`;

  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [
      { role: "system", content: "You are a Chinese internet trend analyst. Return ONLY a JSON array of trending topics. No markdown, no explanation, just the raw JSON array." },
      { role: "user", content: prompt },
    ],
  };
  if (useSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  }

  addLog(`→ 发送请求 (${useSearch ? "联网搜索" : "模型知识"})...`);

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const status = resp.status;
  addLog(`← HTTP ${status}`);

  if (!resp.ok) {
    const errBody = await resp.text().catch(() => "");
    addLog(`← 错误: ${errBody.substring(0, 300)}`);
    return { error: `HTTP ${status}`, raw: errBody.substring(0, 500) };
  }

  const data = await resp.json();
  const blocks = data.content || [];
  addLog(`← ${blocks.length} 个内容块: [${blocks.map(b => b.type).join(", ")}]`);

  // Extract ALL text from all block types
  let allText = "";
  let debugBlocks = [];
  for (const block of blocks) {
    debugBlocks.push({ type: block.type, length: block.text?.length || 0 });
    if (block.type === "text" && block.text) {
      allText += block.text + "\n";
    }
    // Also check nested content in search results
    if (block.content && Array.isArray(block.content)) {
      for (const sub of block.content) {
        if (sub.type === "text" && sub.text) allText += sub.text + "\n";
      }
    }
  }

  addLog(`← 提取文本 ${allText.length} 字符`);

  return {
    text: allText,
    blocks: debugBlocks,
    raw: JSON.stringify(data).substring(0, 2000),
    stopReason: data.stop_reason,
    model: data.model,
  };
}

// ─── Fetch one platform with fallback ───
async function fetchPlatform(platform, addLog) {
  addLog(`\n━━━ ${platform.icon} ${platform.name} ━━━`);

  // Strategy 1: Try with web search
  let result = await callAPI(platform, true, addLog);
  let items = null;

  if (result.text) {
    items = extractJSON(result.text);
    if (items && items.length > 0) {
      addLog(`✓ JSON解析成功: ${items.length} 条`);
    } else {
      // Try text extraction
      const textItems = extractTitlesFromText(result.text);
      if (textItems.length >= 3) {
        items = textItems;
        addLog(`⚠ 文本提取: ${items.length} 条`);
      }
    }
  }

  // Strategy 2: Fallback without web search
  if (!items || items.length < 3) {
    addLog(`→ 降级: 使用模型知识...`);
    result = await callAPI(platform, false, addLog);
    if (result.text) {
      items = extractJSON(result.text);
      if (!items || items.length < 3) {
        const textItems = extractTitlesFromText(result.text);
        if (textItems.length >= 3) items = textItems;
      }
    }
  }

  if (items && items.length > 0) {
    const normalized = items.slice(0, 20).map((it, i) => ({
      rank: it.rank || i + 1,
      title: String(it.title || "").replace(/^["'「『]|["'」』]$/g, "").substring(0, 120),
      heat: String(it.heat || ""),
      category: it.category || "热搜",
    }));
    addLog(`✅ ${platform.name} 完成: ${normalized.length} 条热点`);
    return { ok: true, items: normalized, raw: result.raw };
  }

  addLog(`❌ ${platform.name} 失败`);
  return { ok: false, error: result.error || "解析失败", raw: result.raw || "" };
}

// ─── Components ───

function RawViewer({ raw, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div style={{ width:"90%", maxWidth:700, maxHeight:"80vh", background:"#0A0E14", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, overflow:"hidden" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ fontSize:13, fontWeight:700 }}>API原始响应</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#8A94A6", fontSize:16, cursor:"pointer" }}>✕</button>
        </div>
        <pre style={{ padding:16, overflowY:"auto", maxHeight:"70vh", fontSize:11, lineHeight:1.6, color:"#8A94A6", fontFamily:"monospace", whiteSpace:"pre-wrap", wordBreak:"break-all", margin:0 }}>{raw}</pre>
      </div>
    </div>
  );
}

export default function TrendDebugger() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [rawData, setRawData] = useState({});
  const [open, setOpen] = useState({});
  const [logs, setLogs] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [lastTime, setLastTime] = useState(null);
  const [progress, setProgress] = useState("");
  const [viewRaw, setViewRaw] = useState(null);
  const busyRef = useRef(false);
  const logRef = useRef(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const addLog = useCallback((msg) => {
    const t = new Date().toLocaleTimeString("zh-CN", { hour12:false, hour:"2-digit", minute:"2-digit", second:"2-digit" });
    setLogs(p => [...p.slice(-100), { t, msg }]);
  }, []);

  const doFetchOne = useCallback(async (plat) => {
    setLoading(p => ({ ...p, [plat.id]: true }));
    setErrors(p => ({ ...p, [plat.id]: null }));
    setOpen(p => ({ ...p, [plat.id]: true }));

    const result = await fetchPlatform(plat, addLog);
    if (result.ok) {
      setData(p => ({ ...p, [plat.id]: result.items }));
    } else {
      setErrors(p => ({ ...p, [plat.id]: result.error }));
    }
    if (result.raw) setRawData(p => ({ ...p, [plat.id]: result.raw }));
    setLoading(p => ({ ...p, [plat.id]: false }));
  }, [addLog]);

  const doFetchAll = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setFetching(true);
    setLogs([]);
    addLog("🚀 开始全平台采集");

    for (let i = 0; i < PLATFORMS.length; i++) {
      setProgress(`${i+1}/${PLATFORMS.length} ${PLATFORMS[i].name}`);
      await doFetchOne(PLATFORMS[i]);
      if (i < PLATFORMS.length - 1) await new Promise(r => setTimeout(r, 500));
    }

    setProgress("");
    setLastTime(new Date().toLocaleTimeString("zh-CN",{hour12:false}));
    addLog("🏁 全部采集完成");
    setFetching(false);
    busyRef.current = false;
  }, [doFetchOne, addLog]);

  const exportJSON = useCallback(() => {
    const result = PLATFORMS.map(p => ({ platform:p.id, name:p.name, trends:data[p.id]||[], count:data[p.id]?.length||0, fetch_time:new Date().toISOString() }));
    const blob = new Blob([JSON.stringify(result,null,2)],{type:"application/json"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `trends_${new Date().toISOString().slice(0,10)}.json`; a.click();
  }, [data]);

  const total = Object.values(data).reduce((s,a) => s+(a?a.length:0), 0);
  const loaded = Object.values(data).filter(Boolean).length;

  return (
    <div style={{ fontFamily:"'Noto Sans SC',sans-serif", background:"#06090F", color:"#EDF0F5", minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>

      {/* ═══ HEADER ═══ */}
      <div style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(6,9,15,0.95)", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ padding:"3px 8px", borderRadius:4, fontSize:9, fontWeight:700, letterSpacing:2, background:"rgba(255,107,53,0.12)", border:"1px solid rgba(255,107,53,0.25)", color:"#FF6B35" }}>LIVE</span>
            <span style={{ fontSize:16, fontWeight:900 }}>🔥 全网热点采集</span>
            {progress && <span style={{ fontSize:11, color:"#FF6B35", fontFamily:"monospace", padding:"2px 8px", borderRadius:4, background:"rgba(255,107,53,0.08)" }}>{progress}</span>}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            {lastTime && <span style={{ fontSize:10, color:"#3F4E63", fontFamily:"monospace" }}>{lastTime}</span>}
            {total>0 && <button onClick={exportJSON} style={S.greenBtn}>📥 导出</button>}
            <button onClick={doFetchAll} disabled={fetching} style={{ ...S.mainBtn, opacity:fetching?0.5:1, cursor:fetching?"not-allowed":"pointer" }}>
              {fetching ? `⏳ ${progress}` : "📡 一键采集"}
            </button>
          </div>
        </div>
        {/* Platform quick buttons */}
        <div style={{ display:"flex", gap:4, marginTop:8, flexWrap:"wrap" }}>
          <span style={{ padding:"2px 8px", borderRadius:4, fontSize:10, color:"#6B7A8D", background:"#0C1119" }}>
            {total}条 · {loaded}/6 · {TODAY}
          </span>
          {PLATFORMS.map(p => {
            const cnt = data[p.id]?.length||0;
            const isL = loading[p.id];
            return (
              <button key={p.id} onClick={()=>{if(!isL)doFetchOne(p)}} disabled={isL}
                style={{ display:"inline-flex", alignItems:"center", gap:3, padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:600,
                  border:"1px solid "+(cnt>0?p.color+"40":"rgba(255,255,255,0.05)"),
                  background:cnt>0?p.color+"10":"transparent", color:cnt>0?p.color:"#3F4E63",
                  opacity:isL?0.4:1, cursor:isL?"wait":"pointer" }}>
                {isL?"⏳":p.icon} {p.name}{cnt>0?` ${cnt}`:""}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ MAIN SPLIT LAYOUT ═══ */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* ── LEFT: Results ── */}
        <div style={{ flex:1, overflowY:"auto", padding:"12px 16px" }}>

          {/* Welcome state */}
          {total===0 && !fetching && (
            <div style={{ textAlign:"center", padding:"40px 16px" }}>
              <div style={{ fontSize:44, marginBottom:12 }}>📡</div>
              <div style={{ fontSize:18, fontWeight:900, marginBottom:6 }}>全网热点实时采集</div>
              <div style={{ fontSize:12, color:"#4A5568", lineHeight:1.7, marginBottom:20 }}>
                联网搜索6大平台今日Top20热搜<br/>微博·抖音·小红书·B站·知乎·百度
              </div>
              <button onClick={doFetchAll} style={{ ...S.mainBtn, padding:"12px 32px", fontSize:14 }}>
                📡 立即采集
              </button>
            </div>
          )}

          {/* Platform cards */}
          {(total>0||fetching) && PLATFORMS.map(p => {
            const items = data[p.id];
            const isL = !!loading[p.id];
            const err = errors[p.id];
            const isOpen = !!open[p.id];
            const cnt = items?items.length:0;
            const hasRaw = !!rawData[p.id];

            return (
              <div key={p.id} style={{ borderRadius:10, background:"#0C1119", border:"1px solid rgba(255,255,255,0.05)", overflow:"hidden", marginBottom:8 }}>
                {/* Card header */}
                <div onClick={()=>setOpen(v=>({...v,[p.id]:!v[p.id]}))} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", cursor:"pointer" }}>
                  <span style={{ width:30, height:30, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, background:p.color+"15", color:p.color, border:"1px solid "+p.color+"25" }}>{p.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700 }}>{p.name}</div>
                    <div style={{ fontSize:10, color:isL?"#FF6B35":err?"#FF4444":cnt>0?"#00C9A7":"#3F4E63" }}>
                      {isL?"搜索中...":err?"失败":cnt>0?`✓ ${cnt}条`:"待采集"}
                    </div>
                  </div>
                  {isL && <div style={{ width:16, height:16, border:"2px solid "+p.color+"30", borderTopColor:p.color, borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>}
                  {!isL && err && <button onClick={e=>{e.stopPropagation();doFetchOne(p)}} style={S.retryBtn}>重试</button>}
                  {!isL && cnt>0 && <span style={{ padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:700, background:p.color+"15", color:p.color }}>{cnt}</span>}
                  {hasRaw && <button onClick={e=>{e.stopPropagation();setViewRaw(rawData[p.id])}} style={S.rawBtn}>RAW</button>}
                  <span style={{ fontSize:11, color:"#3F4E63", transform:isOpen?"rotate(180deg)":"none", transition:"transform 0.2s" }}>▼</span>
                </div>

                {/* Card body */}
                {isOpen && (
                  <div style={{ maxHeight:420, overflowY:"auto", borderTop:"1px solid rgba(255,255,255,0.03)" }}>
                    {isL && (
                      <div style={{ padding:"20px 14px", textAlign:"center" }}>
                        <div style={{ width:24, height:24, border:"2px solid "+p.color+"25", borderTopColor:p.color, borderRadius:"50%", animation:"spin 0.7s linear infinite", margin:"0 auto 8px" }}/>
                        <div style={{ fontSize:12, color:"#6B7A8D" }}>正在联网搜索 {p.name} 热搜...</div>
                      </div>
                    )}
                    {!isL && err && (
                      <div style={{ padding:14, textAlign:"center" }}>
                        <div style={{ fontSize:11, color:"#FF6B35", marginBottom:4 }}>采集失败</div>
                        <div style={{ fontSize:10, color:"#3F4E63", wordBreak:"break-all" }}>{err}</div>
                      </div>
                    )}
                    {!isL && items && items.map((item,i) => {
                      const cc = CAT_COLORS[item.category]||"#78909C";
                      return (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 14px", borderBottom:"1px solid rgba(255,255,255,0.02)", animation:"fadeIn 0.25s ease both", animationDelay:i*25+"ms" }}>
                          <span style={{ fontFamily:"monospace", fontSize:13, fontWeight:800, minWidth:24, textAlign:"center", color:i<3?p.color:"#3F4E63" }}>
                            {String(item.rank).padStart(2,"0")}
                          </span>
                          <span style={{ flex:1, fontSize:12.5, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {item.title}
                          </span>
                          <span style={{ fontSize:8, fontWeight:700, padding:"1px 5px", borderRadius:3, color:cc, background:cc+"15", border:"1px solid "+cc+"25", flexShrink:0 }}>
                            {item.category}
                          </span>
                          {item.heat && <span style={{ fontSize:9, color:"#3F4E63", fontFamily:"monospace", flexShrink:0, maxWidth:80, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.heat}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Summary */}
          {total>0 && (
            <div style={{ marginTop:6, padding:"10px 14px", borderRadius:8, background:"rgba(255,107,53,0.04)", border:"1px solid rgba(255,107,53,0.08)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:6 }}>
              <span style={{ fontSize:12, fontWeight:700 }}>📊 共 {total} 条 · {loaded} 平台</span>
              <div style={{ display:"flex", gap:4 }}>
                <button onClick={exportJSON} style={S.greenBtn}>📥 导出JSON</button>
                <button onClick={doFetchAll} disabled={fetching} style={{ ...S.retryBtn, opacity:fetching?0.5:1 }}>🔄 重采</button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Debug Log Panel ── */}
        <div style={{ width:320, minWidth:280, borderLeft:"1px solid rgba(255,255,255,0.05)", background:"#080B12", display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"10px 12px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:12, fontWeight:700, color:"#6B7A8D" }}>📋 调试日志</span>
            <span style={{ fontSize:10, color:"#3F4E63", fontFamily:"monospace" }}>{logs.length} entries</span>
          </div>
          <div ref={logRef} style={{ flex:1, overflowY:"auto", padding:"6px 0" }}>
            {logs.length===0 && <div style={{ padding:"20px 12px", textAlign:"center", fontSize:11, color:"#2A3444" }}>点击采集后显示日志</div>}
            {logs.map((l,i) => (
              <div key={i} style={{ padding:"2px 12px", fontSize:10.5, fontFamily:"monospace", lineHeight:1.5,
                color: l.msg.includes("✅")||l.msg.includes("✓")?"#00C9A7":
                       l.msg.includes("❌")||l.msg.includes("✗")||l.msg.includes("错误")?"#FF6B35":
                       l.msg.includes("━━━")?"#8A94A6":"#4F6070" }}>
                <span style={{ color:"#2A3444" }}>{l.t} </span>{l.msg}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RAW viewer modal */}
      {viewRaw && <RawViewer raw={viewRaw} onClose={()=>setViewRaw(null)} />}
    </div>
  );
}

const S = {
  mainBtn: { padding:"7px 16px", borderRadius:7, border:"1px solid rgba(255,107,53,0.3)", background:"linear-gradient(135deg,rgba(255,107,53,0.18),rgba(255,107,53,0.06))", color:"#FF8F5E", fontSize:12, fontWeight:700, cursor:"pointer" },
  greenBtn: { padding:"4px 10px", borderRadius:5, border:"1px solid rgba(0,201,167,0.3)", background:"rgba(0,201,167,0.06)", color:"#00C9A7", fontSize:10, fontWeight:600, cursor:"pointer" },
  retryBtn: { padding:"3px 10px", borderRadius:5, border:"1px solid rgba(255,107,53,0.3)", background:"rgba(255,107,53,0.06)", color:"#FF8F5E", fontSize:10, cursor:"pointer" },
  rawBtn: { padding:"2px 6px", borderRadius:3, border:"1px solid rgba(255,255,255,0.08)", background:"transparent", color:"#3F4E63", fontSize:9, fontFamily:"monospace", cursor:"pointer" },
};
