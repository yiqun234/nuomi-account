import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Select, InputNumber, Space, Modal, Form, Typography, List, Checkbox } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { Field } from '../types';
import type { TFunction } from 'i18next';

const { TextArea } = Input;
const { Text } = Typography;

interface ManagedKeyValueListProps {
  value?: Record<string, string | number>;
  onChange?: (value: Record<string, string | number>) => void;
  t: TFunction;
  valueFieldSchema: Field;
  label: string;
  keyFieldLabel: string;
  valueFieldLabel: string;
  nonDeletableKeys?: string[];
}

const renderValueInput = (schema: Field, t: TFunction, props?: Record<string, unknown>) => {
    switch (schema.ui_hint) {
      case 'number_input':
        return <InputNumber style={{ width: '100%' }} {...props} />;
      case 'select':
        return (
          <Select style={{ width: '100%' }} showSearch optionFilterProp="children" {...props}>
            {schema.options?.map(opt => (
              <Select.Option key={opt.key} value={opt.value !== undefined ? opt.value : opt.key}>
                {String(t(`${schema.key}_${opt.key}`, opt.en_label))}
              </Select.Option>
            ))}
          </Select>
        );
      default:
        return <Input {...props} />;
    }
};

const ManagedKeyValueList: React.FC<ManagedKeyValueListProps> = ({ value = {}, onChange, t, valueFieldSchema, label, keyFieldLabel, valueFieldLabel, nonDeletableKeys = [] }) => {
  const [items, setItems] = useState<{ key: string; value: string | number }[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ key: string; value: string | number; originalKey: string } | null>(null);

  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [bulkAddForm] = Form.useForm();
  const [bulkEditForm] = Form.useForm();

  useEffect(() => {
    setItems(
      Object.entries(value || {})
        .filter(([, val]) => val !== undefined)
        .map(([key, val]) => ({ key, value: val as string | number }))
    );
  }, [value]);

  const triggerChange = useCallback((currentItems: { key: string; value: string | number }[]) => {
    const newObject = currentItems.reduce((acc, item) => {
        if (item.key.trim()) {
            acc[item.key.trim()] = item.value;
        }
        return acc;
    }, {} as Record<string, string | number>);
    onChange?.(newObject);
  }, [onChange]);
  
  const getDisplayValue = useCallback((itemValue: string | number) => {
    if (valueFieldSchema.ui_hint === 'select' && valueFieldSchema.options) {
        const option = valueFieldSchema.options.find(opt => (opt.value !== undefined ? opt.value : opt.key) === itemValue);
        if (option) {
            return t(`${valueFieldSchema.key}_${option.key}`, option.en_label);
        }
    }
    return String(itemValue);
  }, [t, valueFieldSchema]);

  const getDefaultValue = useCallback(() => {
    if (valueFieldSchema.ui_hint === 'select' && valueFieldSchema.options && valueFieldSchema.options.length > 0) {
        const firstOption = valueFieldSchema.options[0];
        return firstOption.value !== undefined ? firstOption.value : firstOption.key;
    }
    if (valueFieldSchema.type === 'number') {
        return 0;
    }
    return '';
  }, [valueFieldSchema]);

  // --- Single Item Operations ---
  const handleShowAddModal = () => {
      addForm.resetFields();
      addForm.setFieldsValue({ value: getDefaultValue() });
      setIsEditModalOpen(true);
      setEditingItem(null); // Ensure we are in "add" mode
  };
    
  const handleShowEditModal = (item: { key: string; value: string | number }) => {
    setEditingItem({ ...item, originalKey: item.key });
    editForm.setFieldsValue(item);
    setIsEditModalOpen(true);
  };
  
  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = () => {
    const form = editingItem ? editForm : addForm;
    form.validateFields().then(formValues => {
      if (editingItem && nonDeletableKeys.includes(editingItem.originalKey) && editingItem.originalKey !== formValues.key) {
        Modal.error({
          title: t('error', 'Error'),
          content: t('cannot_edit_default_key', 'Cannot change the key of a default item.'),
        });
        return;
      }
      let newItems;
      if (editingItem) { // Edit mode
        newItems = items.map(i => i.key === editingItem.originalKey ? { ...i, key: formValues.key, value: formValues.value } : i);
      } else { // Add mode
        newItems = [...items, { key: formValues.key, value: formValues.value }];
      }
      setItems(newItems);
      triggerChange(newItems);
      handleEditCancel();
    });
  };

  const handleDeleteSingle = (keyToDelete: string) => {
    if (nonDeletableKeys.includes(keyToDelete)) {
      Modal.warning({
        title: t('action_not_allowed', 'Action Not Allowed'),
        content: t('cannot_delete_default_item', 'This is a default item and cannot be deleted.'),
      });
      return;
    }
    Modal.confirm({
      title: t('delete_confirm_title', 'Confirm Deletion'),
      content: t('delete_confirm_content_single', 'Are you sure you want to delete this item?'),
      okText: t('delete', 'Delete'),
      okType: 'danger',
      cancelText: t('cancel', 'Cancel'),
      onOk: () => {
        const newItems = items.filter(item => item.key !== keyToDelete);
        setItems(newItems);
        triggerChange(newItems);
      },
    });
  };

  // --- Bulk Operations ---
  const handleSelect = (key: string, checked: boolean) => {
    const newSelectedKeys = new Set(selectedKeys);
    if (checked) newSelectedKeys.add(key);
    else newSelectedKeys.delete(key);
    setSelectedKeys(newSelectedKeys);
  };
  
  const handleSelectAll = (e: { target: { checked: boolean } }) => {
    const allKeys = items.map(item => item.key);
    if (e.target.checked) {
      setSelectedKeys(new Set(allKeys));
    } else {
      // When unchecking, keep non-deletable items selected if needed, or clear all.
      // Current behavior: clear all. Can be adjusted.
      setSelectedKeys(new Set());
    }
  };
  
  const handleDeleteSelected = () => {
    // Filter out non-deletable keys from the selection to be deleted
    const keysToDelete = new Set([...selectedKeys].filter(key => !nonDeletableKeys.includes(key)));

    if (keysToDelete.size === 0) {
        Modal.info({
            title: t('no_items_to_delete_title', 'No Items to Delete'),
            content: t('no_items_to_delete_content', 'The selected items are defaults and cannot be deleted.'),
            okText: t('OK', 'OK'),
        });
        return;
    }

    Modal.confirm({
        title: t('delete_confirm_title', 'Confirm Deletion'),
        content: t('delete_confirm_content_bulk', { 
            count: keysToDelete.size, 
            defaultValue: `Are you sure you want to delete these ${keysToDelete.size} items?`
        }),
        okText: t('delete', 'Delete'),
        okType: 'danger',
        cancelText: t('cancel', 'Cancel'),
        onOk: () => {
            const newItems = items.filter(item => !keysToDelete.has(item.key));
            setItems(newItems);
            setSelectedKeys(new Set());
            triggerChange(newItems);
        },
    });
  };

  const handleShowBulkAddModal = () => {
    bulkAddForm.resetFields();
    bulkAddForm.setFieldsValue({ value: getDefaultValue() });
    setIsBulkAddModalOpen(true);
  };
  
  const handleBulkAdd = () => {
    bulkAddForm.validateFields().then(values => {
        const { keys: keysText, value: commonValue } = values;
        const newKeys = keysText.split('\n').map((k:string) => k.trim()).filter(Boolean);
        const existingKeys = new Set(items.map(item => item.key));
        const uniqueNewItems = newKeys
            .filter((k:string) => !existingKeys.has(k))
            .map((k:string) => ({ key: k, value: commonValue }));

        const updatedItems = [...items, ...uniqueNewItems];
        setItems(updatedItems);
        triggerChange(updatedItems);
        setIsBulkAddModalOpen(false);
    });
  };

  const handleShowBulkEditModal = () => {
      bulkEditForm.resetFields();
      bulkEditForm.setFieldsValue({ value: getDefaultValue() });
      setIsBulkEditModalOpen(true);
  }
  
  const handleBulkEditSave = () => {
    bulkEditForm.validateFields().then(values => {
        const { value: newValue } = values;
        const newItems = items.map(item => 
            selectedKeys.has(item.key) ? { ...item, value: newValue } : item
        );
        setItems(newItems);
        setSelectedKeys(new Set());
        triggerChange(newItems);
        setIsBulkEditModalOpen(false);
    });
  };

  const isAllSelected = items.length > 0 && selectedKeys.size === items.length;
  const modalTitle = editingItem ? t('edit_item_title', { label }) : t('add_item_title', { label });

  return (
    <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text strong>{label}</Text>
            <Space>
                <Button icon={<PlusOutlined />} onClick={handleShowAddModal}>{t('add', 'Add')}</Button>
                <Button onClick={handleShowBulkAddModal}>{t('bulk_add', 'Bulk Add')}</Button>
                <Button onClick={handleShowBulkEditModal} disabled={selectedKeys.size === 0}>{t('bulk_edit', 'Bulk Edit')}</Button>
                <Button danger onClick={handleDeleteSelected} disabled={selectedKeys.size === 0}>{t('delete_selected', 'Delete Selected')}</Button>
            </Space>
        </div>
        <List
            header={
              <div style={{ padding: '0 16px' }}>
                <Checkbox
                  indeterminate={selectedKeys.size > 0 && selectedKeys.size < items.length}
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  // If we want to prevent non-deletable from being selected for deletion
                  // disabled={items.every(item => nonDeletableKeys.includes(item.key))}
                >
                  {t('select_all', 'Select All')}
                </Checkbox>
              </div>
            }
            bordered
            dataSource={items}
            renderItem={(item) => (
                <List.Item
                    actions={[
                        <Button type="link" icon={<EditOutlined />} onClick={() => handleShowEditModal(item)}>{t('edit', 'Edit')}</Button>,
                        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteSingle(item.key)} disabled={nonDeletableKeys.includes(item.key)}>{t('delete', 'Delete')}</Button>
                    ]}
                >
                    <Checkbox 
                      style={{ marginRight: 16 }} 
                      checked={selectedKeys.has(item.key)} 
                      onChange={(e) => handleSelect(item.key, e.target.checked)}
                    />
                    <List.Item.Meta
                        title={item.key}
                        description={getDisplayValue(item.value)}
                    />
                </List.Item>
            )}
        />

        {/* Add/Edit Modal */}
        <Modal
            title={modalTitle}
            open={isEditModalOpen}
            onOk={handleSave}
            onCancel={handleEditCancel}
            okText={t('OK', 'OK')}
            cancelText={t('cancel', 'Cancel')}
        >
            <Form form={editingItem ? editForm : addForm} layout="vertical" name="item_form">
                <Form.Item
                  name="key"
                  label={keyFieldLabel}
                  rules={[{ required: true, message: t('key_is_required', 'Key is required') }]}
                >
                  <Input disabled={editingItem !== null && nonDeletableKeys.includes(editingItem.originalKey)} />
                </Form.Item>
                <Form.Item
                  name="value"
                  label={valueFieldLabel}
                  rules={[{ required: true, message: t('value_is_required', 'Value is required') }]}
                >
                  {renderValueInput(valueFieldSchema, t)}
                </Form.Item>
            </Form>
        </Modal>

        {/* Bulk Add Modal */}
        <Modal
            title={t('bulk_add_title', 'Bulk Add Items')}
            open={isBulkAddModalOpen}
            onOk={handleBulkAdd}
            onCancel={() => setIsBulkAddModalOpen(false)}
            okText={t('OK', 'OK')}
            cancelText={t('cancel', 'Cancel')}
        >
            <Form form={bulkAddForm} layout="vertical">
                <Form.Item name="keys" label={t('keys_to_add', 'Items to Add (one per line)')} rules={[{ required: true }]}>
                    <TextArea rows={10} />
                </Form.Item>
                <Form.Item name="value" label={valueFieldLabel} rules={[{ required: true }]}>
                    {renderValueInput(valueFieldSchema, t)}
                </Form.Item>
            </Form>
        </Modal>

         {/* Bulk Edit Modal */}
         <Modal
            title={t('bulk_edit_title', 'Bulk Edit Selected Items')}
            open={isBulkEditModalOpen}
            onOk={handleBulkEditSave}
            onCancel={() => setIsBulkEditModalOpen(false)}
            okText={t('OK', 'OK')}
            cancelText={t('cancel', 'Cancel')}
        >
            <Form form={bulkEditForm} layout="vertical">
                <Form.Item name="value" label={valueFieldLabel} rules={[{ required: true }]}>
                    {renderValueInput(valueFieldSchema, t)}
                </Form.Item>
            </Form>
        </Modal>
    </Card>
  );
};

export default ManagedKeyValueList;
