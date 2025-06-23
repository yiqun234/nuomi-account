import useAuthStore from '../store/auth'
 
export const useAuth = () => {
  const { user, isLoading, logout } = useAuthStore()
  return { user, loading: isLoading, logout }
} 