export const INDUSTRIES = [
  { label: '全部', value: '' },
  { label: '电商类', value: 'ecommerce' },
  { label: '大健康', value: 'health' },
  { label: '服装类', value: 'fashion' },
  { label: '本地餐饮', value: 'food' },
  { label: '出游娱乐', value: 'travel' },
  { label: '生活服务', value: 'lifestyle' },
  { label: '商业服务', value: 'business' },
  { label: '教育培训', value: 'education' },
  { label: '工厂经销商', value: 'factory' },
  { label: '房地产', value: 'realestate' },
  { label: '海外爆款', value: 'overseas' },
]

export const COPYWRITING_TYPES = [
  { label: '全部', value: '' },
  { label: '新闻体文案', value: 'news' },
  { label: '人设文案', value: 'persona' },
  { label: '营销文案', value: 'marketing' },
]

export const TEMPLATE_TYPES = [
  { label: '全部', value: '' },
  { label: '强促销', value: 'promo' },
  { label: '种草类', value: 'recommend' },
  { label: '图片类', value: 'image' },
  { label: '直播间引导', value: 'live' },
  { label: '引流获客', value: 'traffic' },
  { label: '招商加盟', value: 'franchise' },
  { label: '大字报', value: 'bigtext' },
  { label: '人设', value: 'persona' },
  { label: '数字人', value: 'digital' },
]

export const TEMPLATE_DURATIONS = [
  { label: '全部', value: '' },
  { label: '0-15s', value: '0-15' },
  { label: '15-30s', value: '15-30' },
  { label: '30-60s', value: '30-60' },
  { label: '>60s', value: '60+' },
]

export const INDUSTRY_LABEL: Record<string, string> = Object.fromEntries(
  INDUSTRIES.filter(i => i.value).map(i => [i.value, i.label])
)

export const COPYWRITING_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  COPYWRITING_TYPES.filter(t => t.value).map(t => [t.value, t.label])
)
