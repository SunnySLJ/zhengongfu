import type { TeamMember, Store } from '../../types/auth'

export const mockMembers: TeamMember[] = [
  { id: 'm1', userId: 'u_001', name: '管理员', phone: '138****0001', role: 'owner', joinedAt: '2024-01-01', status: 'active' },
  { id: 'm2', userId: 'u_002', name: '张小红', phone: '139****0002', role: 'admin', joinedAt: '2024-02-15', status: 'active' },
  { id: 'm3', userId: 'u_003', name: '李明', phone: '136****0003', role: 'member', joinedAt: '2024-03-01', status: 'active' },
  { id: 'm4', userId: 'u_004', name: '王芳', phone: '135****0004', role: 'member', joinedAt: '2024-03-10', status: 'invited' },
  { id: 'm5', userId: 'u_005', name: '赵强', phone: '137****0005', role: 'member', joinedAt: '2024-04-01', status: 'active' },
]

export const mockStores: Store[] = [
  { id: 's1', name: '上海旗舰店', address: '上海市浦东新区陆家嘴金融中心', memberCount: 3, createdAt: '2024-01-15' },
  { id: 's2', name: '北京直营店', address: '北京市朝阳区国贸商务区', memberCount: 2, createdAt: '2024-02-20' },
]
