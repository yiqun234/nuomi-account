import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Modal, Space, Typography } from 'antd';
import React, { useState } from 'react';
import type { Field } from '../types';

const { Title } = Typography;

// Define a specific type for the list items to avoid using 'any'.
type ListItemData = Record<string, string | number | boolean | undefined>;

interface ComplexListComponentProps {
  fieldKey: string;
  label: string;
  value?: ListItemData[];
  onChange?: (value: ListItemData[]) => void;
  itemSchema: { properties: Field[] };
  t: (key: string, defaultVal: string) => string;
}

export const ComplexListComponent: React.FC<ComplexListComponentProps> = ({
  fieldKey,
  label,
  value = [],
  onChange,
  itemSchema,
  t,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const showModal = (index?: number) => {
    if (typeof index === 'number') {
      setEditingIndex(index);
      form.setFieldsValue(value[index]);
    } else {
      setEditingIndex(null);
      form.resetFields();
      if (fieldKey === 'positionsWithCount') {
        form.setFieldsValue({ count: 100 });
      }
    }
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      const newValues = values as ListItemData;
      let newValue: ListItemData[];
      if (editingIndex !== null) {
        newValue = [...(value || [])];
        newValue[editingIndex] = newValues;
      } else {
        newValue = [...(value || []), newValues];
      }
      onChange?.(newValue);
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleRemove = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange?.(newValue);
  };

  const renderItem = (item: ListItemData, index: number) => {
    // Attempt to find a meaningful display key, fallback to the first key.
    const displayKey = ['name', 'title', 'school', 'question'].find(k => k in item) || Object.keys(item)[0];
    const displayValue = item[displayKey] || 'Untitled';
    
    return (
      <div
        key={index}
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: '2px',
          padding: '8px',
          marginBottom: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{displayValue}</span>
        <Space>
          <Button onClick={() => showModal(index)} size="small">
            {t('Edit', 'Edit')}
          </Button>
          <Button onClick={() => handleRemove(index)} danger size="small">
            {t('Remove', 'Remove')}
          </Button>
        </Space>
      </div>
    );
  };

  return (
    <div style={{ border: '1px solid #f0f0f0', padding: 16, borderRadius: 4 }}>
      <Title level={5}>{label}</Title>
      <div>{Array.isArray(value) && value.map(renderItem)}</div>
      <Button
        type="dashed"
        onClick={() => showModal()}
        style={{ width: '100%', marginTop: '10px' }}
        icon={<PlusOutlined />}
      >
        {t('Add', 'Add')}
      </Button>

      <Modal
        title={editingIndex !== null ? t('Edit Item', 'Edit Item') : t('Add Item', 'Add Item')}
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={t('OK', 'OK')}
        cancelText={t('Cancel', 'Cancel')}
      >
        <Form form={form} layout="vertical">
          {itemSchema.properties.map(field => (
            <Form.Item
              key={field.key}
              label={t(`${fieldKey}_${field.key}`, field.en_label)}
              name={field.key}
              rules={[{ required: true }]}
            >
              {field.ui_hint === 'number_input' ? <InputNumber style={{ width: '100%' }} /> : <Input />}
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </div>
  );
}; 