import { Navigate } from 'react-router-dom'

const LoginRedirector = () => {
  const callbackUrl = sessionStorage.getItem('authCallback')
  const targetPath = callbackUrl ? '/authorize' : '/'

  return <Navigate to={targetPath} replace />
}

export default LoginRedirector 