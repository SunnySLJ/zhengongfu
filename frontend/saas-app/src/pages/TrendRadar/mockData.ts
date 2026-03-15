export type TrendPlatform = 'douyin' | 'xiaohongshu' | 'weibo' | 'bilibili' | 'kuaishou' | 'channels'

export interface TrendItem {
  id: string
  rank: number
  title: string
  platform: TrendPlatform
  industry: string
  heatScore: number
  heatDelta: number
  videoCount: number
  tags: string[]
  description: string
  peakHour: string
  trendData: number[]
  isFavorited: boolean
  updatedAt: string
  thumbnail: string   // image url
  link: string        // platform link
}

export const TREND_PLATFORMS = [
  { label: '全部', value: '' },
  { label: '抖音', value: 'douyin' },
  { label: '小红书', value: 'xiaohongshu' },
  { label: '微博', value: 'weibo' },
  { label: 'B站', value: 'bilibili' },
  { label: '快手', value: 'kuaishou' },
  { label: '视频号', value: 'channels' },
]

export const PLATFORM_CFG: Record<TrendPlatform, { label: string; bg: string; color: string; searchUrl: (kw: string) => string }> = {
  douyin:      { label: '抖音',  bg: '#010101', color: '#fff', searchUrl: (kw) => `https://www.douyin.com/search/${encodeURIComponent(kw)}` },
  xiaohongshu: { label: '小红书', bg: '#fe2c55', color: '#fff', searchUrl: (kw) => `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(kw)}&source=web_explore_feed` },
  weibo:       { label: '微博',  bg: '#e6162d', color: '#fff', searchUrl: (kw) => `https://s.weibo.com/weibo?q=%23${encodeURIComponent(kw)}%23` },
  bilibili:    { label: 'B站',  bg: '#00a1d6', color: '#fff', searchUrl: (kw) => `https://search.bilibili.com/all?keyword=${encodeURIComponent(kw)}` },
  kuaishou:    { label: '快手',  bg: '#ff6900', color: '#fff', searchUrl: (kw) => `https://www.kuaishou.com/search/video?searchKey=${encodeURIComponent(kw)}` },
  channels:    { label: '视频号', bg: '#07c160', color: '#fff', searchUrl: (kw) => `https://channels.weixin.qq.com/search?keyword=${encodeURIComponent(kw)}` },
}

// picsum 固定 seed 保证图片一致
function img(seed: string) {
  return `https://picsum.photos/seed/${seed}/400/225`
}

function td(base: number, delta: number): number[] {
  return Array.from({ length: 7 }, (_, i) => Math.max(0, Math.min(100, Math.round(base - (6 - i) * (delta / 6) + (Math.random() - 0.5) * 4))))
}

const raw: Omit<TrendItem, 'id' | 'trendData' | 'thumbnail' | 'link' | 'isFavorited'>[] = [
  // ── 抖音 ─────────────────────────────────────────
  { rank:1,  title:'多巴胺穿搭',         platform:'douyin', industry:'fashion',   heatScore:98, heatDelta:8,  videoCount:89100, tags:['多巴胺','穿搭','色彩搭配','OOTD'],        description:'高饱和度色彩组合穿搭风格，带来愉悦感，持续引爆短视频穿搭赛道。',            peakHour:'19:00', updatedAt:'5分钟前' },
  { rank:2,  title:'露营+轻户外',        platform:'douyin', industry:'travel',    heatScore:95, heatDelta:22, videoCount:65400, tags:['露营','轻户外','野餐','城市露营'],         description:'周末城市周边露营热度持续攀升，轻户外装备开箱和场地探店视频播放量激增。',    peakHour:'08:00', updatedAt:'12分钟前' },
  { rank:3,  title:'健身打卡挑战',       platform:'douyin', industry:'health',    heatScore:91, heatDelta:-5, videoCount:54700, tags:['健身','打卡','减脂','居家健身'],           description:'30天健身打卡挑战赛，居家健身操和减脂舞蹈持续吸引大量参与者。',              peakHour:'07:00', updatedAt:'20分钟前' },
  { rank:4,  title:'短剧剧情推荐',       platform:'douyin', industry:'education', heatScore:87, heatDelta:-3, videoCount:92400, tags:['短剧','霸总','剧情','追剧'],              description:'抖音短剧赛道竞争激烈，剧情向内容完播率高，付费短剧模式持续验证商业价值。', peakHour:'22:00', updatedAt:'30分钟前' },
  { rank:5,  title:'宠物搞笑合集',       platform:'douyin', industry:'lifestyle', heatScore:84, heatDelta:11, videoCount:73200, tags:['宠物','搞笑','猫咪','狗狗'],              description:'萌宠搞笑切片内容保持超高完播率，用户互动积极，品牌植入接受度高。',          peakHour:'21:00', updatedAt:'45分钟前' },
  { rank:6,  title:'新中式穿搭',         platform:'douyin', industry:'fashion',   heatScore:82, heatDelta:19, videoCount:41300, tags:['新中式','国风穿搭','马面裙','汉元素'],    description:'融合现代剪裁的新中式穿搭爆火，马面裙、新式旗袍等单品供不应求。',            peakHour:'18:00', updatedAt:'1小时前' },
  { rank:7,  title:'街头美食探店',       platform:'douyin', industry:'food',      heatScore:80, heatDelta:7,  videoCount:38900, tags:['探店','街头美食','夜市','小吃'],           description:'城市街头美食探店内容稳居高热，地方特色小吃视频带动同城流量。',              peakHour:'19:00', updatedAt:'1小时前' },
  { rank:8,  title:'AI变声互动',         platform:'douyin', industry:'education', heatScore:78, heatDelta:34, videoCount:29600, tags:['AI变声','特效','趣味','互动'],            description:'AI变声玩法持续带动UGC创作热情，互动率远超普通内容。',                      peakHour:'20:00', updatedAt:'2小时前' },
  { rank:9,  title:'减脂餐食谱',         platform:'douyin', industry:'health',    heatScore:75, heatDelta:6,  videoCount:47800, tags:['减脂','食谱','健康饮食','低卡'],           description:'减脂餐视频播放量稳定，健康饮食赛道品牌广告投放性价比高。',                  peakHour:'07:00', updatedAt:'2小时前' },
  { rank:10, title:'电商直播技巧',       platform:'douyin', industry:'ecommerce', heatScore:73, heatDelta:9,  videoCount:21400, tags:['直播带货','电商','话术','涨粉'],           description:'电商直播培训类内容热度上升，商家端学习需求旺盛。',                          peakHour:'14:00', updatedAt:'3小时前' },
  { rank:11, title:'萌娃成长日记',       platform:'douyin', industry:'lifestyle', heatScore:70, heatDelta:5,  videoCount:56700, tags:['萌娃','亲子','成长记录','宝宝'],          description:'亲子类内容在抖音保持长效热度，家庭用品品牌最佳投放场景。',                  peakHour:'20:00', updatedAt:'3小时前' },
  { rank:12, title:'国产游戏新作',       platform:'douyin', industry:'education', heatScore:68, heatDelta:28, videoCount:34100, tags:['游戏','国产游戏','测评','攻略'],           description:'国产3A游戏预售引爆话题，游戏测评和玩法攻略类内容流量激增。',                peakHour:'22:00', updatedAt:'4小时前' },
  { rank:13, title:'职场沟通话术',       platform:'douyin', industry:'business',  heatScore:65, heatDelta:13, videoCount:18200, tags:['职场','沟通','话术','升职'],              description:'职场干货类短视频受到都市白领欢迎，企培类课程广告效果佳。',                  peakHour:'12:00', updatedAt:'4小时前' },
  { rank:14, title:'暑期亲子游推荐',     platform:'douyin', industry:'travel',    heatScore:63, heatDelta:17, videoCount:27800, tags:['亲子游','暑假','旅行攻略','儿童乐园'],    description:'暑期亲子出游需求旺盛，景点探访和攻略视频播放量爆发式增长。',                peakHour:'09:00', updatedAt:'5小时前' },
  { rank:15, title:'家电使用技巧',       platform:'douyin', industry:'ecommerce', heatScore:61, heatDelta:4,  videoCount:22500, tags:['家电','使用技巧','生活小窍门','扫地机器人'],description:'生活技巧类内容完播率高，家电品牌借势内容营销效果显著。',                    peakHour:'19:00', updatedAt:'5小时前' },
  { rank:16, title:'手机摄影技巧',       platform:'douyin', industry:'education', heatScore:59, heatDelta:8,  videoCount:31600, tags:['手机摄影','构图','后期','Vlog'],          description:'手机摄影教程赛道竞争激烈，优质内容涨粉效率高。',                            peakHour:'19:00', updatedAt:'6小时前' },
  { rank:17, title:'二手好物淘货',       platform:'douyin', industry:'ecommerce', heatScore:57, heatDelta:10, videoCount:19300, tags:['二手','闲置','好物','省钱'],              description:'二手经济崛起，淘货分享类内容吸引年轻消费群体关注。',                        peakHour:'21:00', updatedAt:'7小时前' },
  { rank:18, title:'夜市摆摊攻略',       platform:'douyin', industry:'business',  heatScore:55, heatDelta:21, videoCount:14700, tags:['摆摊','夜市','创业','副业'],              description:'副业创业热潮带动摆摊攻略类内容走红，本地服务类品牌受益。',                  peakHour:'18:00', updatedAt:'8小时前' },
  { rank:19, title:'冰淇淋新口味测评',   platform:'douyin', industry:'food',      heatScore:53, heatDelta:6,  videoCount:16800, tags:['冰淇淋','测评','夏日','新口味'],           description:'夏日冷饮新品测评内容热度稳定，食品品牌新品投放首选场景。',                  peakHour:'15:00', updatedAt:'9小时前' },
  { rank:20, title:'校园生活记录',       platform:'douyin', industry:'education', heatScore:51, heatDelta:3,  videoCount:44200, tags:['校园','大学生','毕业季','青春'],           description:'毕业季情绪共鸣内容持续发酵，年轻消费品牌最佳借势时机。',                    peakHour:'23:00', updatedAt:'10小时前' },

  // ── 小红书 ───────────────────────────────────────
  { rank:1,  title:'早C晚A护肤',         platform:'xiaohongshu', industry:'health',    heatScore:98, heatDelta:15, videoCount:42300, tags:['护肤','早C晚A','维C','视黄醇'],     description:'早C晚A护肤组合在小红书掀起大讨论，美妆博主争相测评，话题阅读量破亿。',    peakHour:'21:00', updatedAt:'8分钟前' },
  { rank:2,  title:'家居改造小技巧',     platform:'xiaohongshu', industry:'lifestyle', heatScore:94, heatDelta:14, videoCount:25300, tags:['家居','改造','收纳','低成本装修'], description:'低成本家居改造和收纳技巧持续霸榜，租房族受众庞大，品牌合作需求强烈。',    peakHour:'20:00', updatedAt:'15分钟前' },
  { rank:3,  title:'国潮汉服出行',       platform:'xiaohongshu', industry:'fashion',   heatScore:91, heatDelta:18, videoCount:22100, tags:['汉服','国潮','打卡','传统文化'],   description:'汉服日常出行搭配和景区打卡内容持续增长，传统节庆节点热度尤为突出。',      peakHour:'14:00', updatedAt:'22分钟前' },
  { rank:4,  title:'小众咖啡馆探店',     platform:'xiaohongshu', industry:'food',      heatScore:88, heatDelta:7,  videoCount:19800, tags:['探店','咖啡馆','小众','打卡'],     description:'城市小众咖啡馆探店笔记持续走俏，精致生活方式内容吸引高消费力用户。',      peakHour:'14:00', updatedAt:'35分钟前' },
  { rank:5,  title:'法式通勤穿搭',       platform:'xiaohongshu', industry:'fashion',   heatScore:86, heatDelta:12, videoCount:31700, tags:['法式','通勤','穿搭','气质'],       description:'法式简约风穿搭在小红书持续走俏，高客单价服装品牌种草效果显著。',          peakHour:'08:00', updatedAt:'40分钟前' },
  { rank:6,  title:'空气炸锅食谱',       platform:'xiaohongshu', industry:'food',      heatScore:83, heatDelta:5,  videoCount:28900, tags:['空气炸锅','食谱','减脂餐','懒人'], description:'空气炸锅懒人食谱持续火爆，低卡减脂烹饪方式深受健康饮食人群追捧。',        peakHour:'18:00', updatedAt:'1小时前' },
  { rank:7,  title:'纯欲妆容教程',       platform:'xiaohongshu', industry:'health',    heatScore:81, heatDelta:20, videoCount:38400, tags:['纯欲妆','美妆教程','裸感妆','化妆'],description:'纯欲风妆容教程持续霸榜，相关美妆产品搜索量同步暴增。',                    peakHour:'21:00', updatedAt:'1小时前' },
  { rank:8,  title:'高蛋白减脂食谱',     platform:'xiaohongshu', industry:'health',    heatScore:79, heatDelta:9,  videoCount:21600, tags:['高蛋白','减脂','增肌','健身餐'],   description:'健身饮食搭配内容在小红书增速明显，营养补剂和健康食品品牌投放热门。',      peakHour:'07:00', updatedAt:'2小时前' },
  { rank:9,  title:'旅行穿搭打卡',       platform:'xiaohongshu', industry:'travel',    heatScore:76, heatDelta:11, videoCount:17200, tags:['旅行穿搭','打卡','景点','写真'],   description:'旅行时尚穿搭与目的地打卡内容深度融合，旅游品牌合作空间大。',              peakHour:'10:00', updatedAt:'2小时前' },
  { rank:10, title:'极简主义生活',       platform:'xiaohongshu', industry:'lifestyle', heatScore:74, heatDelta:8,  videoCount:14900, tags:['极简','断舍离','整理','生活方式'], description:'极简生活方式引发都市青年共鸣，整理收纳、二手处理等话题热度持续。',        peakHour:'21:00', updatedAt:'3小时前' },
  { rank:11, title:'平价代替大牌',       platform:'xiaohongshu', industry:'ecommerce', heatScore:72, heatDelta:16, videoCount:45600, tags:['平价替代','大牌平替','省钱','好物'],description:'大牌平替种草笔记互动率极高，电商平台导流效果显著。',                      peakHour:'20:00', updatedAt:'3小时前' },
  { rank:12, title:'自制香薰蜡烛',       platform:'xiaohongshu', industry:'lifestyle', heatScore:70, heatDelta:23, videoCount:12300, tags:['香薰','手工','DIY','慢生活'],       description:'手工制作香薰类内容爆发增长，材料包品牌和精油品牌销量大涨。',              peakHour:'19:00', updatedAt:'4小时前' },
  { rank:13, title:'玻尿酸护肤科普',     platform:'xiaohongshu', industry:'health',    heatScore:68, heatDelta:6,  videoCount:23100, tags:['玻尿酸','护肤科普','成分党','医美'], description:'护肤成分科普内容专业度高，用户信任度强，医美机构和护肤品牌引流效果佳。', peakHour:'22:00', updatedAt:'4小时前' },
  { rank:14, title:'咖啡拉花教程',       platform:'xiaohongshu', industry:'food',      heatScore:65, heatDelta:4,  videoCount:16700, tags:['咖啡','拉花','手冲','咖啡馆'],     description:'在家做咖啡的内容热度持续，咖啡机和咖啡豆品牌种草效果显著。',              peakHour:'09:00', updatedAt:'5小时前' },
  { rank:15, title:'婚礼跟拍记录',       platform:'xiaohongshu', industry:'lifestyle', heatScore:63, heatDelta:10, videoCount:9800,  tags:['婚礼','跟拍','记录','婚庆'],       description:'婚礼记录类内容在小红书持续受欢迎，婚庆摄影机构投放首选平台。',            peakHour:'18:00', updatedAt:'6小时前' },
  { rank:16, title:'宝宝辅食食谱',       platform:'xiaohongshu', industry:'health',    heatScore:61, heatDelta:7,  videoCount:18900, tags:['辅食','宝宝','育儿','营养'],       description:'母婴内容在小红书受众黏性极强，相关品牌投放转化率高于平均水平。',          peakHour:'10:00', updatedAt:'6小时前' },
  { rank:17, title:'色彩搭配理论',       platform:'xiaohongshu', industry:'fashion',   heatScore:59, heatDelta:13, videoCount:14200, tags:['色彩搭配','穿搭理论','色系','形象'], description:'色彩理论应用于穿搭的科普内容深受时尚爱好者追捧，知识付费转化潜力大。',   peakHour:'20:00', updatedAt:'7小时前' },
  { rank:18, title:'家庭烘焙食谱',       platform:'xiaohongshu', industry:'food',      heatScore:57, heatDelta:5,  videoCount:26400, tags:['烘焙','食谱','下午茶','甜点'],     description:'家庭烘焙教程稳居小红书美食热门，烘焙工具和材料品牌持续受益。',            peakHour:'15:00', updatedAt:'8小时前' },
  { rank:19, title:'精致早餐打卡',       platform:'xiaohongshu', industry:'food',      heatScore:55, heatDelta:3,  videoCount:33500, tags:['早餐','打卡','精致生活','健康'],   description:'精致早餐打卡持续输出生活方式内容，食品品牌天然植入场景。',                peakHour:'08:00', updatedAt:'9小时前' },
  { rank:20, title:'独居生活vlog',       platform:'xiaohongshu', industry:'lifestyle', heatScore:53, heatDelta:8,  videoCount:22700, tags:['独居','生活vlog','一人食','城市'],  description:'独居生活记录引发都市青年强烈共鸣，家居电器等品牌精准触达目标用户。',      peakHour:'22:00', updatedAt:'10小时前' },

  // ── 微博 ─────────────────────────────────────────
  { rank:1,  title:'明星同款种草',       platform:'weibo', industry:'ecommerce', heatScore:96, heatDelta:12, videoCount:47800, tags:['明星同款','种草','好物推荐','娱乐营销'], description:'热播剧带动明星周边商品搜索量暴增，品牌借势营销效果显著，转化率创新高。',  peakHour:'21:00', updatedAt:'6分钟前' },
  { rank:2,  title:'考研备考经验',       platform:'weibo', industry:'education', heatScore:92, heatDelta:8,  videoCount:33600, tags:['考研','备考','学习方法','上岸经验'],  description:'考研季来临，备考经验分享和上岸故事持续引发共鸣，教育机构投放性价比高。', peakHour:'23:00', updatedAt:'18分钟前' },
  { rank:3,  title:'品牌联名营销',       platform:'weibo', industry:'ecommerce', heatScore:89, heatDelta:16, videoCount:28400, tags:['品牌联名','跨界','营销','限定款'],     description:'知名品牌跨界联名持续制造话题，微博超话讨论度高，带动限定产品迅速售罄。', peakHour:'12:00', updatedAt:'25分钟前' },
  { rank:4,  title:'热播剧集讨论',       platform:'weibo', industry:'education', heatScore:86, heatDelta:24, videoCount:89300, tags:['热剧','追剧','剧评','二创'],           description:'热播剧集引发大量二创和讨论内容，相关话题持续登上热搜榜。',               peakHour:'22:00', updatedAt:'35分钟前' },
  { rank:5,  title:'公益话题讨论',       platform:'weibo', industry:'lifestyle', heatScore:84, heatDelta:6,  videoCount:52100, tags:['公益','环保','话题','正能量'],          description:'公益倡导类话题在微博传播力强，品牌参与社会责任营销效果显著。',            peakHour:'10:00', updatedAt:'45分钟前' },
  { rank:6,  title:'财经热点解读',       platform:'weibo', industry:'business',  heatScore:82, heatDelta:10, videoCount:31200, tags:['财经','热点','解读','投资'],             description:'经济热点解读内容在微博高净值用户群体中流量稳定，金融品牌首选投放场景。', peakHour:'09:00', updatedAt:'1小时前' },
  { rank:7,  title:'体育赛事直播',       platform:'weibo', industry:'lifestyle', heatScore:80, heatDelta:31, videoCount:76500, tags:['体育','赛事','直播','国足'],             description:'重要体育赛事期间微博话题热度暴涨，运动品牌营销窗口期明确。',              peakHour:'20:00', updatedAt:'1小时前' },
  { rank:8,  title:'科技产品发布',       platform:'weibo', industry:'ecommerce', heatScore:77, heatDelta:19, videoCount:24800, tags:['科技','新品发布','手机','数码'],         description:'科技新品发布会引爆微博讨论，首批用户评测内容互动率极高。',                peakHour:'14:00', updatedAt:'2小时前' },
  { rank:9,  title:'情感话题征集',       platform:'weibo', industry:'lifestyle', heatScore:75, heatDelta:5,  videoCount:61700, tags:['情感','话题','征集','共鸣'],             description:'情感共鸣类征集话题在微博传播广，用户参与度持续稳定。',                    peakHour:'22:00', updatedAt:'2小时前' },
  { rank:10, title:'职场维权话题',       platform:'weibo', industry:'business',  heatScore:73, heatDelta:28, videoCount:43200, tags:['职场','维权','劳动法','热议'],           description:'职场权益类话题讨论量持续高企，相关法律服务平台流量增长明显。',            peakHour:'12:00', updatedAt:'3小时前' },
  { rank:11, title:'明星代言评测',       platform:'weibo', industry:'ecommerce', heatScore:71, heatDelta:7,  videoCount:37400, tags:['明星代言','评测','粉丝经济','品牌'],    description:'明星代言产品真实使用测评在微博传播快，粉丝转化购买率可观。',              peakHour:'20:00', updatedAt:'3小时前' },
  { rank:12, title:'高考志愿填报',       platform:'weibo', industry:'education', heatScore:69, heatDelta:42, videoCount:28900, tags:['高考','志愿填报','大学','专业'],         description:'高考季志愿填报话题热度暴涨，教育咨询和高校招生类内容流量激增。',          peakHour:'22:00', updatedAt:'4小时前' },
  { rank:13, title:'城市旅游攻略',       platform:'weibo', industry:'travel',    heatScore:67, heatDelta:9,  videoCount:22100, tags:['旅游','城市','攻略','打卡'],             description:'城市旅游攻略内容在微博传播广泛，酒店和景区品牌合作空间大。',              peakHour:'10:00', updatedAt:'4小时前' },
  { rank:14, title:'健康科普知识',       platform:'weibo', industry:'health',    heatScore:65, heatDelta:4,  videoCount:19500, tags:['健康','科普','医学','养生'],             description:'专业健康科普内容在微博受到广泛传播，医疗机构品牌建设最佳渠道之一。',      peakHour:'11:00', updatedAt:'5小时前' },
  { rank:15, title:'新能源汽车测评',     platform:'weibo', industry:'ecommerce', heatScore:63, heatDelta:15, videoCount:16300, tags:['新能源','汽车','测评','电动车'],         description:'新能源汽车赛道持续火热，详细测评内容帮助消费者决策，品牌口碑建设佳。',    peakHour:'20:00', updatedAt:'6小时前' },
  { rank:16, title:'国庆出行计划',       platform:'weibo', industry:'travel',    heatScore:61, heatDelta:22, videoCount:34800, tags:['国庆','出行','旅游','假期'],             description:'长假出行计划讨论提前发酵，交通和酒店预订平台流量显著提升。',              peakHour:'21:00', updatedAt:'6小时前' },
  { rank:17, title:'减肥打卡日记',       platform:'weibo', industry:'health',    heatScore:59, heatDelta:6,  videoCount:41600, tags:['减肥','打卡','日记','变美'],             description:'减肥打卡日记类内容引发广泛共鸣，健康食品和运动品牌精准触达目标人群。',    peakHour:'22:00', updatedAt:'7小时前' },
  { rank:18, title:'美食节目幕后',       platform:'weibo', industry:'food',      heatScore:57, heatDelta:3,  videoCount:18700, tags:['美食节目','幕后','综艺','食材'],         description:'热门美食综艺幕后内容引发粉丝追捧，相关食材和品牌热度同步提升。',          peakHour:'21:00', updatedAt:'8小时前' },
  { rank:19, title:'社会新闻评论',       platform:'weibo', industry:'education', heatScore:55, heatDelta:10, videoCount:72300, tags:['社会新闻','评论','热议','舆论'],         description:'社会热点新闻评论互动量高，媒体和评论类账号粉丝增长明显。',                peakHour:'10:00', updatedAt:'9小时前' },
  { rank:20, title:'宠物萌照征集',       platform:'weibo', industry:'lifestyle', heatScore:53, heatDelta:5,  videoCount:29400, tags:['宠物','萌照','猫狗','话题征集'],         description:'宠物萌照征集话题长期保持活跃，宠物食品和用品品牌精准投放。',              peakHour:'20:00', updatedAt:'10小时前' },

  // ── B站 ──────────────────────────────────────────
  { rank:1,  title:'猫咪日常vlog',       platform:'bilibili', industry:'lifestyle', heatScore:95, heatDelta:-3, videoCount:31200, tags:['猫咪','宠物vlog','橘猫','布偶猫'],    description:'猫咪日常生活记录类内容稳定高播放，折叠猫、平躺猫等萌宠切片走红全平台。', peakHour:'22:00', updatedAt:'7分钟前' },
  { rank:2,  title:'折叠屏手机体验',     platform:'bilibili', industry:'ecommerce', heatScore:90, heatDelta:31, videoCount:19600, tags:['折叠屏','手机评测','华为','三星'],    description:'新一代折叠屏手机集中发布，开箱评测和使用体验内容冲上热搜，数码区流量暴涨。',peakHour:'20:00', updatedAt:'20分钟前' },
  { rank:3,  title:'AI绘画工具测评',     platform:'bilibili', industry:'education', heatScore:87, heatDelta:25, videoCount:12100, tags:['AI绘画','Midjourney','AIGC','设计'],  description:'AI创作工具持续更新迭代，B站技术向博主测评内容播放量稳步增长，专业受众黏性强。',peakHour:'21:00', updatedAt:'30分钟前' },
  { rank:4,  title:'手工制作DIY',        platform:'bilibili', industry:'lifestyle', heatScore:84, heatDelta:-2, videoCount:14700, tags:['手工','DIY','编织','手作'],           description:'B站手工区持续活跃，编织、陶艺、手工皮具等慢生活内容受到年轻创作者青睐。', peakHour:'20:00', updatedAt:'45分钟前' },
  { rank:5,  title:'历史纪录片解说',     platform:'bilibili', industry:'education', heatScore:82, heatDelta:7,  videoCount:28400, tags:['历史','纪录片','解说','知识'],         description:'历史科普和纪录片解说是B站长效流量池，专业内容吸引高黏性垂直用户群。',    peakHour:'21:00', updatedAt:'1小时前' },
  { rank:6,  title:'电吉他教学',         platform:'bilibili', industry:'education', heatScore:79, heatDelta:11, videoCount:9800,  tags:['电吉他','教学','音乐','乐器'],         description:'乐器教学内容在B站长期保持热度，乐器品牌种草效果突出。',                  peakHour:'19:00', updatedAt:'1小时前' },
  { rank:7,  title:'宇宙科学科普',       platform:'bilibili', industry:'education', heatScore:77, heatDelta:14, videoCount:22300, tags:['宇宙','科学','科普','天文'],           description:'硬核科学科普视频在B站受到年轻知识分子追捧，话题深度影响力强。',           peakHour:'22:00', updatedAt:'2小时前' },
  { rank:8,  title:'独立游戏推荐',       platform:'bilibili', industry:'education', heatScore:75, heatDelta:18, videoCount:17600, tags:['独立游戏','推荐','Steam','PC'],        description:'独立游戏推荐内容流量稳定，游戏平台品牌投放性价比高。',                    peakHour:'22:00', updatedAt:'2小时前' },
  { rank:9,  title:'车载改装分享',       platform:'bilibili', industry:'ecommerce', heatScore:73, heatDelta:8,  videoCount:11200, tags:['汽车','改装','车载','配件'],           description:'汽车改装分享内容在B站受车友热烈追捧，汽配品牌精准种草场景。',             peakHour:'20:00', updatedAt:'3小时前' },
  { rank:10, title:'三餐食谱记录',       platform:'bilibili', industry:'food',      heatScore:71, heatDelta:5,  videoCount:16800, tags:['三餐','食谱','料理','美食'],           description:'一人食和家常菜食谱vlog在B站收获稳定流量，食品和厨具品牌最佳合作场景。',   peakHour:'18:00', updatedAt:'3小时前' },
  { rank:11, title:'模型手办开箱',       platform:'bilibili', industry:'ecommerce', heatScore:69, heatDelta:9,  videoCount:8700,  tags:['手办','开箱','模型','动漫'],           description:'手办开箱和二次元内容在B站保持高度活跃，IP联名品牌精准触达核心受众。',    peakHour:'21:00', updatedAt:'4小时前' },
  { rank:12, title:'编程学习路线',       platform:'bilibili', industry:'education', heatScore:67, heatDelta:12, videoCount:14300, tags:['编程','学习','Python','前端'],         description:'编程教育内容需求旺盛，在线教育平台和书籍品牌引流效果优秀。',               peakHour:'22:00', updatedAt:'4小时前' },
  { rank:13, title:'环球旅行记录',       platform:'bilibili', industry:'travel',    heatScore:65, heatDelta:6,  videoCount:12500, tags:['旅行','环球','vlog','海外'],           description:'长途旅行记录类vlog在B站播放量稳定，旅行装备和保险品牌合作价值高。',       peakHour:'21:00', updatedAt:'5小时前' },
  { rank:14, title:'电影解说UP主',       platform:'bilibili', industry:'education', heatScore:63, heatDelta:4,  videoCount:39200, tags:['电影','解说','影评','推荐'],           description:'电影解说是B站最稳定的内容赛道之一，流媒体和视频平台投放首选。',           peakHour:'22:00', updatedAt:'5小时前' },
  { rank:15, title:'健身房新手指南',     platform:'bilibili', industry:'health',    heatScore:61, heatDelta:7,  videoCount:18900, tags:['健身房','新手','训练','动作'],         description:'健身新手向教程在B站增速快，健身器材和补剂品牌转化效果佳。',               peakHour:'06:00', updatedAt:'6小时前' },
  { rank:16, title:'经典动漫重温',       platform:'bilibili', industry:'education', heatScore:59, heatDelta:3,  videoCount:26700, tags:['动漫','经典','重温','二次元'],         description:'经典动漫重温内容在B站具有持久流量，IP衍生品牌借势效果好。',               peakHour:'23:00', updatedAt:'7小时前' },
  { rank:17, title:'理财入门知识',       platform:'bilibili', industry:'business',  heatScore:57, heatDelta:10, videoCount:10400, tags:['理财','投资','入门','基金'],           description:'理财科普内容在B站年轻用户群体中传播广泛，金融品牌精准触达用户需求期。',   peakHour:'21:00', updatedAt:'8小时前' },
  { rank:18, title:'二次元舞蹈翻跳',     platform:'bilibili', industry:'education', heatScore:55, heatDelta:15, videoCount:21300, tags:['翻跳','舞蹈','二次元','宅舞'],         description:'宅舞翻跳内容持续活跃，电子音乐和舞蹈相关品牌合作价值显著。',               peakHour:'20:00', updatedAt:'8小时前' },
  { rank:19, title:'古典音乐赏析',       platform:'bilibili', industry:'education', heatScore:53, heatDelta:2,  videoCount:7200,  tags:['古典音乐','赏析','交响乐','钢琴'],     description:'古典音乐科普受到B站高质量用户偏爱，文化类品牌形象建设优选渠道。',         peakHour:'22:00', updatedAt:'9小时前' },
  { rank:20, title:'海外留学经验',       platform:'bilibili', industry:'education', heatScore:51, heatDelta:8,  videoCount:13600, tags:['留学','海外','经验分享','申请'],       description:'留学经验分享内容受到应届生和家长关注，教育中介和语言培训机构首选投放。',   peakHour:'22:00', updatedAt:'10小时前' },

  // ── 快手 ─────────────────────────────────────────
  { rank:1,  title:'三农生活记录',       platform:'kuaishou', industry:'lifestyle', heatScore:97, heatDelta:3,  videoCount:71200, tags:['三农','农村生活','田园','乡村振兴'],   description:'快手三农内容生态成熟，真实乡村生活记录受到城市用户广泛关注，品牌带货效果佳。',peakHour:'20:00', updatedAt:'4分钟前' },
  { rank:2,  title:'烘焙甜品DIY',        platform:'kuaishou', industry:'food',      heatScore:93, heatDelta:9,  videoCount:38200, tags:['烘焙','甜品','DIY','下午茶'],          description:'家庭烘焙教程持续走俏，马卡龙、可颂等高颜值甜品制作视频互动数据亮眼。',   peakHour:'15:00', updatedAt:'16分钟前' },
  { rank:3,  title:'农产品直播带货',     platform:'kuaishou', industry:'ecommerce', heatScore:90, heatDelta:12, videoCount:48300, tags:['农产品','直播带货','原产地','新鲜'],   description:'原产地直播带货模式在快手深入人心，农特产品品牌借助平台快速触达下沉市场。',peakHour:'19:00', updatedAt:'28分钟前' },
  { rank:4,  title:'东北家常菜教程',     platform:'kuaishou', industry:'food',      heatScore:87, heatDelta:6,  videoCount:34600, tags:['东北菜','家常菜','料理','美食'],       description:'地域特色家常菜教程在快手表现亮眼，食材和调料品牌精准触达下沉市场。',     peakHour:'17:00', updatedAt:'40分钟前' },
  { rank:5,  title:'摩托车骑行记录',     platform:'kuaishou', industry:'travel',    heatScore:84, heatDelta:15, videoCount:27800, tags:['摩托车','骑行','自驾','公路'],         description:'摩托车骑行记录类内容在快手拥有忠实受众群体，汽配和户外品牌合作价值高。', peakHour:'07:00', updatedAt:'1小时前' },
  { rank:6,  title:'农村建房全记录',     platform:'kuaishou', industry:'realestate',heatScore:82, heatDelta:8,  videoCount:19400, tags:['建房','农村','自建房','家装'],         description:'农村自建房全程记录在快手受众广泛，建材和家居品牌精准下沉触达场景。',     peakHour:'21:00', updatedAt:'1小时前' },
  { rank:7,  title:'老手艺传承',         platform:'kuaishou', industry:'lifestyle', heatScore:79, heatDelta:4,  videoCount:15600, tags:['手艺','传承','非遗','匠人'],           description:'传统老手艺记录内容在快手具有情感共鸣，文化品牌和地方政府合作首选。',     peakHour:'20:00', updatedAt:'2小时前' },
  { rank:8,  title:'快手小游戏直播',     platform:'kuaishou', industry:'education', heatScore:77, heatDelta:20, videoCount:63200, tags:['小游戏','直播','互动','福利'],         description:'快手小游戏直播互动模式成熟，游戏品牌投放用户触达效率高。',                peakHour:'21:00', updatedAt:'2小时前' },
  { rank:9,  title:'夫妻日常搞笑',       platform:'kuaishou', industry:'lifestyle', heatScore:75, heatDelta:7,  videoCount:54700, tags:['夫妻','日常','搞笑','家庭'],           description:'家庭日常搞笑内容是快手长期热门赛道，生活类品牌精准植入场景丰富。',       peakHour:'21:00', updatedAt:'3小时前' },
  { rank:10, title:'汽修养护技巧',       platform:'kuaishou', industry:'ecommerce', heatScore:73, heatDelta:5,  videoCount:12800, tags:['汽修','养护','DIY','省钱'],           description:'汽车养护技巧内容在快手受车主群体追捧，汽配品牌精准种草效果佳。',         peakHour:'20:00', updatedAt:'3小时前' },
  { rank:11, title:'农村婚礼记录',       platform:'kuaishou', industry:'lifestyle', heatScore:71, heatDelta:3,  videoCount:21400, tags:['婚礼','农村','记录','传统'],           description:'农村婚礼记录内容展现地域文化差异，婚庆类品牌下沉市场布局重要参考。',     peakHour:'15:00', updatedAt:'4小时前' },
  { rank:12, title:'厨艺比拼挑战',       platform:'kuaishou', industry:'food',      heatScore:69, heatDelta:11, videoCount:29100, tags:['厨艺','挑战','比拼','美食'],           description:'厨艺挑战类互动内容在快手参与度高，食品品牌借势互动营销效果显著。',       peakHour:'19:00', updatedAt:'5小时前' },
  { rank:13, title:'街头街访节目',       platform:'kuaishou', industry:'lifestyle', heatScore:67, heatDelta:14, videoCount:17300, tags:['街访','街头','社会','话题'],           description:'街头采访类内容在快手传播广泛，社会话题类品牌借势效果好。',               peakHour:'19:00', updatedAt:'5小时前' },
  { rank:14, title:'孩子教育分享',       platform:'kuaishou', industry:'education', heatScore:65, heatDelta:6,  videoCount:14900, tags:['教育','孩子','家长','成长'],           description:'亲子教育类内容在快手家长群体中广泛传播，教育品牌触达下沉市场最佳渠道。', peakHour:'21:00', updatedAt:'6小时前' },
  { rank:15, title:'驾校学车经验',       platform:'kuaishou', industry:'education', heatScore:63, heatDelta:8,  videoCount:11200, tags:['驾校','学车','科目二','经验'],         description:'驾校学车经验分享需求旺盛，驾校品牌本地投放精准触达潜在用户。',           peakHour:'20:00', updatedAt:'7小时前' },
  { rank:16, title:'小本生意创业',       platform:'kuaishou', industry:'business',  heatScore:61, heatDelta:17, videoCount:9800,  tags:['小本创业','生意','摆摊','副业'],       description:'小本生意经验分享在快手受到创业群体追捧，B2B类服务品牌精准触达。',         peakHour:'20:00', updatedAt:'7小时前' },
  { rank:17, title:'健康养生食补',       platform:'kuaishou', industry:'health',    heatScore:59, heatDelta:4,  videoCount:23700, tags:['养生','食补','中医','健康'],           description:'传统养生食补内容在快手受到中老年用户追捧，保健品品牌精准投放场景。',     peakHour:'10:00', updatedAt:'8小时前' },
  { rank:18, title:'五金工具使用',       platform:'kuaishou', industry:'ecommerce', heatScore:57, heatDelta:5,  videoCount:8400,  tags:['五金','工具','维修','动手'],           description:'五金工具使用教程在快手受到广大男性用户追捧，工具品牌精准触达。',         peakHour:'20:00', updatedAt:'9小时前' },
  { rank:19, title:'变装穿搭秀',         platform:'kuaishou', industry:'fashion',   heatScore:55, heatDelta:9,  videoCount:41800, tags:['变装','穿搭','秀','帅气'],             description:'变装类内容完播率极高，服装和美妆品牌借助创意内容实现病毒式传播。',       peakHour:'20:00', updatedAt:'9小时前' },
  { rank:20, title:'房车自驾游',         platform:'kuaishou', industry:'travel',    heatScore:53, heatDelta:7,  videoCount:16300, tags:['房车','自驾','旅游','自由'],           description:'房车自驾游生活方式内容在快手具有独特圈层号召力，户外品牌合作价值高。',   peakHour:'21:00', updatedAt:'10小时前' },

  // ── 视频号 ───────────────────────────────────────
  { rank:1,  title:'职场穿搭指南',       platform:'channels', industry:'fashion',   heatScore:96, heatDelta:6,  videoCount:16500, tags:['职场穿搭','通勤','OL风','职业装'],     description:'视频号职场内容生态成熟，职场穿搭和形象管理类内容在25-35岁白领群体中广泛传播。',peakHour:'12:00', updatedAt:'9分钟前' },
  { rank:2,  title:'新中式家装风',       platform:'channels', industry:'realestate',heatScore:92, heatDelta:19, videoCount:8900,  tags:['新中式','家装','国风','装修风格'],     description:'新中式家装风格在视频号和小红书持续升温，搭配国潮元素的家居方案受到追捧。',peakHour:'19:00', updatedAt:'18分钟前' },
  { rank:3,  title:'私域流量运营',       platform:'channels', industry:'business',  heatScore:89, heatDelta:13, videoCount:6300,  tags:['私域','运营','增长','社群'],           description:'私域流量运营方法论在视频号企业主群体中广泛传播，SaaS服务品牌精准触达。',  peakHour:'10:00', updatedAt:'25分钟前' },
  { rank:4,  title:'中年保健养生',       platform:'channels', industry:'health',    heatScore:87, heatDelta:5,  videoCount:24700, tags:['保健','养生','中年','健康管理'],       description:'中老年健康管理内容是视频号优势赛道，保健品和医疗服务品牌精准触达。',     peakHour:'09:00', updatedAt:'35分钟前' },
  { rank:5,  title:'企业家故事分享',     platform:'channels', industry:'business',  heatScore:84, heatDelta:9,  videoCount:4800,  tags:['企业家','故事','创业','经验'],         description:'企业家访谈和创业故事在视频号高净值用户群体中具有强烈共鸣，B2B品牌首选。',peakHour:'20:00', updatedAt:'45分钟前' },
  { rank:6,  title:'理财规划知识',       platform:'channels', industry:'business',  heatScore:82, heatDelta:11, videoCount:9200,  tags:['理财','规划','资产配置','保险'],       description:'理财规划科普内容在视频号具有高消费力受众，金融和保险品牌精准投放。',     peakHour:'21:00', updatedAt:'1小时前' },
  { rank:7,  title:'传统文化传承',       platform:'channels', industry:'education', heatScore:79, heatDelta:7,  videoCount:12400, tags:['传统文化','传承','国学','经典'],       description:'国学和传统文化内容在视频号受到中产阶级追捧，文化品牌建设最佳场景。',     peakHour:'20:00', updatedAt:'1小时前' },
  { rank:8,  title:'家庭教育方法',       platform:'channels', industry:'education', heatScore:77, heatDelta:8,  videoCount:18700, tags:['家庭教育','育儿','亲子','方法'],       description:'家庭教育方法论在视频号家长群体中持续传播，教育品牌和亲子服务投放优选。', peakHour:'21:00', updatedAt:'2小时前' },
  { rank:9,  title:'职场技能提升',       platform:'channels', industry:'education', heatScore:75, heatDelta:14, videoCount:7600,  tags:['职场','技能','提升','进阶'],           description:'职场软技能和硬技能提升内容精准触达职场人群，在线教育平台合作价值高。',   peakHour:'12:00', updatedAt:'2小时前' },
  { rank:10, title:'亲子研学游学',       platform:'channels', industry:'travel',    heatScore:73, heatDelta:16, videoCount:5400,  tags:['研学','游学','亲子','教育旅行'],       description:'亲子研学旅行在视频号高消费家庭中具有强号召力，教育旅游品牌首选投放。',   peakHour:'20:00', updatedAt:'3小时前' },
  { rank:11, title:'高端定制旅游',       platform:'channels', industry:'travel',    heatScore:71, heatDelta:6,  videoCount:3900,  tags:['定制旅游','高端','出境','奢旅'],       description:'高端定制旅游内容在视频号高净值用户群体中具有精准触达效果。',               peakHour:'20:00', updatedAt:'3小时前' },
  { rank:12, title:'医美科普指南',       platform:'channels', industry:'health',    heatScore:69, heatDelta:18, videoCount:11200, tags:['医美','科普','整形','注射'],           description:'医美科普在视频号女性用户群体中传播广泛，医美机构品牌获客成本较低。',     peakHour:'21:00', updatedAt:'4小时前' },
  { rank:13, title:'豪宅样板间鉴赏',     platform:'channels', industry:'realestate',heatScore:67, heatDelta:10, videoCount:6100,  tags:['豪宅','样板间','装修','设计'],         description:'豪宅和高端装修鉴赏内容吸引高消费力用户，房地产品牌精准品牌建设。',       peakHour:'19:00', updatedAt:'5小时前' },
  { rank:14, title:'葡萄酒品鉴',         platform:'channels', industry:'food',      heatScore:65, heatDelta:4,  videoCount:4700,  tags:['葡萄酒','品鉴','红酒','生活方式'],     description:'葡萄酒品鉴内容在视频号中高端用户群体中受到追捧，进口酒品牌合作价值高。', peakHour:'20:00', updatedAt:'5小时前' },
  { rank:15, title:'健身私教攻略',       platform:'channels', industry:'health',    heatScore:63, heatDelta:7,  videoCount:8900,  tags:['私教','健身','减脂','塑形'],           description:'健身私教内容在视频号中高端消费群体中精准传播，健身房品牌获客效率高。',   peakHour:'07:00', updatedAt:'6小时前' },
  { rank:16, title:'国际教育资讯',       platform:'channels', industry:'education', heatScore:61, heatDelta:9,  videoCount:5200,  tags:['国际学校','教育资讯','出国','双语'],   description:'国际教育资讯内容精准触达高收入家庭，国际学校和教育咨询品牌首选渠道。',   peakHour:'21:00', updatedAt:'7小时前' },
  { rank:17, title:'商务着装指南',       platform:'channels', industry:'fashion',   heatScore:59, heatDelta:5,  videoCount:6400,  tags:['商务','着装','形象管理','西装'],       description:'商务形象管理内容在视频号职业人士群体中广受欢迎，高端服装品牌合作价值高。',peakHour:'12:00', updatedAt:'7小时前' },
  { rank:18, title:'艺术品收藏入门',     platform:'channels', industry:'education', heatScore:57, heatDelta:3,  videoCount:3100,  tags:['艺术品','收藏','入门','投资'],         description:'艺术品收藏科普内容吸引高净值人群关注，艺术机构和拍卖行品牌建设渠道。',   peakHour:'20:00', updatedAt:'8小时前' },
  { rank:19, title:'母婴用品测评',       platform:'channels', industry:'health',    heatScore:55, heatDelta:6,  videoCount:14200, tags:['母婴','测评','好物','宝宝'],           description:'高端母婴用品测评在视频号高消费家庭中具有精准触达优势，母婴品牌首选。',   peakHour:'21:00', updatedAt:'9小时前' },
  { rank:20, title:'小众运动推广',       platform:'channels', industry:'health',    heatScore:53, heatDelta:8,  videoCount:4600,  tags:['小众运动','飞盘','桨板','网球'],       description:'新兴小众运动内容在视频号中高端年轻用户中传播广泛，运动品牌精准种草。',   peakHour:'18:00', updatedAt:'10小时前' },
]

// 生成完整数据（带图片和链接）
export const mockTrends: TrendItem[] = raw.map((item, i) => ({
  ...item,
  id: `${item.platform}_${item.rank}`,
  trendData: td(item.heatScore, item.heatDelta),
  thumbnail: img(`${item.platform}${i + 1}`),
  link: PLATFORM_CFG[item.platform].searchUrl(item.title),
  isFavorited: false,
}))
