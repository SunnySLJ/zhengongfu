import { Form, Input, Button, Card, message, Divider } from 'antd'
import { useAuthStore } from '../../stores/authStore'

export default function TeamSettings() {
  const { team, user, updateTeam, logout } = useAuthStore()
  const [teamForm] = Form.useForm()
  const [pwdForm] = Form.useForm()

  function handleTeamUpdate(values: { name: string }) {
    updateTeam({ name: values.name })
    message.success('团队名称已更新')
  }

  function handlePasswordChange(values: { oldPassword: string; newPassword: string }) {
    console.log('change password', values)
    message.success('密码已修改')
    pwdForm.resetFields()
  }

  if (!team || !user) return null

  return (
    <div style={{ padding: 24, maxWidth: 560 }}>
      <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 600 }}>团队设置</h2>

      <Card title="基础信息" style={{ marginBottom: 16 }}>
        <Form
          form={teamForm}
          layout="vertical"
          initialValues={{ name: team.name }}
          onFinish={handleTeamUpdate}
        >
          <Form.Item name="name" label="团队名称" rules={[{ required: true, message: '请输入团队名称' }]}>
            <Input placeholder="团队名称" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit">保存</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="修改密码" style={{ marginBottom: 16 }}>
        <Form form={pwdForm} layout="vertical" onFinish={handlePasswordChange}>
          <Form.Item name="oldPassword" label="当前密码" rules={[{ required: true, message: '请输入当前密码' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '至少6位' },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve()
                  return Promise.reject(new Error('两次密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit">修改密码</Button>
          </Form.Item>
        </Form>
      </Card>

      <Divider />

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 500 }}>退出登录</div>
            <div style={{ color: '#999', fontSize: 13 }}>退出当前账号</div>
          </div>
          <Button danger onClick={logout}>退出登录</Button>
        </div>
      </Card>
    </div>
  )
}
