import type { User, Team, LoginForm, RegisterForm } from '../../types/auth'

// Simulates network delay
const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms))

export async function mockLogin(form: LoginForm): Promise<{ token: string; user: User; team: Team }> {
  await delay()
  if (form.phone === '13800000000' && form.password === '123456') {
    throw new Error('密码错误')
  }
  const user: User = {
    id: 'u_001',
    phone: form.phone,
    name: '管理员',
    role: 'owner',
    teamId: 't_001',
  }
  const team: Team = {
    id: 't_001',
    name: '我的团队',
    memberCount: 5,
    storeCount: 2,
    plan: 'pro',
    createdAt: '2024-01-01',
  }
  return { token: 'mock_token_' + Date.now(), user, team }
}

export async function mockRegister(form: RegisterForm): Promise<{ token: string; user: User; team: Team }> {
  await delay()
  const user: User = {
    id: 'u_' + Date.now(),
    phone: form.phone,
    name: form.name,
    role: 'owner',
    teamId: 't_' + Date.now(),
  }
  const team: Team = {
    id: user.teamId,
    name: form.teamName,
    memberCount: 1,
    storeCount: 0,
    plan: 'free',
    createdAt: new Date().toISOString().split('T')[0],
  }
  return { token: 'mock_token_' + Date.now(), user, team }
}
