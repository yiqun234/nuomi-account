import React from 'react'
import { Layout, Typography, Space, Flex } from 'antd'
import { useTranslation } from 'react-i18next'
import { QuestionCircleOutlined } from '@ant-design/icons'
import LanguageSwitcher from './LanguageSwitcher'
import './AuthLayout.css'

const { Header, Content, Footer } = Layout
const { Title, Text, Link } = Typography

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('zh') ? 'zh' : 'en'
  const userManualUrl = `https://www.nuomi.ai/instructions.html?lang=${lang}`

  return (
    <Layout className="auth-layout">
      <Header className="auth-header">
        <a href="https://www.nuomi.ai" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <Title level={2} style={{ color: '#1890ff', margin: 0, fontSize: '24px' }}>
                Nuomi.ai
            </Title>
        </a>
        <Flex align="center" gap="large">
          <Space size="large">
            <Link href={userManualUrl} target="_blank" rel="noopener noreferrer">
              <Space>
                <QuestionCircleOutlined />
                {t('user_manual', 'User Manual')}
              </Space>
            </Link>
          </Space>
          <LanguageSwitcher />
        </Flex>
      </Header>
      <Content className="auth-content">{children}</Content>
      <Footer className="auth-footer">
        <Text type="secondary">
          Nuomi Robotics ©{new Date().getFullYear()}
        </Text>
      </Footer>
    </Layout>
  )
}

export default AuthLayout 