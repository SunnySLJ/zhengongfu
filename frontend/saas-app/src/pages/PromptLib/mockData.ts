export type PromptCategory = '风格' | '场景' | '产品' | '人物' | '氛围' | '运镜'

export interface PromptItem {
  id: string
  title: string
  prompt: string           // full prompt text
  promptZh: string         // Chinese description
  category: PromptCategory
  tags: string[]
  useCount: number
  isFavorited: boolean
  isCustom: boolean
  createdAt: string
}

export const mockPrompts: PromptItem[] = [
  {
    id: 'p1', title: '赛博朋克城市夜景',
    prompt: 'Cyberpunk cityscape at night, neon lights reflecting on wet streets, ultra-detailed, cinematic lighting, 8K, volumetric fog, rain, bokeh background',
    promptZh: '赛博朋克风格城市夜景，霓虹灯倒映在湿漉漉的街道上，超高细节，电影级光影，景深虚化背景',
    category: '风格', tags: ['赛博朋克', '城市', '夜景', '霓虹'],
    useCount: 3821, isFavorited: true, isCustom: false, createdAt: '2025-01-10',
  },
  {
    id: 'p2', title: '清新自然产品展示',
    prompt: 'Product photography, natural light, clean white background, fresh green leaves as props, soft shadows, minimalist composition, commercial style',
    promptZh: '产品摄影风格，自然光，纯白背景，新鲜绿叶作为道具，柔和阴影，简洁构图，商业广告风格',
    category: '产品', tags: ['产品展示', '白背景', '自然光', '简约'],
    useCount: 5241, isFavorited: false, isCustom: false, createdAt: '2025-01-15',
  },
  {
    id: 'p3', title: '古风写意山水',
    prompt: 'Chinese ink painting style, misty mountains, pine trees, traditional art, brush strokes, poetic atmosphere, vertical composition, soft color palette',
    promptZh: '中国水墨画风格，云雾缭绕的山峦，松树，传统艺术，笔触感，诗意氛围，竖版构图，柔和色调',
    category: '风格', tags: ['古风', '水墨', '山水', '国风'],
    useCount: 2130, isFavorited: true, isCustom: false, createdAt: '2025-01-20',
  },
  {
    id: 'p4', title: '时尚街拍人物',
    prompt: 'Street style fashion photography, urban background, natural pose, OOTD, editorial look, 35mm lens, shallow depth of field, golden hour lighting',
    promptZh: '街拍时尚摄影，城市背景，自然姿态，日常穿搭，编辑风格，35mm镜头，浅景深，黄金时段光线',
    category: '人物', tags: ['街拍', '穿搭', '时尚', '人像'],
    useCount: 4562, isFavorited: false, isCustom: false, createdAt: '2025-02-01',
  },
  {
    id: 'p5', title: '慢镜头食物特写',
    prompt: 'Slow motion food video, extreme macro close-up, melting chocolate dripping, steam rising, appetizing colors, 120fps, studio lighting, dark background',
    promptZh: '慢镜头食物视频，极致微距特写，巧克力缓缓流淌，热气升腾，食欲色彩，120帧，摄影棚打光，深色背景',
    category: '场景', tags: ['美食', '慢镜头', '特写', '诱人'],
    useCount: 6108, isFavorited: false, isCustom: false, createdAt: '2025-02-10',
  },
  {
    id: 'p6', title: '温暖咖啡馆氛围',
    prompt: 'Cozy cafe interior, warm amber lighting, latte art, wooden table, morning sunlight through window, film grain, hygge aesthetic, shallow DOF',
    promptZh: '温馨咖啡馆内景，暖琥珀色灯光，拿铁拉花，木质桌面，晨光透过窗户，胶片颗粒，北欧舒适风，浅景深',
    category: '氛围', tags: ['咖啡馆', '温暖', '氛围', '胶片'],
    useCount: 3390, isFavorited: true, isCustom: false, createdAt: '2025-02-15',
  },
  {
    id: 'p7', title: '环绕跟随运镜',
    prompt: 'Orbit camera movement around subject, 360-degree rotation, smooth motion, subject stays centered, background blurs in motion, dynamic energy',
    promptZh: '环绕拍摄主体运镜，360度旋转，流畅移动，主体保持居中，背景在运动中模糊，充满动感活力',
    category: '运镜', tags: ['运镜', '环绕', '跟随', '动态'],
    useCount: 1870, isFavorited: false, isCustom: false, createdAt: '2025-02-20',
  },
  {
    id: 'p8', title: '未来科技感产品',
    prompt: 'Futuristic tech product render, holographic UI overlays, blue glow, dark background, floating particles, isometric perspective, high-tech corporate style',
    promptZh: '未来科技感产品渲染，全息UI叠加，蓝色光晕，深色背景，漂浮粒子，等角透视，高科技企业风格',
    category: '产品', tags: ['科技感', '未来', '产品', '全息'],
    useCount: 2945, isFavorited: false, isCustom: false, createdAt: '2025-03-01',
  },
  {
    id: 'p9', title: '我的自定义提示词',
    prompt: 'Minimalist flat lay, pastel colors, top-down view, lifestyle products arranged artfully, soft natural light, Instagram aesthetic',
    promptZh: '极简平铺摄影，马卡龙色系，俯拍视角，生活方式产品艺术排列，柔和自然光，INS风格',
    category: '场景', tags: ['平铺', '俯拍', '马卡龙', 'INS风'],
    useCount: 12, isFavorited: false, isCustom: true, createdAt: '2025-03-10',
  },
]
