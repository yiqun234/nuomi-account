import { useState, useEffect, useRef } from 'react'
import { Card, Typography, Spin, Flex, Result } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/auth'
import { getOrCreateApiKey } from '../services/apiKey'
import type { User } from 'firebase/auth'
import AuthLayout from '../components/AuthLayout'

const { Title } = Typography

type AuthStatus = 'processing' | 'success' | 'error'

const AuthorizePage = () => {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [status, setStatus] = useState<AuthStatus>('processing')
  const [error, setError] = useState<string>('')
  const [countdown, setCountdown] = useState(5)
  const hasProcessed = useRef(false)

  useEffect(() => {
    if (!user || hasProcessed.current) {
      return
    }
    hasProcessed.current = true
    const callbackUrl = sessionStorage.getItem('authCallback')
    const processAuthorization = async (loggedInUser: User) => {
      if (!callbackUrl) {
        setError(t('authorize.error_callback_not_found'))
        setStatus('error')
        return
      }
      try {
        const apiKey = await getOrCreateApiKey(loggedInUser.uid)
        const idToken = await loggedInUser.getIdToken()
        await fetch(callbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: loggedInUser.uid,
            id_token: idToken,
            api_key: apiKey,
          }),
        })
        setStatus('success')
      } catch (err) {
        const error = err as Error
        console.error('Authorization process failed:', error)
        setError(error.message || t('authorize.error_unknown'))
        setStatus('error')
      } finally {
        sessionStorage.removeItem('authCallback')
      }
    }
    processAuthorization(user)
  }, [user, t])

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (status === 'success') {
      timer = setInterval(() => {
        setCountdown(prevCountdown => {
          if (prevCountdown <= 1) {
            clearInterval(timer);
            navigate('/dashboard');
            return 0;
          }
          return prevCountdown - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status, navigate]);

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <Flex align="center" justify="center" style={{ minHeight: '150px' }} vertical>
            <Spin size="large" />
            <p style={{ marginTop: '1rem' }}>{t('authorize.processing')}</p>
          </Flex>
        )
      case 'success':
        return (
          <Result
            status="success"
            title={t('authorize.success_title')}
            subTitle={
              <>
                <div>{t('authorize.success_subtitle')}</div>
                <div>{t('authorize.redirect_countdown', { count: countdown })}</div>
              </>
            }
          />
        )
      case 'error':
        return <Result status="error" title={t('authorize.error_title')} subTitle={error} />
      default:
        return null
    }
  }

  return (
    <AuthLayout>
      <Card
        style={{
          width: 500,
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Title level={2}>{t('authorize.title')}</Title>
        {renderContent()}
      </Card>
    </AuthLayout>
  )
}

export default AuthorizePage 