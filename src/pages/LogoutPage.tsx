import { useState, useEffect, useRef } from 'react'
import { Card, Typography, Spin, Flex, Result } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AuthLayout from '../components/AuthLayout'

const { Title } = Typography

type LogoutStatus = 'processing' | 'success' | 'error'

const LogoutPage = () => {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<LogoutStatus>('processing')
  const [error, setError] = useState<string>('')
  const [countdown, setCountdown] = useState(3)
  const hasProcessed = useRef(false)

  useEffect(() => {
    if (hasProcessed.current) {
      return
    }
    hasProcessed.current = true

    const processLogout = async () => {
      try {
        const logoutCallback = sessionStorage.getItem('logoutCallback')
        if (logoutCallback) {
          try {
            await fetch(logoutCallback, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status: 'logout_initiated',
                user_id: user?.uid || null,
              }),
            })
          } catch (callbackError) {
            console.warn('Failed to notify logout callback:', callbackError)
          } finally {
            sessionStorage.removeItem('logoutCallback')
          }
        }

        await logout()
        setStatus('success')
      } catch (err) {
        const error = err as Error
        console.error('Logout process failed:', error)
        setError(error.message || t('logout.error_unknown', 'Logout failed'))
        setStatus('error')
      }
    }

    processLogout()
  }, [user, logout, t])

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    if (status === 'success') {
      timer = setInterval(() => {
        setCountdown(prevCountdown => {
          if (prevCountdown <= 1) {
            clearInterval(timer)
            navigate('/login')
            return 0
          }
          return prevCountdown - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [status, navigate])

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <Flex align="center" justify="center" style={{ minHeight: '150px' }} vertical>
            <Spin size="large" />
            <p style={{ marginTop: '1rem' }}>{t('logout.processing', 'Logging out...')}</p>
          </Flex>
        )
      case 'success':
        return (
          <Result
            status="success"
            title={t('logout.success_title', 'Logout Successful')}
            subTitle={
              <>
                <div>{t('logout.success_subtitle', 'You have been successfully logged out.')}</div>
                <div>{t('logout.redirect_countdown', 'Redirecting to login page in {{count}} seconds...', { count: countdown })}</div>
              </>
            }
          />
        )
      case 'error':
        return <Result status="error" title={t('logout.error_title', 'Logout Failed')} subTitle={error} />
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
        <Title level={2}>{t('logout.title', 'Logout')}</Title>
        {renderContent()}
      </Card>
    </AuthLayout>
  )
}

export default LogoutPage 