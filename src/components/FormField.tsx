import React, { useState } from 'react';
import { Form, Input, Checkbox, Select, InputNumber, Row, Col, Space, Button, Divider, Radio, Modal, Tooltip } from 'antd';
import type { FormInstance } from 'antd';
import { MinusCircleOutlined, PlusOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import ListManager from './ListManager';
import type { Field, FieldOption } from '../types';
import { defaultConfig } from '../config/config.default';
import { useWatch } from 'antd/es/form/Form';
import SchemaForm from './SchemaForm';
import DataTypeAwareCheckboxGroup from './DataTypeAwareCheckboxGroup';
import ManagedKeyValueList from './ManagedKeyValueList';
import SimpleKeyValueManager from './SimpleKeyValueManager';
import ResumeImporter from './ResumeImporter';
import type { User } from 'firebase/auth';

const { TextArea } = Input;

const LabelWithIndicator: React.FC<{ label: string; show: boolean; t: TFunction }> = ({ label, show, t }) => (
    <Space>
      {label}
      {show && <Tooltip title={t('ai_did_not_fill', 'AI did not recognize this field')}><ExclamationCircleFilled style={{ color: '#faad14' }} /></Tooltip>}
    </Space>
);

const CheckboxWithPromptModal: React.FC<{ field: Field; t: TFunction; form: FormInstance }> = ({ field, t, form }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [promptValue, setPromptValue] = useState('');
    const { target_field, button_label_key, modal_title_key } = field.prompt_config!;

    const showModal = () => {
        const currentValue = form.getFieldValue(target_field);
        setPromptValue(currentValue);
        setIsModalVisible(true);
    };

    const handleOk = () => {
        form.setFieldsValue({ [target_field]: promptValue });
        setIsModalVisible(false);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };
    
    const handleReset = () => {
        const targetField = field.prompt_config!.target_field as keyof typeof defaultConfig;
        const defaultPrompt = defaultConfig[targetField] as string;
        setPromptValue(defaultPrompt);
    };

    const label = t(field.key, field.en_label);

    return (
        <>
            <Form.Item label=" " colon={false}>
                <Space>
                    <Form.Item name={field.key} valuePropName="checked" noStyle>
                        <Checkbox>{label}</Checkbox>
                    </Form.Item>
                    <Button onClick={showModal}>{t(button_label_key, 'Custom Prompt')}</Button>
                </Space>
            </Form.Item>
            <Modal
                title={t(modal_title_key, 'Custom Prompt')}
                open={isModalVisible}
                onCancel={handleCancel}
                width={800}
                footer={[
                    <Button key="reset" onClick={handleReset}>
                        {t('reset_to_default', 'Reset to Default')}
                    </Button>,
                    <Button key="back" onClick={handleCancel}>
                        {t('Cancel', 'Cancel')}
                    </Button>,
                    <Button key="submit" type="primary" onClick={handleOk}>
                        {t('OK', 'OK')}
                    </Button>,
                ]}
            >
                <TextArea
                    value={promptValue}
                    onChange={(e) => setPromptValue(e.target.value)}
                    rows={20}
                />
            </Modal>
        </>
    );
};

const CheckboxWithInlineInput: React.FC<{field: Field; t: TFunction, form: FormInstance, namePath: (string|number)[]}> = ({ field, t, form, namePath }) => {
    const { i18n } = useTranslation();
    const isChecked = useWatch(namePath, form);
    const inlineInputKey = field.inline_input!.key;
    
    // Replace the last part of the path with the inline input key
    const inputNamePath = [...namePath.slice(0, namePath.length - 1), inlineInputKey];

    const label = t(field.key, field.en_label);
    const unitLabel = t(`${field.key}_${inlineInputKey}_unit`, i18n.language.startsWith('zh') ? field.inline_input!.zh_unit : field.inline_input!.en_unit);

    return (
        <Form.Item label=" " colon={false}>
            <Space>
                <Form.Item name={namePath} valuePropName="checked" noStyle>
                    <Checkbox>{label}</Checkbox>
                </Form.Item>
                <Form.Item name={inputNamePath} noStyle>
                    <InputNumber min={0} max={100} disabled={!isChecked} />
                </Form.Item>
                <span>{unitLabel}</span>
            </Space>
        </Form.Item>
    );
};

const RadioGroupWithInlineInput: React.FC<{field: Field; t: TFunction, form: FormInstance}> = ({ field, t, form }) => {
    const { i18n } = useTranslation();
    const label = t(field.key, field.en_label);
    const radioValue = useWatch(field.key, form);

    return (
        <Form.Item label={label} name={field.key}>
            <Radio.Group>
                {field.options!.map((option: FieldOption) => {
                    if (option.inline_input) {
                        return (
                            <Radio key={option.key} value={option.key}>
                                <Space>
                                    {t(`${field.key}_${option.key}`, i18n.language.startsWith('zh') ? option.zh_label : option.en_label)}
                                    <Form.Item name={option.inline_input.key} noStyle>
                                        <InputNumber min={1} disabled={radioValue !== option.key} />
                                    </Form.Item>
                                    {t(`${field.key}_${option.inline_input.key}_unit`, i18n.language.startsWith('zh') ? option.inline_input!.zh_unit : option.inline_input!.en_unit)}
                                </Space>
                            </Radio>
                        );
                    }
                    return (
                        <Radio key={option.key} value={option.key}>
                            {t(`${field.key}_${option.key}`, option.en_label)}
                        </Radio>
                    );
                })}
            </Radio.Group>
        </Form.Item>
    );
};

const renderField = (field: Field, t: TFunction, form: FormInstance, namePath: (string | number)[], user: User | null, apiKey: string | null, onSave?: (missedFields: Set<string>) => Promise<void>, aiRunCompleted?: boolean, aiMissedFields?: Set<string>) => {
  const label = t(field.key, field.en_label);
  console.log(namePath)
  console.log(aiMissedFields)
  const showIndicator = !!aiMissedFields?.has(namePath.join('.'));

  switch (field.ui_hint) {
    case 'hidden':
        return null;
    case 'group':
        return <SchemaForm 
            group={{
                key: field.key,
                group_name_en: field.group_name_en!,
                group_name_zh: field.group_name_zh!,
                fields: field.fields!
            }} 
            t={t} 
            form={form} 
            namePrefix={namePath} 
            user={user} 
            apiKey={apiKey}
            onSave={onSave}
            aiRunCompleted={aiRunCompleted}
            aiMissedFields={aiMissedFields}
        />
    case 'checkbox_prompt':
        return <CheckboxWithPromptModal field={field} t={t} form={form} />;
    case 'checkbox_with_inline_input':
        return <CheckboxWithInlineInput field={field} t={t} form={form} namePath={namePath} />;
    case 'text_input':
      return (
        <Form.Item label={<LabelWithIndicator label={label} show={showIndicator} t={t} />} name={namePath}>
          <Input />
        </Form.Item>
      );
    case 'password_input':
      return (
        <Form.Item label={<LabelWithIndicator label={label} show={showIndicator} t={t} />} name={namePath}>
          <Input.Password />
        </Form.Item>
      );
    case 'number_input':
       return (
        <Form.Item label={<LabelWithIndicator label={label} show={showIndicator} t={t} />} name={namePath}>
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
      );
    case 'checkbox':
      return (
        <Form.Item name={namePath} valuePropName="checked" label=" " colon={false}>
          <Checkbox>{label}</Checkbox>
        </Form.Item>
      );
    case 'select':
      return (
        <Form.Item label={<LabelWithIndicator label={label} show={showIndicator} t={t} />} name={namePath}>
          <Select
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.children as unknown as string ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {field.options!.map((opt: FieldOption) => (
              <Select.Option key={opt.key} value={opt.value !== undefined ? opt.value : opt.key}>
                {String(t(`${field.key}_${opt.key}`, opt.en_label))}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      );
    case 'textarea': {
        const placeholder = t(`${field.key}.placeholder`, field.description_en || '');

        if (field.type === 'array') {
            return (
                <Form.Item
                    label={<LabelWithIndicator label={label} show={showIndicator} t={t} />}
                    name={namePath}
                    getValueFromEvent={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                        e.target.value.split('\n')
                    }
                    getValueProps={(value: string[]) => ({ 
                        value: Array.isArray(value) ? value.join('\n') : '' 
                    })}
                >
                    <TextArea rows={4} placeholder={placeholder} />
                </Form.Item>
            );
        }

       return (
        <Form.Item label={<LabelWithIndicator label={label} show={showIndicator} t={t} />} name={namePath}>
          <TextArea rows={4} placeholder={placeholder} />
        </Form.Item>
      );
    }
    case 'checkbox_group':
      return (
        <Form.Item label={<LabelWithIndicator label={label} show={showIndicator} t={t} />} name={namePath}>
          <DataTypeAwareCheckboxGroup field={field} t={t} />
        </Form.Item>
      );
    case 'radio_group': {
        const hasInlineInput = field.options?.some(opt => opt.inline_input);
        if (hasInlineInput) {
            return <RadioGroupWithInlineInput field={field} t={t} form={form} />;
        }
        return (
          <Form.Item label={<LabelWithIndicator label={label} show={showIndicator} t={t} />} name={namePath}>
            <Radio.Group>
              {field.options!.map((option: FieldOption) => (
                <Radio key={option.key} value={option.key}>
                  {String(t(`${field.key}_${option.key}`, option.en_label))}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        );
    }

    case 'radio_group_inline':
        return (
            <Form.Item label={<LabelWithIndicator label={label} show={showIndicator} t={t} />} name={namePath}>
                <Radio.Group>
                {field.options!.map((option: FieldOption) => (
                    <Radio key={option.key} value={option.key}>
                    {String(t(`${field.key}_${option.key}`, option.en_label))}
                    </Radio>
                ))}
                </Radio.Group>
            </Form.Item>
            );
    case 'tag_list':
      return (
        <Form.Item
          label={<LabelWithIndicator label={label} show={showIndicator} t={t} />}
          name={namePath}
          getValueFromEvent={(e: React.ChangeEvent<HTMLTextAreaElement>) => e.target.value.split('\n').map((s: string) => s.trim()).filter(Boolean)}
          getValueProps={(value: string[]) => ({ value: Array.isArray(value) ? value.join('\n') : '' })}
          help={t('form_item_help_one_per_line', 'One item per line')}
        >
          <TextArea
            rows={4}
            placeholder={t(
              'form_item_placeholder_one_per_line',
              'Enter items, one per line...'
            )}
          />
        </Form.Item>
      );
    case 'key_value_list':
        return (
          <>
            <Divider orientation="left">{label}</Divider>
            <Form.List name={namePath}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'key']}
                        rules={[{ required: true, message: 'Key is required' }]}
                      >
                        <Input placeholder={t((field as Field & {key_label_en: string}).key_label_en!)} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'value']}
                        rules={[{ required: true, message: 'Value is required' }]}
                      >
                        {(field as Field & {value_type: string}).value_type === 'integer' ? <InputNumber /> : <Input />}
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      {t('Add')} {label}
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </>
        );

    case 'managed_key_value_list':
        {
            const nonDeletableKeys = field.key === 'experience' 
                ? ['default'] 
                : [];
            
            return (
                <Form.Item name={namePath} noStyle>
                     <ManagedKeyValueList
                        label={label}
                        t={t}
                        valueFieldSchema={field.value_field_schema!}
                        keyFieldLabel={t(`${field.key}_key_label`, field.key_label_en || '')}
                        valueFieldLabel={t(`${field.key}_${field.value_field_schema!.key}_label`, field.value_field_schema!.en_label || '')}
                        nonDeletableKeys={nonDeletableKeys}
                    />
                </Form.Item>
            );
        }
    case 'simple_key_value_list':
        return (
            <Form.Item name={namePath} noStyle>
                <SimpleKeyValueManager
                    label={label}
                    t={t}
                    valueFieldSchema={field.value_field_schema!}
                    keyFieldLabel={t(`${field.key}_key_label`, field.key_label_en || '')}
                    valueFieldLabel={t(`${field.key}_${field.value_field_schema!.key}_label`, field.value_field_schema!.en_label || '')}
                    description={t(`${field.key}.description`, (field.description_zh || field.description_en) || '')}
                />
            </Form.Item>
        );
    case 'card_list':
        return (
            <Form.Item name={namePath} noStyle>
                <ListManager
                    fieldKey={field.key}
                    label={label}
                    itemSchema={field.item_schema!}
                    t={t as (key: string, defaultVal?: string) => string}
                />
            </Form.Item>
        );
    case 'text_input_readonly':
        return (
         <Form.Item label={label} name={namePath}>
           <Input readOnly />
         </Form.Item>
       );
    case 'grid_select':
        return (
            <Form.Item label={label}>
                <Row gutter={[16, 16]}>
                {field.options!.map((option: FieldOption) => (
                    <Col span={12} key={option.key}>
                    <Form.Item label={String(t(`${field.key}_${option.key}`, option.en_label))} name={[...namePath, option.key]}>
                        <Select>
                        {option.items!.map((item: string) => (
                            <Select.Option key={item} value={item}>{item}</Select.Option>
                        ))}
                        </Select>
                    </Form.Item>
                    </Col>
                ))}
                </Row>
            </Form.Item>
        );
    case 'checkbox_button':
        return (
            <Form.Item label=" " colon={false}>
                <Space>
                    <Form.Item name={namePath} valuePropName="checked" noStyle>
                        <Checkbox>{label}</Checkbox>
                    </Form.Item>
                    <ResumeImporter field={field} t={t} form={form} user={user} apiKey={apiKey} />
                </Space>
            </Form.Item>
        )
    case 'ai_importer':
        return (
            <ResumeImporter 
                field={field} 
                t={t} 
                form={form} 
                user={user} 
                apiKey={apiKey} 
                onSave={onSave}
            />
        )
    default:
      return null;
  }
};

const FormField = ({ field, t, form, namePath, user, apiKey, onSave, aiRunCompleted, aiMissedFields }: { field: Field; t: TFunction; form: FormInstance, namePath: (string|number)[], user: User | null, apiKey: string | null, onSave?: (missedFields: Set<string>) => Promise<void>, aiRunCompleted?: boolean, aiMissedFields?: Set<string> }) => {
  return renderField(field, t, form, namePath, user, apiKey, onSave, aiRunCompleted, aiMissedFields);
};

export default FormField; 