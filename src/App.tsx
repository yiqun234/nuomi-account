import { useEffect, useState, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, theme, App as AntdApp, Spin } from 'antd'
import { useTranslation } from 'react-i18next'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import useAuthStore from './store/auth'
import ProtectedRoute from './components/ProtectedRoute'
import {
  LoginPage,
  RegisterPage,
  DashboardPage,
  AuthorizePage,
} from './pages'
import LoginRedirector from './components/LoginRedirector'

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
        <Suspense fallback={<div>Loading...</div>}>
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
          </Routes>
        </Suspense>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App 