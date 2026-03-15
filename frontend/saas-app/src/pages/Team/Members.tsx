import { useState } from 'react'
import { Table, Tag, Avatar, Button, Modal, Form, Input, Select, message, Space, Popconfirm } from 'antd'
import { UserAddOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { mockMembers } from './mockData'
import type { TeamMember } from '../../types/auth'

const ROLE_MAP = {
  owner: { label: '创建者', color: 'red' },
  admin: { label: '管理员', color: 'blue' },
  member: { label: '成员', color: 'default' },
} as const

export default function TeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>(mockMembers)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [form] = Form.useForm()

  function handleInvite(values: { phone: string; role: TeamMember['role'] }) {
    const newMember: TeamMember = {
      id: 'm_' + Date.now(),
      userId: 'u_' + Date.now(),
      name: '待加入',
      phone: values.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      role: values.role,
      joinedAt: new Date().toISOString().split('T')[0],
      status: 'invited',
    }
    setMembers((prev) => [...prev, newMember])
    message.success('邀请已发送')
    setInviteOpen(false)
    form.resetFields()
  }

  function handleRemove(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id))
    message.success('已移除成员')
  }

  const columns: ColumnsType<TeamMember> = [
    {
      title: '成员',
      key: 'member',
      render: (_, r) => (
        <Space>
          <Avatar style={{ background: '#ff4d4f' }}>{r.name[0]}</Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{r.name}</div>
            <div style={{ color: '#999', fontSize: 12 }}>{r.phone}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      render: (role: TeamMember['role']) => (
        <Tag color={ROLE_MAP[role].color}>{ROLE_MAP[role].label}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: string) =>
        status === 'active' ? (
          <Tag color="success">已加入</Tag>
        ) : (
          <Tag color="warning">待接受</Tag>
        ),
    },
    {
      title: '加入时间',
      dataIndex: 'joinedAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, r) =>
        r.role !== 'owner' ? (
          <Popconfirm title="确认移除该成员？" onConfirm={() => handleRemove(r.id)}>
            <Button type="link" danger size="small">移除</Button>
          </Popconfirm>
        ) : null,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>成员管理</h2>
        <Button type="primary" icon={<UserAddOutlined />} onClick={() => setInviteOpen(true)}>
          邀请成员
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={members}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="邀请成员"
        open={inviteOpen}
        onCancel={() => setInviteOpen(false)}
        onOk={() => form.submit()}
        okText="发送邀请"
      >
        <Form form={form} layout="vertical" onFinish={handleInvite} style={{ marginTop: 16 }}>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
            ]}
          >
            <Input placeholder="请输入被邀请人手机号" />
          </Form.Item>
          <Form.Item name="role" label="角色" initialValue="member" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'admin', label: '管理员' },
                { value: 'member', label: '成员' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
