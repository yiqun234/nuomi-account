import { Button, Dropdown } from 'antd'
import { GlobalOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { MenuProps } from 'antd'

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const items: MenuProps['items'] = [
    { key: 'en', label: 'English' },
    { key: 'zh', label: '中文' },
  ]

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    i18n.changeLanguage(e.key)
  }

  return (
    <Dropdown menu={{ items, onClick: handleMenuClick }} placement="bottomRight">
      <Button type="text" icon={<GlobalOutlined />} />
    </Dropdown>
  )
}

export default LanguageSwitcher 