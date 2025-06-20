import React from 'react'
import { Layout, Typography } from 'antd'
import LanguageSwitcher from './LanguageSwitcher'
import './AuthLayout.css'

const { Header, Content, Footer } = Layout
const { Title, Text } = Typography

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Layout className="auth-layout">
      <Header className="auth-header">
        <Title level={3} style={{ margin: 0, fontWeight: 300 }}>
          Nuomi Account Center
        </Title>
        <LanguageSwitcher />
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