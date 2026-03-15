import { useState } from 'react'
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm } from 'antd'
import { PlusOutlined, ShopOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { mockStores } from './mockData'
import type { Store } from '../../types/auth'

export default function TeamStores() {
  const [stores, setStores] = useState<Store[]>(mockStores)
  const [addOpen, setAddOpen] = useState(false)
  const [form] = Form.useForm()

  function handleAdd(values: { name: string; address: string }) {
    const newStore: Store = {
      id: 's_' + Date.now(),
      name: values.name,
      address: values.address,
      memberCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    }
    setStores((prev) => [...prev, newStore])
    message.success('门店已添加')
    setAddOpen(false)
    form.resetFields()
  }

  function handleDelete(id: string) {
    setStores((prev) => prev.filter((s) => s.id !== id))
    message.success('门店已删除')
  }

  const columns: ColumnsType<Store> = [
    {
      title: '门店名称',
      key: 'name',
      render: (_, r) => (
        <Space>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#52c41a18',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#52c41a',
            }}
          >
            <ShopOutlined />
          </div>
          <span style={{ fontWeight: 500 }}>{r.name}</span>
        </Space>
      ),
    },
    {
      title: '地址',
      dataIndex: 'address',
      ellipsis: true,
    },
    {
      title: '成员数',
      dataIndex: 'memberCount',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, r) => (
        <Popconfirm title="确认删除该门店？" onConfirm={() => handleDelete(r.id)}>
          <Button type="link" danger size="small">删除</Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>门店管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
          添加门店
        </Button>
      </div>

      <Table rowKey="id" columns={columns} dataSource={stores} pagination={false} />

      <Modal
        title="添加门店"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={() => form.submit()}
        okText="确认添加"
      >
        <Form form={form} layout="vertical" onFinish={handleAdd} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="门店名称" rules={[{ required: true, message: '请输入门店名称' }]}>
            <Input placeholder="如：上海旗舰店" />
          </Form.Item>
          <Form.Item name="address" label="门店地址" rules={[{ required: true, message: '请输入门店地址' }]}>
            <Input placeholder="详细地址" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
