import React, { useEffect, useState, useCallback } from 'react'
import {
  Form,
  Button,
  message,
  Spin,
  Space,
  Dropdown,
  Menu,
  Layout,
  Typography,
} from 'antd'
import {
  UserOutlined,
  SaveOutlined,
  UndoOutlined,
  SettingOutlined,
  SearchOutlined,
  StopOutlined,
  FileTextOutlined,
  CodeOutlined,
  IdcardOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { getConfig, saveConfig } from '../services/database'
import { configSchema } from '../config/schema'
import { defaultConfig } from '../config/config.default'
import SchemaForm from '../components/SchemaForm'
import LanguageSwitcher from '../components/LanguageSwitcher'
import type { Group, AppConfig, DatePosted } from '../types'

const { Header, Sider, Content } = Layout
const { Title } = Typography

const DashboardPage: React.FC = () => {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const [form] = Form.useForm<AppConfig>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedKey, setSelectedKey] = useState(configSchema.groups[0].key)
  const [initialValues, setInitialValues] = useState<AppConfig | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const loadData = useCallback(async () => {
    if (user) {
      setLoading(true)
      try {
        const remoteConfig = await getConfig(user.uid)

        const config = remoteConfig
          ? { ...defaultConfig }
          : defaultConfig

        setInitialValues(config);
      } catch (error) {
        messageApi.error(t('Failed to load configuration.'))
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
  }, [user, t, messageApi])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!loading && initialValues) {
        const configToProcess = { ...initialValues } as Partial<AppConfig> & { positions?: string[] };
        
        // Compatibility/Migration for positions -> positionsWithCount
        if (configToProcess.positions && Array.isArray(configToProcess.positions)) {
          if (!configToProcess.positionsWithCount || configToProcess.positionsWithCount.length === 0) {
            configToProcess.positionsWithCount = configToProcess.positions.map((pos: string) => ({ name: pos, count: 100 }))
          }
          delete configToProcess.positions
        }
        
        // Compatibility for date object -> string value
        if (configToProcess.date && typeof configToProcess.date === 'object') {
            const date = configToProcess.date as DatePosted;
            const dateKey = (Object.keys(date) as Array<keyof DatePosted>).find(key => date[key]);
            if (dateKey) {
                (configToProcess as { date: string | DatePosted }).date = dateKey;
            }
        }

        form.setFieldsValue(configToProcess)
    }
  }, [loading, initialValues, form]);

  const handleSave = async () => {
    if (!user) {
      messageApi.error('User not authenticated.')
      return
    }

    setSaving(true)
    try {
      // First, validate only the visible fields to catch immediate errors.
      await form.validateFields();
      
      // Then, get ALL values from the entire form, including non-visible fields.
      const allValues = form.getFieldsValue(true);
      
      const valuesToSave = { ...allValues };

      // Convert date string back to object before saving
      if (valuesToSave.date && typeof valuesToSave.date === 'string') {
        const dateOptions = configSchema.groups
            .flatMap(g => g.fields)
            .find(f => f.key === 'date')
            ?.options;
        
        if (dateOptions) {
            const newDateObject: Partial<DatePosted> = {};
            dateOptions.forEach(opt => {
                newDateObject[opt.key as keyof DatePosted] = opt.key === valuesToSave.date;
            });
            valuesToSave.date = newDateObject as DatePosted;
        }
      }

      await saveConfig(user.uid, valuesToSave)
      messageApi.success(t('Save Success'))
    } catch (errorInfo) {
      console.log('Failed:', errorInfo);
      messageApi.error(t('Save Failed. Please check for errors.'))
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    loadData()
    messageApi.info(t('Changes have been reset.'))
  }

  const handleMenuClick = (e: { key: string }) => {
    if (e.key === 'logout') {
      logout()
      messageApi.success(t('Logged out successfully'))
    }
  }

  const selectedGroup = configSchema.groups.find((g: Group) => g.key === selectedKey)

  const groupIcons: { [key: string]: React.ReactNode } = {
    global: <IdcardOutlined />,
    job_filters: <SearchOutlined />,
    preference_settings: <SettingOutlined />,
    advanced_settings: <StopOutlined />,
    job_fit_evaluation: <FileTextOutlined />,
    personal_info: <UserOutlined />,
    developer_options: <CodeOutlined />,
  };
  
  const menuItems = configSchema.groups.map((group: Group) => ({
    key: group.key,
    icon: groupIcons[group.key] || <SettingOutlined />,
    label: t(group.key, group.group_name_en),
  }))

  const userMenuItems = [
    {
      key: 'logout',
      label: t('logout', 'Logout'),
    },
  ]

  if (loading && !user) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {contextHolder}
      <Header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 24px',
          backgroundColor: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          {t('title', 'Configuration Panel')}
        </Title>
        <Space>
          <LanguageSwitcher />
          {user && (
            <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }}>
              <a onClick={e => e.preventDefault()} style={{ color: 'inherit' }}>
                <Space>
                  <UserOutlined />
                  {user.email}
                </Space>
              </a>
            </Dropdown>
          )}
        </Space>
      </Header>
      <Layout>
        <Sider width={200} style={{ backgroundColor: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            onSelect={({ key }) => setSelectedKey(key)}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              flex: '1 1 auto',
              overflowY: 'auto',
              backgroundColor: '#fff'
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Spin size="large" />
              </div>
            ) : (
              <Form
                id="config-form"
                form={form}
                layout="vertical"
              >
                {selectedGroup && <SchemaForm group={selectedGroup} form={form} t={t} />}
              </Form>
            )}
          </Content>
          <div style={{ 
            flex: '0 0 auto',
            textAlign: 'right',
            borderTop: '1px solid #f0f0f0',
            backgroundColor: '#fff',
            margin: '0 -24px -24px',
            padding: '16px 24px'
          }}>
            <Space>
              <Button icon={<UndoOutlined />} onClick={handleReset} disabled={saving}>
                {t('Reset', 'Reset')}
              </Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
                {t('Save', 'Save')}
              </Button>
            </Space>
          </div>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default DashboardPage