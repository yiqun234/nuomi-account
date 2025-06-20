import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/auth'
import { Flex, Spin } from 'antd'

interface ProtectedRouteProps {
  children: React.ReactElement
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Spin size="large" />
      </Flex>
    )
  }

  if (!user) {
    // Pass the original location in state, so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute 