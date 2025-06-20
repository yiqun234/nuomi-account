import {
  Button,
  Card,
  Form,
  Input,
  App,
  Typography,
} from 'antd'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import {
  signUp,
  isAuthError,
} from '../services/auth'
import type { LoginCredentials } from '../types/auth'
import { useState, useEffect } from 'react'
import useAuthStore from '../store/auth'
import AuthLayout from '../components/AuthLayout'

const { Title, Paragraph } = Typography

const RegisterPage = () => {
  const [form] = Form.useForm<LoginCredentials>()
  const { t } = useTranslation()
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const handleAuthError = (error: unknown) => {
    if (isAuthError(error)) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          message.error(t('register.error.email_in_use'))
          break
        case 'auth/weak-password':
          message.error(t('register.error.weak_password'))
          break
        default:
          message.error(t('register.error.generic'))
          console.error('Firebase Auth Error:', error)
      }
    } else {
      message.error(t('register.error.generic'))
      console.error('An unexpected error occurred:', error)
    }
  }

  const handleRegister = async (values: LoginCredentials) => {
    setIsLoading(true)
    try {
      await signUp(values)
      message.success(t('register.success.register'))
      setTimeout(() => navigate('/dashboard'), 1500) // Redirect after a short delay
    } catch (error) {
      handleAuthError(error)
    } finally {
      setIsLoading(false)
    }
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
          {t('register.title')}
        </Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRegister}
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
            hasFeedback
          >
            <Input.Password placeholder={t('login.password_placeholder')} />
          </Form.Item>
          <Form.Item
             name="confirm"
             dependencies={['password']}
             hasFeedback
             rules={[
               { required: true, message: t('register.validation.confirm_required')! },
               ({ getFieldValue }) => ({
                 validator(_, value) {
                   if (!value || getFieldValue('password') === value) {
                     return Promise.resolve()
                   }
                   return Promise.reject(
                     new Error(t('register.validation.password_mismatch')!),
                   )
                 },
               }),
             ]}
          >
             <Input.Password placeholder={t('register.confirm_password_placeholder')} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={isLoading}>
              {t('login.register_button')}
            </Button>
          </Form.Item>
          <Paragraph style={{ textAlign: 'center' }}>
            {t('register.already_have_account')}{' '}
            <Link to="/login">{t('login.login_button')}</Link>
          </Paragraph>
        </Form>
      </Card>
    </AuthLayout>
  )
}

export default RegisterPage 