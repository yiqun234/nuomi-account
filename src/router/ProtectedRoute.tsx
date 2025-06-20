import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/auth'
import { Spin, Flex } from 'antd'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Spin size="large" />
      </Flex>
    )
  }

  if (!user) {
    // User not authenticated, redirect to login page
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute 