import { useEffect, useState } from 'react'
import {
  Form,
  Input,
  Button,
  Collapse,
  Switch,
  Select,
  Card,
  Typography,
  Flex,
  Spin,
  App,
} from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/auth'
import { getUserConfig, saveUserConfig } from '../services/database'
import { signOut } from '../services/auth'
import type { UserConfig } from '../types/config'

const { Title } = Typography

const defaultConfig: UserConfig = {
  linkedin: { email: '', pass: '' },
  job_search: { title: '', location: '' },
  blacklist: { companies: [], titles: [] },
  paths: { resume_path: '', cover_letter_path: '' },
  ai: { api_key: '', enabled: false },
  eeo: {
    gender: 'decline',
    race: 'decline',
    veteran: 'decline',
    disability: 'decline',
  },
}

const DashboardPage = () => {
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const [initialValues, setInitialValues] = useState<UserConfig | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { message: appMessage } = App.useApp()

  useEffect(() => {
    if (user) {
      getUserConfig(user.uid)
        .then((config) => {
          setInitialValues({ ...defaultConfig, ...config })
        })
        .catch((error) => {
          console.error('Failed to fetch config:', error)
          appMessage.error(t('dashboard.messages.load_error'))
          setInitialValues(defaultConfig)
        })
    }
  }, [user, appMessage, t])

  const onFinish = async (values: UserConfig) => {
    if (user) {
      setIsSubmitting(true)
      try {
        await saveUserConfig(user.uid, values)
        appMessage.success(t('dashboard.messages.save_success'))
      } catch (error) {
        console.error('Failed to save config:', error)
        appMessage.error(t('dashboard.messages.save_error'))
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  if (!initialValues) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Spin size="large" />
      </Flex>
    )
  }

  return (
    <Card style={{ margin: '2rem auto', maxWidth: 800 }}>
      <Flex justify="space-between" align="center">
        <Title level={2}>{t('dashboard.title')}</Title>
        <Button icon={<LogoutOutlined />} onClick={signOut}>
          {t('dashboard.logout_button')}
        </Button>
      </Flex>
      <Form
        key={user?.uid}
        layout="vertical"
        onFinish={onFinish}
        initialValues={initialValues}
        disabled={isSubmitting}
      >
        <Collapse
          defaultActiveKey={['linkedin', 'job_search']}
          items={[
            {
              key: 'linkedin',
              label: t('dashboard.sections.linkedin'),
              children: (
                <>
                  <Form.Item label={t('dashboard.labels.linkedin_email')} name={['linkedin', 'email']}>
                    <Input />
                  </Form.Item>
                  <Form.Item label={t('dashboard.labels.linkedin_pass')} name={['linkedin', 'pass']}>
                    <Input.Password />
                  </Form.Item>
                </>
              ),
            },
            {
              key: 'job_search',
              label: t('dashboard.sections.job_search'),
              children: (
                <>
                  <Form.Item label={t('dashboard.labels.job_title')} name={['job_search', 'title']}>
                    <Input />
                  </Form.Item>
                  <Form.Item label={t('dashboard.labels.location')} name={['job_search', 'location']}>
                    <Input />
                  </Form.Item>
                </>
              ),
            },
            {
              key: 'blacklist',
              label: t('dashboard.sections.blacklist'),
              children: (
                <>
                  <Form.Item
                    label={t('dashboard.labels.blacklist_companies')}
                    name={['blacklist', 'companies']}
                  >
                    <Select
                      mode="tags"
                      style={{ width: '100%' }}
                      placeholder={t('dashboard.labels.blacklist_companies')}
                    />
                  </Form.Item>
                  <Form.Item
                    label={t('dashboard.labels.blacklist_titles')}
                    name={['blacklist', 'titles']}
                  >
                    <Select
                      mode="tags"
                      style={{ width: '100%' }}
                      placeholder={t('dashboard.labels.blacklist_titles')}
                    />
                  </Form.Item>
                </>
              ),
            },
            {
              key: 'ai',
              label: t('dashboard.sections.ai'),
              children: (
                <>
                  <Form.Item
                    label={t('dashboard.labels.ai_enabled')}
                    name={['ai', 'enabled']}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  <Form.Item label={t('dashboard.labels.ai_api_key')} name={['ai', 'api_key']}>
                    <Input.Password />
                  </Form.Item>
                </>
              ),
            },
            {
              key: 'paths',
              label: t('dashboard.sections.paths'),
              children: (
                <>
                  <Form.Item
                    label={t('dashboard.labels.resume_path')}
                    name={['paths', 'resume_path']}
                  >
                    <Input placeholder="e.g., C:/Users/YourUser/Documents/resume.pdf" />
                  </Form.Item>
                  <Form.Item
                    label={t('dashboard.labels.cover_letter_path')}
                    name={['paths', 'cover_letter_path']}
                  >
                    <Input placeholder="e.g., C:/Users/YourUser/Documents/cover_letter.docx" />
                  </Form.Item>
                </>
              ),
            },
            {
              key: 'eeo',
              label: t('dashboard.sections.eeo'),
              children: (
                <>
                  <Form.Item label={t('dashboard.labels.gender')} name={['eeo', 'gender']}>
                    <Select
                      options={[
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'decline', label: 'I decline to answer' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item label={t('dashboard.labels.race')} name={['eeo', 'race']}>
                    <Select
                      options={[
                        { value: 'hispanic', label: 'Hispanic or Latino' },
                        { value: 'white', label: 'White' },
                        {
                          value: 'black',
                          label: 'Black or African American',
                        },
                        { value: 'asian', label: 'Asian' },
                        { value: 'two_or_more', label: 'Two or More Races' },
                        { value: 'decline', label: 'I decline to answer' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item
                    label={t('dashboard.labels.veteran')}
                    name={['eeo', 'veteran']}
                  >
                    <Select
                      options={[
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' },
                        { value: 'decline', label: 'I decline to answer' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item
                    label={t('dashboard.labels.disability')}
                    name={['eeo', 'disability']}
                  >
                    <Select
                      options={[
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' },
                        { value: 'decline', label: 'I decline to answer' },
                      ]}
                    />
                  </Form.Item>
                </>
              ),
            },
          ]}
        />
        <Form.Item style={{ marginTop: 24 }}>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            {t('dashboard.save_button')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default DashboardPage