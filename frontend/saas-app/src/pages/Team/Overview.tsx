import { Card, Row, Col, Tag, Avatar, Descriptions, Button } from 'antd'
import { TeamOutlined, ShopOutlined, CrownOutlined, EditOutlined } from '@ant-design/icons'
import { useAuthStore } from '../../stores/authStore'

const PLAN_MAP = {
  free: { label: '免费版', color: 'default' },
  basic: { label: '基础版', color: 'blue' },
  pro: { label: '专业版', color: 'gold' },
} as const

export default function TeamOverview() {
  const { team, user } = useAuthStore()

  if (!team || !user) return null

  const plan = PLAN_MAP[team.plan]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>团队概况</h2>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          { icon: <TeamOutlined />, label: '团队成员', value: team.memberCount, color: '#1677ff' },
          { icon: <ShopOutlined />, label: '门店数量', value: team.storeCount, color: '#52c41a' },
          { icon: <CrownOutlined />, label: '当前套餐', value: plan.label, color: '#fa8c16' },
        ].map((item) => (
          <Col span={8} key={item.label}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: item.color + '18',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    color: item.color,
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>{item.value}</div>
                  <div style={{ color: '#999', fontSize: 13 }}>{item.label}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Team Info */}
      <Row gutter={16}>
        <Col span={12}>
          <Card
            title="团队信息"
            extra={<Button type="text" icon={<EditOutlined />} size="small">编辑</Button>}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="团队名称">{team.name}</Descriptions.Item>
              <Descriptions.Item label="团队ID">{team.id}</Descriptions.Item>
              <Descriptions.Item label="套餐">
                <Tag color={plan.color}>{plan.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{team.createdAt}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="我的信息">
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <Avatar size={56} style={{ background: '#ff4d4f', flexShrink: 0 }}>
                {user.name[0]}
              </Avatar>
              <Descriptions column={1} size="small" style={{ flex: 1 }}>
                <Descriptions.Item label="姓名">{user.name}</Descriptions.Item>
                <Descriptions.Item label="手机">{user.phone}</Descriptions.Item>
                <Descriptions.Item label="角色">
                  <Tag color="red">{user.role === 'owner' ? '创建者' : user.role === 'admin' ? '管理员' : '成员'}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
