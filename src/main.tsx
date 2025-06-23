import '@ant-design/v5-patch-for-react-19' // Must be at the top
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './i18n' // 初始化 i18next
import './store/auth' // 确保在应用启动时初始化认证监听器
import 'antd/dist/reset.css'
import './index.css'
import './i18n.ts'
import { handleInitialURLParameters } from './utils/url.ts'

handleInitialURLParameters()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
    <App />
    </BrowserRouter>
  </React.StrictMode>
)
