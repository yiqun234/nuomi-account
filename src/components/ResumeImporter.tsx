import React, { useState } from 'react';
import { Button, Modal, Checkbox, Spin, message, Row, Col, Upload, Steps, Typography } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import type { UploadChangeParam } from 'antd/es/upload';
import { FileTextOutlined, CheckCircleOutlined, RocketOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import type { TFunction } from 'i18next';
import type { User } from 'firebase/auth';
import type { Field } from '../types';
import { configSchema } from '../config/schema';
import { countryCodeOptions } from '../config/countryCodes';

const OCR_API_URL = import.meta.env.VITE_OCR_API_URL || 'https://ocr.nuomi.ai/api/ocr';
const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL;

interface ResumeImporterProps {
  field: Field;
  t: TFunction;
  form: FormInstance;
  user: User | null;
  apiKey: string | null;
}

interface OcrApiResponse {
  success: boolean;
  text: string | string[];
  error?: string;
}

interface AiSkill {
  skill: string;
  years: number;
}

interface AiPersonalInfo {
  firstName?: string;
  lastName?: string;
  country_code?: string;
  phone?: string;
  city?: string;
  zip?: string;
  address1?: string;
}

interface AiWorkExperience {
  title?: string;
  company?: string;
  from_month?: number;
  from_year?: number;
  to_month?: number;
  to_year?: number;
  current?: boolean;
  description?: string;
}

interface AiEducation {
  school?: string;
  degree?: string;
  major?: string;
  from_month?: number;
  from_year?: number;
  to_month?: number;
  to_year?: number;
  current?: boolean;
}

interface AiEeo {
  gender?: string;
  race?: string;
  veteran?: string;
  disability?: string;
}

interface AiSalary {
    amount: number;
}

interface AiApiResponse {
  skills?: AiSkill[];
  personal_info?: AiPersonalInfo;
  work_experience?: AiWorkExperience[];
  education?: AiEducation[];
  eeo?: AiEeo;
  salary?: AiSalary;
}

const { Dragger } = Upload;
const { Step } = Steps;
const { Title, Paragraph } = Typography;

const findSchemaField = (path: string, fields: Field[] = configSchema.groups.flatMap(g => g.fields)): Field | null => {
  const [currentKey, ...restKeys] = path.split('.');
  
  const field = fields.find(f => f.key === currentKey);
  if (!field) {
    return null;
  }
  
  if (restKeys.length === 0) {
    return field;
  }
  
  const nextPath = restKeys.join('.');
  const nextFields = field.fields || field.item_schema?.properties;

  if (nextFields) {
    return findSchemaField(nextPath, nextFields);
  }
  
  return null;
};

const buildAiPayload = (resumeText: string, selectedOptions: string[]) => {
  const structure = {
    languages: [{ language: "", level: "", confidence: 0 }],
    skills: [{ skill: "", years: 0, confidence: 0 }],
    personal_info: {
      firstName: "", lastName: "", email: "", phone: "", address1: "",
      address2: "", city: "", state: "", zip: "", country: "",
      country_code: "", confidence: 0
    },
    eeo: { gender: "", race: "", veteran: "", disability: "", confidence: 0 },
    salary: { amount: 0, currency: "", period: "", confidence: 0 },
    work_experience: [{
      company: "", title: "", city: "", state: "", country: "",
      from_month: 1, from_year: 2020, to_month: 1, to_year: 2023,
      current: false, description: "", confidence: 0
    }],
    education: [{
      school: "", degree: "", major: "", city: "", state: "",
      country: "", from_month: 1, from_year: 2015, to_month: 1,
      to_year: 2019, current: false, confidence: 0
    }]
  };

  const getOptionsValues = (path: string, valueKey: 'en_label' | 'value' = 'en_label') => {
    return findSchemaField(path)?.options?.map(o => o[valueKey] || o.key) || [];
  }
  const getItems = (path: string, subKey: string) => findSchemaField(path)?.options?.find(o => o.key === subKey)?.items || [];
  const getMonthNames = () => findSchemaField('workExperiences.item_schema.from_month')?.options?.map(o => o.en_label) || [];
  const getYears = () => Array.from({ length: 55 }, (_, i) => (new Date().getFullYear() + 5 - i).toString());

  const metadata = {
    languages: {
      label: "Language Proficiency",
      options: getOptionsValues('languages.value_field_schema.proficiency', 'value')
    },
    personal_info: {
      label: "Personal Information",
      fields: {
        country_code: {
          label: "Country/Area Code",
          options: countryCodeOptions.map(o => o.key).filter(k => k !== 'Select an option')
        }
      }
    },
    education: {
      label: "Education History",
      fields: {
        degree: {
          label: "Degree",
          options: getOptionsValues('checkboxes.degreeCompleted')
        },
        month: {
          label: "Month",
          options: Array.from({length: 12}, (_, i) => (i + 1).toString()),
          month_names: getMonthNames()
        },
        year: {
          label: "Year",
          options: getYears()
        }
      }
    },
    work_experience: {
      label: "Work Experience",
      fields: {
        month: {
          label: "Month",
          options: Array.from({length: 12}, (_, i) => (i + 1).toString()),
          month_names: getMonthNames()
        },
        year: {
          label: "Year",
          options: getYears()
        }
      }
    },
    skills: {
        label: "Skills & Experience"
    },
    eeo: {
      label: "EEO Information",
      fields: {
        gender: { label: "Gender", options: getItems('eeo', 'gender') },
        race: { label: "Race", options: getItems('eeo', 'race') },
        veteran: { label: "Veteran Status", options: getItems('eeo', 'veteran') },
        disability: { label: "Disability Status", options: getItems('eeo', 'disability') },
      }
    },
    salary: {
      label: "Salary Expectation",
      fields: {
        period: {
          label: "Salary Period",
          options: ["per year", "per month", "per week", "per day", "per hour"]
        }
      }
    }
  };

  return {
    resumeText,
    options: selectedOptions,
    structure,
    metadata
  };
};

const ResumeImporter: React.FC<ResumeImporterProps> = ({ field, t, form, apiKey, user }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>(field.importer_options!.map(opt => opt.key));
  const [resumeText, setResumeText] = useState<string>('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [finalResultMessage, setFinalResultMessage] = useState<React.ReactNode>(null);

  const showModal = () => {
    // Reset state when modal is opened
    setCurrentStep(0);
    setFinalResultMessage(null);
    setFileList([]);
    setResumeText('');
    setSelectedOptions(field.importer_options!.map(opt => opt.key));
    setIsModalVisible(true);
  };
  
  const handleRunAnalysis = async () => {
    if (selectedOptions.length === 0) return message.warning(t('resume_importer.no_options_selected', 'Please select at least one option to extract.'));
    
    setLoading(true);
    setLoadingStep(t('resume_importer.parsing_resume', 'AI is parsing your resume...'));
    
    try {
      if (!AI_SERVER_URL) {
        throw new Error(t('resume_importer.error_ai_url', "AI Server URL is not configured."));
      }
      if (!apiKey || !user?.uid) {
        throw new Error(t('resume_importer.error_ai_auth', "API key or User ID is missing."));
      }
      const aiPayload = buildAiPayload(resumeText, selectedOptions);
      const response = await fetch(`${AI_SERVER_URL}/extract-from-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'x-user-id': user.uid
        },
        body: JSON.stringify(aiPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(t('resume_importer.error_server_response', 'Server responded with {{status}}: {{text}}', { status: response.status, text: errorText }));
      }
      
      const result: AiApiResponse = await response.json();
      
      const valuesToSet: Record<string, unknown> = {};
      const updateMessages: string[] = [];
      let updatedCategories = 0;

      if (result.skills && result.skills.length > 0) {
        const newAiSkills = result.skills.reduce((acc: Record<string, number>, aiSkill) => {
          if (aiSkill.skill && typeof aiSkill.years === 'number') {
            acc[aiSkill.skill] = aiSkill.years;
          }
          return acc;
        }, {});
        
        if (Object.keys(newAiSkills).length > 0) {
            const currentSkills = form.getFieldValue('experience') || {};
            const skillsToClear = Object.keys(currentSkills)
                .filter(key => key !== 'default')
                .reduce((acc: Record<string, undefined>, key) => {
                    acc[key] = undefined;
                    return acc;
                }, {});
            const finalSkillsPayload = { ...skillsToClear, ...newAiSkills };
            valuesToSet.experience = finalSkillsPayload;
            updateMessages.push(t('importer_update_log.skills', { count: Object.keys(newAiSkills).length }));
            updatedCategories++;
        }
      }

      if (result.personal_info) {
        const pi = result.personal_info;
        const piValuesToSet: Record<string, string> = {};
        if (pi.firstName) piValuesToSet['First Name'] = pi.firstName;
        if (pi.lastName) piValuesToSet['Last Name'] = pi.lastName;
        if (pi.country_code) piValuesToSet['Phone Country Code'] = pi.country_code;
        if (pi.phone) piValuesToSet['Mobile Phone Number'] = pi.phone;
        if (pi.city) piValuesToSet['City'] = pi.city;
        if (pi.zip) piValuesToSet['Zip'] = pi.zip;
        if (pi.address1) piValuesToSet['Street address'] = pi.address1;
        
        if(Object.keys(piValuesToSet).length > 0) {
          valuesToSet.personalInfo = piValuesToSet;
          updateMessages.push(t('importer_update_log.personal_info', { count: Object.keys(piValuesToSet).length }));
          updatedCategories++;
        }
      }
      
      if (result.work_experience && result.work_experience.length > 0) {
          const monthNames = findSchemaField('workExperiences.from_month')?.options?.map(o => o.en_label) || [];
          const newWork = result.work_experience.map((exp: AiWorkExperience) => ({
              title: exp.title, company: exp.company,
              from_month: exp.from_month ? monthNames[exp.from_month - 1] : undefined, from_year: exp.from_year?.toString(),
              to_month: exp.to_month ? monthNames[exp.to_month - 1] : undefined, to_year: exp.to_year?.toString(),
              current: exp.current, description: exp.description
          }));
          valuesToSet.workExperiences = newWork;
          updateMessages.push(t('importer_update_log.work_experience', { count: newWork.length }));
          updatedCategories++;
      }

      if (result.education && result.education.length > 0) {
          const monthNames = findSchemaField('educations.from_month')?.options?.map(o => o.en_label) || [];
          const newEducation = result.education.map((edu: AiEducation) => ({
              school: edu.school, degree: edu.degree, major: edu.major,
              from_month: edu.from_month ? monthNames[edu.from_month - 1] : undefined, from_year: edu.from_year?.toString(),
              to_month: edu.to_month ? monthNames[edu.to_month - 1] : undefined, to_year: edu.to_year?.toString(),
              current: edu.current,
          }));
          valuesToSet.educations = newEducation;
          updateMessages.push(t('importer_update_log.education', { count: newEducation.length }));
          updatedCategories++;
      }

      if (result.eeo) {
          const eeo = result.eeo;
          const eeoValuesToSet: Record<string, string> = {};
          if (eeo.gender) eeoValuesToSet.gender = eeo.gender;
          if (eeo.race) eeoValuesToSet.race = eeo.race;
          if (eeo.veteran) eeoValuesToSet.veteran = eeo.veteran;
          if (eeo.disability) eeoValuesToSet.disability = eeo.disability;

          if (Object.keys(eeoValuesToSet).length > 0) {
              valuesToSet.eeo = eeoValuesToSet;
              updateMessages.push(t('importer_update_log.eeo', { count: Object.keys(eeoValuesToSet).length }));
              updatedCategories++;
          }
      }
      
      if (result.salary && result.salary.amount > 0) {
          valuesToSet.salaryMinimum = result.salary.amount;
          updateMessages.push(t('importer_update_log.salary'));
          updatedCategories++;
      }
      
      if (Object.keys(valuesToSet).length > 0) {
        form.setFieldsValue(valuesToSet);
      }

      if (updatedCategories > 0) {
        const resultView = (
            <div style={{ textAlign: 'center', paddingTop: '20px' }}>
              <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '20px' }} />
              <Title level={4}>{t('resume_importer.success_title', 'Import Successful!')}</Title>
              <Paragraph>{t('resume_importer.success_message', `AI has finished. The following {{count}} categories have been updated:`, { count: updateMessages.length })}</Paragraph>
              <ul style={{ textAlign: 'left', display: 'inline-block', marginBottom: '20px' }}>
                {updateMessages.map((msg, index) => {
                    const parts = msg.split(':');
                    return <li key={index}><strong>{parts[0]}:</strong>{parts.length > 1 ? parts.slice(1).join(':') : ''}</li>
                })}
              </ul>
               <Paragraph type="secondary">{t('resume_importer.final_note', 'Please review the changes in the form and click "Save" on the main page.')}</Paragraph>
            </div>
        );
        
        setFinalResultMessage(resultView);
        setCurrentStep(2);
      } else {
        message.info(t('resume_importer.no_updates_message', 'AI finished, but no new information was found to update the form.'));
        setIsModalVisible(false);
      }

    } catch (error: unknown) {
      console.error('Error parsing resume:', error);
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error(t('resume_importer.parse_error', 'Failed to parse resume.'));
      }
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleCancel = () => setIsModalVisible(false);
  const onCheckboxChange = (checkedValues: (string | number | boolean)[]) => setSelectedOptions(checkedValues as string[]);

  const draggerProps: UploadProps = {
    name: 'file',
    multiple: false,
    fileList,
    accept: '.pdf',
    customRequest: async ({ file, onSuccess, onError }) => {
        const formData = new FormData();
        formData.append('pdf', file as Blob);

        setLoading(true);
        setLoadingStep(t('resume_importer.uploading_resume', 'Uploading and processing resume...'));

        try {
            if (!apiKey || !user?.uid) {
              throw new Error(t('resume_importer.error_ocr_auth', "API key or User ID is missing for OCR request."));
            }
            const response = await fetch(OCR_API_URL, {
                method: 'POST',
                body: formData,
                headers: {
                  'x-api-key': apiKey,
                  'x-user-id': user.uid,
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || t('resume_importer.error_process_failed', 'Failed to process resume.'));
            }

            const result: OcrApiResponse = await response.json();
            if (!result.success || !result.text) {
                throw new Error(result.error || t('resume_importer.error_process_failed', 'Failed to process resume.'));
            }

            const textContent = Array.isArray(result.text) ? result.text.join('\\n') : result.text;
            setResumeText(textContent);
            
            if (onSuccess) onSuccess(result);
            setCurrentStep(1); // Auto-navigate to the next step
        } catch (error: unknown) {
            console.error('Error processing resume:', error);
            if (error instanceof Error) {
                message.error(error.message);
            } else {
                message.error(t('resume_importer.pdf_read_error', 'Failed to process resume.'));
            }
            
            if (onError) {
                if (error instanceof Error) {
                    onError(error);
                } else {
                    onError(new Error(String(error)));
                }
            }
        } finally {
            setLoading(false);
            setLoadingStep('');
        }
    },
    onChange(info: UploadChangeParam) {
        setFileList(info.fileList.slice(-1)); // Keep only the last file
        if (info.file.status === 'done') {
            // Handled in customRequest
        } else if (info.file.status === 'error') {
             // Handled in customRequest
        }
    },
    onRemove: () => {
        setFileList([]);
        setResumeText('');
    }
  };

  const buttonStyle: React.CSSProperties = {
    background: 'linear-gradient(45deg, #1890ff, #7b68ee)',
    border: 'none',
    height: '48px',
    padding: '0 30px',
    fontSize: '18px',
    fontWeight: 600,
    borderRadius: '8px',
    boxShadow: `0 4px 15px 0 rgba(123, 104, 238, 0.4)`,
  };

  return (
    <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
      <Button type="primary" style={buttonStyle} icon={<RocketOutlined />} onClick={showModal}>
        {t(field.button!.key, field.button!.en_label)}
      </Button>
      <Modal
        title={t('resume_importer.modal_title', 'Smart Resume Import')}
        open={isModalVisible}
        onCancel={handleCancel}
        width={1100}
        destroyOnClose
        footer={
          [
            <Button key="cancel" onClick={handleCancel} disabled={loading}>{t('Cancel', 'Cancel')}</Button>,
            currentStep === 1 && <Button key="submit" type="primary" onClick={handleRunAnalysis} loading={loading}>{t('Run Analysis', 'Run Analysis')}</Button>,
            currentStep === 2 && <Button key="done" type="primary" onClick={handleCancel}>{t('Done', 'Done')}</Button>
          ].filter(Boolean)
        }
      >
        <Steps current={currentStep} style={{ marginBottom: 24, marginTop: 16 }} type="navigation">
           <Step title={t('step1_title', 'Upload Resume')} />
           <Step title={t('step2_title', 'Select Options')} />
           <Step title={t('step3_title', 'Review Results')} />
        </Steps>

        <Spin spinning={loading} tip={loadingStep} size="large">
            <div className="steps-content" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {currentStep === 0 && (
                    <div style={{ width: '100%' }}>
                        <Dragger {...draggerProps} height={250}>
                           <p className="ant-upload-drag-icon"><FileTextOutlined /></p>
                           <p className="ant-upload-text">{t('resume_importer.upload_text', 'Click or drag PDF file to this area')}</p>
                           <p className="ant-upload-hint">{t('resume_importer.upload_hint', 'Supports single PDF file import.')}</p>
                        </Dragger>
                    </div>
                )}
                {currentStep === 1 && (
                     <div style={{ width: '100%', padding: '0 24px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <Title level={4}>{t('resume_importer.options_title', 'AI Import Options')}</Title>
                            <Paragraph>{t('resume_importer.upload_success_filename', 'Successfully uploaded: {{filename}}', { filename: fileList[0]?.name })}</Paragraph>
                            <Paragraph type="secondary">{t('resume_importer.options_desc', 'Select which sections to update from the resume.')}</Paragraph>
                        </div>
                        <Checkbox.Group
                            style={{ width: '100%' }} onChange={onCheckboxChange}
                            value={selectedOptions}
                        >
                            <Row gutter={[16, 16]}>
                              {field.importer_options!.map(option => (
                                <Col span={8} key={option.key}>
                                  <Checkbox value={option.key}>{t(`importer_options.${option.key}`, option.en_label)}</Checkbox>
                                </Col>
                              ))}
                            </Row>
                        </Checkbox.Group>
                    </div>
                )}
                {currentStep === 2 && finalResultMessage}
            </div>
         </Spin>
      </Modal>
    </div>
  );
};

export default ResumeImporter; 
