import React from 'react';
import { Dropdown, Button, type MenuProps } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    i18n.changeLanguage(key);
  };

  const menuProps = {
    items: [
      { key: 'en', label: 'English' },
      { key: 'zh', label: '简体中文' },
    ],
    onClick: handleMenuClick,
    selectedKeys: [i18n.language],
  };

  return (
    <Dropdown menu={menuProps} placement="bottomRight" trigger={['click']}>
      <Button type="text" icon={<GlobalOutlined />} />
    </Dropdown>
  );
};

export default LanguageSwitcher; 