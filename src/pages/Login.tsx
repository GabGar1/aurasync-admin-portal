import { Form, Input, Button, Card, Typography, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import type { LoginPayload } from '@/types';

const { Title, Text } = Typography;

export default function Login() {
  const { login } = useAuth();

  const mutation = useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      message.success('Welcome back!');
      login(data.token, data.user);
    },
    onError: () => message.error('Login failed'),
  });

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF9F6' }}>
      <Card className="w-full max-w-md shadow-lg" bordered={false}>
        <div className="text-center mb-8">
          <Title level={2} style={{ color: '#9966CC', marginBottom: 4 }}>AuraSync</Title>
          <Text type="secondary">E-commerce Management System</Text>
        </div>
        <Form layout="vertical" onFinish={(values) => mutation.mutate(values)} autoComplete="off">
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Valid email required' }]}>
            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Password required' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={mutation.isPending}>
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
