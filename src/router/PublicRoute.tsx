import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/auth'
import { Spin, Flex } from 'antd'

interface PublicRouteProps {
  children: React.ReactNode
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Spin size="large" />
      </Flex>
    )
  }

  if (user) {
    // User is authenticated, redirect to the main dashboard
    return <Navigate to="/" replace />
  }

  return children
}

export default PublicRoute 