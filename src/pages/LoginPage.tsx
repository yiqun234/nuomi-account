import {
  Button,
  Card,
  Form,
  Input,
  Flex,
  Divider,
  App,
  Typography,
  Spin,
} from 'antd'
import { useTranslation } from 'react-i18next'
import { GoogleOutlined } from '@ant-design/icons'
import {
  signInWithGoogle,
  signIn,
  isAuthError,
} from '../services/auth'
import type { LoginCredentials } from '../types/auth'
import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/auth'
import AuthLayout from '../components/AuthLayout'

const { Title } = Typography

const LoginPage = () => {
  const [form] = Form.useForm<LoginCredentials>()
  const { t } = useTranslation()
  const { message } = App.useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isLoading: isAuthLoading } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true })
    }
  }, [user, navigate, from])

  const handleAuthError = (error: unknown) => {
    if (isAuthError(error)) {
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          message.error(t('login.error.invalid_credentials'))
          break
        case 'auth/email-already-in-use':
          message.error(t('login.error.email_in_use'))
          break
        case 'auth/weak-password':
          message.error(t('login.error.weak_password'))
          break
        default:
          message.error(t('login.error.generic'))
          console.error('Firebase Auth Error:', error)
      }
    } else {
      message.error(t('login.error.generic'))
      console.error('An unexpected error occurred:', error)
    }
  }

  const handleLogin = async (values: LoginCredentials) => {
    setIsLoading(true)
    try {
      await signIn(values)
    } catch (error) {
      handleAuthError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
    } catch (error) {
      handleAuthError(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthLoading || user) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Spin size="large" />
      </Flex>
    )
  }

  return (
    <AuthLayout>
      <Card
        style={{
          width: 400,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>
          {t('login.title')}
        </Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          disabled={isLoading}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: t('login.validation.email_required')! },
              { type: 'email', message: t('login.validation.email_invalid')! },
            ]}
          >
            <Input placeholder={t('login.email_placeholder')} />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: t('login.validation.password_required')! },
              { min: 6, message: t('login.validation.password_min_length')! },
            ]}
          >
            <Input.Password placeholder={t('login.password_placeholder')} />
          </Form.Item>
          <Form.Item>
            <Flex vertical gap="small">
              <Button type="primary" htmlType="submit" block loading={isLoading}>
                {t('login.login_button')}
              </Button>
              <Link to="/register" style={{ width: '100%' }}>
                <Button htmlType="button" block>
                  {t('login.register_button')}
                </Button>
              </Link>
            </Flex>
          </Form.Item>
          <Divider>{t('or')}</Divider>
          <Button
            icon={<GoogleOutlined />}
            onClick={handleGoogleSignIn}
            block
            loading={isLoading}
          >
            {t('login.google_signin_button')}
          </Button>
        </Form>
      </Card>
    </AuthLayout>
  )
}

export default LoginPage 