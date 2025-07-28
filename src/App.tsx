import { useEffect, useState, Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, theme, App as AntdApp, Spin } from 'antd'
import { useTranslation } from 'react-i18next'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import useAuthStore from './store/auth'
import ProtectedRoute from './components/ProtectedRoute'
import LoginRedirector from './components/LoginRedirector'

// Lazy load page components for code-splitting
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AuthorizePage = lazy(() => import('./pages/AuthorizePage'))
const LogoutPage = lazy(() => import('./pages/LogoutPage'))

const App = () => {
  const { i18n } = useTranslation()
  const [antdLocale, setAntdLocale] = useState(i18n.language === 'zh' ? zhCN : enUS)
  const { user, isLoading } = useAuthStore()

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setAntdLocale(lng === 'zh' ? zhCN : enUS)
    }
    i18n.on('languageChanged', handleLanguageChange)
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [i18n])

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" />
      </div>
    )
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
      }}
      locale={antdLocale}
    >
      <AntdApp>
        <Suspense
          fallback={
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
              }}
            >
              <Spin size="large" />
            </div>
          }
        >
          <Routes>
            <Route
              path="/"
              element={
                user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/login"
              element={user ? <LoginRedirector /> : <LoginPage />}
            />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/authorize"
              element={
                <ProtectedRoute>
                  <AuthorizePage />
                </ProtectedRoute>
              }
            />
            <Route path="/logout" element={<LogoutPage />} />
          </Routes>
        </Suspense>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App 