import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Modal, Form, Typography, List } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { Field } from '../types';
import type { TFunction } from 'i18next';

const { TextArea } = Input;
const { Text } = Typography;

interface SimpleKeyValueManagerProps {
  value?: Record<string, string>;
  onChange?: (value: Record<string, string>) => void;
  t: TFunction;
  label: string;
  keyFieldLabel: string;
  valueFieldLabel: string;
  valueFieldSchema: Field; 
}

const SimpleKeyValueManager: React.FC<SimpleKeyValueManagerProps> = ({ value = {}, onChange, t, label, keyFieldLabel, valueFieldLabel }) => {
  const [list, setList] = useState<Array<{ key: string; value: string }>>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ key: string; value: string; originalKey: string } | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    setList(Object.entries(value).map(([key, value]) => ({ key, value })));
  }, [value]);

  const triggerChange = useCallback((currentItems: { key: string; value: string }[]) => {
    const newObject = currentItems.reduce((acc, item) => {
        if (item.key.trim()) {
            acc[item.key.trim()] = item.value;
        }
        return acc;
    }, {} as Record<string, string>);
    onChange?.(newObject);
  }, [onChange]);

  const handleShowModal = (item: { key: string; value: string } | null = null) => {
    setEditingItem(item ? { ...item, originalKey: item.key } : null);
    form.setFieldsValue(item || { key: '', value: '' });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    form.resetFields();
  };

  const handleSave = () => {
    form.validateFields().then(formValues => {
      const newItems = editingItem
        ? list.map(i => i.key === editingItem.originalKey ? { key: formValues.key, value: formValues.value } : i)
        : [...list, { key: formValues.key, value: formValues.value }];
      
      setList(newItems);
      triggerChange(newItems);
      handleCancel();
    });
  };

  const handleDelete = (keyToDelete: string) => {
    Modal.confirm({
      title: t('delete_confirm_title', 'Confirm Deletion'),
      content: t('delete_confirm_content_single', 'Are you sure you want to delete this item?'),
      okText: t('delete', 'Delete'),
      okType: 'danger',
      cancelText: t('cancel', 'Cancel'),
      onOk: () => {
        const newItems = list.filter(item => item.key !== keyToDelete);
        setList(newItems);
        triggerChange(newItems);
      },
    });
  };

  const modalTitle = editingItem ? t('edit_item_title', { label }) : t('add_item_title', { label });

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text strong>{label}</Text>
        <Button icon={<PlusOutlined />} onClick={() => handleShowModal()}>
          {t('add', 'Add')}
        </Button>
      </div>
      <List
        bordered
        dataSource={list}
        renderItem={item => (
          <List.Item
            actions={[
              <Button type="link" icon={<EditOutlined />} onClick={() => handleShowModal(item)}>{t('edit', 'Edit')}</Button>,
              <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item.key)}>{t('delete', 'Delete')}</Button>
            ]}
          >
            <List.Item.Meta title={item.key} description={item.value} />
          </List.Item>
        )}
      />
      <Modal
        title={modalTitle}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={handleCancel}
        okText={t('OK', 'OK')}
        cancelText={t('cancel', 'Cancel')}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="key" label={keyFieldLabel} rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="value" label={valueFieldLabel} rules={[{ required: true }]}>
            <TextArea rows={8} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default SimpleKeyValueManager; 