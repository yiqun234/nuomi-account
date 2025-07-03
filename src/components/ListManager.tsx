import React, { useState } from 'react';
import { Button, Modal, Form, Input, InputNumber, Select, Space, List, Checkbox, Divider, Popconfirm, message, Row, Col, Typography, Pagination } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import { PlusOutlined } from '@ant-design/icons';
import type { Field } from '../types';
import { useWatch } from 'antd/es/form/Form';

const { TextArea } = Input;
type ListItem = Record<string, string | number | boolean | undefined>;

// Helper to render form items based on schema
const renderFormItems = (fields: Field[], t: (key: string, defaultVal?: string) => string, parentFieldKey?: string, form?: any) => {
    const currentYear = new Date().getFullYear();
    const fromYears = Array.from({ length: 101 }, (_, i) => (currentYear - i).toString());
    const toYears = Array.from({ length: 111 }, (_, i) => (currentYear + 10 - i).toString());

    const fieldLayoutSchema: { [key: string]: (string | string[])[] } = {
        workExperiences: ['title', 'company', ['from_year', 'from_month'], [ 'to_year', 'to_month'], 'current', 'description'],
        educations: ['school', 'city', 'degree', 'major', ['from_year', 'from_month', ], ['to_year', 'to_month'], 'current'],
    };

    // Watch for current field changes to disable/enable end date fields
    const currentValue = form ? useWatch('current', form) : false;

    // Effect to clear end date fields when current is checked
    React.useEffect(() => {
        if (currentValue && form && (parentFieldKey === 'workExperiences' || parentFieldKey === 'educations')) {
            form.setFieldsValue({
                to_month: undefined,
                to_year: undefined
            });
        }
    }, [currentValue, form, parentFieldKey]);

    const renderSingleField = (field: Field) => {
        const translationKey = parentFieldKey ? `${parentFieldKey}_${field.key}` : field.key;
        const label = t(translationKey, field.en_label);

        // Disable end date fields when current is true
        const isEndDateField = field.key === 'to_month' || field.key === 'to_year';
        const shouldDisable = isEndDateField && currentValue && (parentFieldKey === 'workExperiences' || parentFieldKey === 'educations');

        if ((parentFieldKey === 'workExperiences' || parentFieldKey === 'educations') && (field.key === 'from_year' || field.key === 'to_year')) {
            const yearOptions = field.key === 'from_year' ? fromYears : toYears;
            return (
                <Form.Item 
                    key={field.key} 
                    label={label} 
                    name={field.key} 
                    rules={shouldDisable ? [] : [{ required: true }]}
                >
                    <Select showSearch disabled={shouldDisable}>
                        {yearOptions.map(year => <Select.Option key={year} value={year}>{year}</Select.Option>)}
                    </Select>
                </Form.Item>
            );
        }

        switch (field.ui_hint) {
            case 'number_input': return <Form.Item key={field.key} label={label} name={field.key} rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item>;
            case 'select': 
                if (field.key === 'to_month') {
                    return (
                        <Form.Item 
                            key={field.key} 
                            label={label} 
                            name={field.key} 
                            rules={shouldDisable ? [] : [{ required: true }]}
                        >
                            <Select disabled={shouldDisable}>
                                {field.options?.map(opt => (<Select.Option key={opt.key} value={opt.key}>{String(t(opt.key, opt.en_label))}</Select.Option>))}
                            </Select>
                        </Form.Item>
                    );
                }
                return <Form.Item key={field.key} label={label} name={field.key} rules={[{ required: true }]}><Select>{field.options?.map(opt => (<Select.Option key={opt.key} value={opt.key}>{String(t(opt.key, opt.en_label))}</Select.Option>))}</Select></Form.Item>;
            case 'textarea': return <Form.Item key={field.key} label={label} name={field.key} rules={[{ required: true }]}><TextArea rows={4} /></Form.Item>;
            case 'checkbox': return <Form.Item key={field.key} name={field.key} valuePropName="checked"><Checkbox>{label}</Checkbox></Form.Item>;
            case 'text_input': default: return <Form.Item key={field.key} label={label} name={field.key} rules={[{ required: true }]}><Input /></Form.Item>;
        }
    };

    const layoutOrder = parentFieldKey ? fieldLayoutSchema[parentFieldKey] : undefined;
    
    // Only apply the complex layout if we are rendering the full form (i.e., more than 1 field),
    // not a partial form like in batch-edit modals.
    if (layoutOrder && fields.length > 1) {
        const fieldMap = new Map(fields.map(f => [f.key, f]));
        return layoutOrder.map(keyOrPair => {
            if (Array.isArray(keyOrPair)) {
                const [key1, key2] = keyOrPair;
                const field1 = fieldMap.get(key1);
                const field2 = fieldMap.get(key2);
                if (!field1 || !field2) {
                    console.warn(`Layout schema mismatch for keys: ${key1}, ${key2}`);
                    return null;
                }
                return (<Row gutter={16} key={`${key1}-${key2}`}><Col span={12}>{renderSingleField(field1)}</Col><Col span={12}>{renderSingleField(field2)}</Col></Row>);
            }
            const field = fieldMap.get(keyOrPair as string);
            if (!field) {
                console.warn(`Layout schema mismatch for key: ${keyOrPair}`);
                return null;
            }
            return renderSingleField(field);
        });
    }

    return fields.map(field => renderSingleField(field));
};


interface ListManagerProps {
    fieldKey: string;
    label: string;
    value?: ListItem[];
    onChange?: (value: ListItem[]) => void;
    itemSchema: { properties: Field[] };
    t: (key: string, defaultVal?: string) => string;
}

const ListManager: React.FC<ListManagerProps> = ({ fieldKey, label, value = [], onChange, itemSchema, t }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isBatchAddModalVisible, setIsBatchAddModalVisible] = useState(false);
    const [isBatchEditModalVisible, setIsBatchEditModalVisible] = useState(false);
    
    const [editingItem, setEditingItem] = useState<ListItem | null>(null);
    const [selectedItems, setSelectedItems] = useState<ListItem[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(50); // Items per page

    const [form] = Form.useForm();
    const [batchAddForm] = Form.useForm();
    const [batchEditForm] = Form.useForm();

    const showBatchButtons = ['experience', 'languages'].includes(fieldKey);
    const sharedValueField = itemSchema.properties.find(p => p.key !== 'name');
    const nameFieldKey = itemSchema.properties.find(p => p.type === 'string' && p.key.includes('name'))?.key || 'name';


    const showModal = (item?: ListItem) => {
        setEditingItem(item || null);
        if (item) {
            form.setFieldsValue(item);
        } else {
            form.resetFields();
            const defaultValues: ListItem = {};
            itemSchema.properties.forEach(prop => {
                if (prop.ui_hint === 'select' && prop.options && prop.options.length > 0) {
                    defaultValues[prop.key] = prop.options[0].key;
                }
                if (prop.ui_hint === 'number_input' && prop.key === 'count') {
                    defaultValues[prop.key] = 100;
                }
            });
            form.setFieldsValue(defaultValues);
        }
        setIsModalVisible(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const newValue = [...value];
            if (editingItem) {
                const index = value.findIndex(item => item === editingItem);
                newValue[index] = { ...editingItem, ...values };
            } else {
                newValue.push(values);
            }
            onChange?.(newValue);
            setIsModalVisible(false);
            form.resetFields();
        } catch (error) {
            console.log('Validation Failed:', error);
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    const handleRemove = (itemToRemove: ListItem) => {
        onChange?.(value.filter(item => item !== itemToRemove));
    };

    const showBatchAddModal = () => {
        batchAddForm.resetFields();
        if (sharedValueField) {
            if (sharedValueField.ui_hint === 'select' && sharedValueField.options && sharedValueField.options.length > 0) {
                batchAddForm.setFieldsValue({ [sharedValueField.key]: sharedValueField.options[0].key });
            } else if (sharedValueField.ui_hint === 'number_input' && sharedValueField.key === 'count') {
                batchAddForm.setFieldsValue({ [sharedValueField.key]: 100 });
            }
        }
        setIsBatchAddModalVisible(true)
    };
    const showBatchEditModal = () => setIsBatchEditModalVisible(true);

    const handleBatchAddOk = async () => {
        try {
            const values = await batchAddForm.validateFields();
            const { names, ...rest } = values;
            const namesArray: string[] = names.split('\n').map((s: string) => s.trim()).filter(Boolean);
            
            const newItems = namesArray.map(name => ({
                [nameFieldKey]: name,
                ...rest
            }));
    
            onChange?.([...value, ...newItems]);
            setIsBatchAddModalVisible(false);
            batchAddForm.resetFields();
            message.success(t('batch_add_success', `Successfully added ${newItems.length} items.`));
        } catch (error) {
            console.log('Batch add validation failed', error);
        }
    };
    
    const handleBatchEditOk = async () => {
        try {
            const sharedValues = await batchEditForm.validateFields();
            const newValue = value.map(item => {
                if (selectedItems.some(selected => selected[nameFieldKey] === item[nameFieldKey])) {
                    return { ...item, ...sharedValues };
                }
                return item;
            });
            onChange?.(newValue);
            setIsBatchEditModalVisible(false);
            setSelectedItems([]);
            batchEditForm.resetFields();
            message.success(t('batch_edit_success', `Successfully updated ${selectedItems.length} items.`));
        } catch (error) {
            console.log('Batch edit failed', error);
        }
    }
    
    const onSelectItem = (item: ListItem, checked: boolean) => {
        setSelectedItems(prev => 
            checked ? [...prev, item] : prev.filter(i => i[nameFieldKey] !== item[nameFieldKey])
        );
    };

    const isItemSelected = (item: ListItem) => {
        return selectedItems.some(selected => selected[nameFieldKey] === item[nameFieldKey]);
    };

    const handleSelectAll = (e: CheckboxChangeEvent) => {
        if (e.target.checked) {
            setSelectedItems(value);
        } else {
            setSelectedItems([]);
        }
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = value.slice(indexOfFirstItem, indexOfLastItem);

    const isAllSelected = value.length > 0 && selectedItems.length === value.length;

    return (
        <div>
            <Divider orientation="left">{label}</Divider>
            <Space style={{ marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
                    {t('add', 'Add')}
                </Button>
                {showBatchButtons && (
                    <>
                        <Button onClick={showBatchAddModal}>{t('batch_add', 'Batch Add')}</Button>
                        <Button onClick={showBatchEditModal} disabled={selectedItems.length === 0}>{t('batch_edit', 'Batch Edit')}</Button>
                    </>
                )}
            </Space>

            {showBatchButtons && (
                <div style={{ marginBottom: 16, borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
                    <Checkbox
                        indeterminate={selectedItems.length > 0 && selectedItems.length < value.length}
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                    >
                        {t('select_all', 'Select All')}
                    </Checkbox>
                </div>
            )}

            <List
                bordered
                dataSource={currentItems}
                renderItem={(item) => {
                    const displayParts = itemSchema.properties.reduce((acc: string[], propSchema) => {
                        const val = item[propSchema.key];
                        if (val === undefined || val === null || val === '') return acc;

                        const translationKey = `${fieldKey}_${propSchema.key}`;
                        const itemLabel = String(t(translationKey, propSchema.en_label));

                        if (propSchema.ui_hint === 'checkbox') {
                            if (val === true) {
                                acc.push(itemLabel);
                            }
                        } else if (propSchema.ui_hint === 'select') {
                            const option = propSchema.options?.find(o => o.key === val);
                            const displayVal = option ? String(t(option.key, option.en_label)) : val;
                            acc.push(`${itemLabel}: ${displayVal}`);
                        } else {
                            acc.push(`${itemLabel}: ${String(val)}`);
                        }
                        return acc;
                    }, []);
                    const displayValue = displayParts.join(' | ');

                    const isDefaultExperience = fieldKey === 'experience' && item[nameFieldKey] === 'default';

                    const itemActions = [
                      <a key="edit" onClick={() => showModal(item)}>{t('edit', 'Edit')}</a>,
                    ];

                    if (!isDefaultExperience) {
                      itemActions.push(
                        <Popconfirm key="delete" title={t('sure_to_delete', 'Sure to delete?')} onConfirm={() => handleRemove(item)}>
                            <a key="delete">{t('delete', 'Delete')}</a>
                        </Popconfirm>
                      );
                    }

                    return (
                        <List.Item actions={itemActions}>
                            <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: 0 }}>
                                {showBatchButtons && <Checkbox style={{ marginRight: 8 }} onChange={(e) => onSelectItem(item, e.target.checked)} checked={isItemSelected(item)} />}
                                <Typography.Text ellipsis={{ tooltip: displayValue }} style={{ flex: 1 }}>
                                    {displayValue}
                                </Typography.Text>
                            </div>
                        </List.Item>
                    )
                }}
            />

            {value.length > itemsPerPage && (
                <Pagination
                    current={currentPage}
                    pageSize={itemsPerPage}
                    total={value.length}
                    onChange={setCurrentPage}
                    style={{ marginTop: 16, textAlign: 'right' }}
                />
            )}

            <Modal
                title={editingItem ? `${t('edit', 'Edit')} ${label}` : `${t('add', 'Add')} ${label}`}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
            >
                <Form form={form} layout="vertical" name="item_form">
                    {renderFormItems(itemSchema.properties, t, fieldKey, form)}
                </Form>
            </Modal>
            
            {showBatchButtons && sharedValueField && (
                <>
                    <Modal
                        title={`${t('batch_add', 'Batch Add')} ${label}`}
                        open={isBatchAddModalVisible}
                        onOk={handleBatchAddOk}
                        onCancel={() => setIsBatchAddModalVisible(false)}
                    >
                        <Form form={batchAddForm} layout="vertical" name="batch_add_form">
                            <Form.Item name="names" label={t('item_names', 'Item Names (one per line)')} rules={[{ required: true }]}>
                                <TextArea rows={10} placeholder={t('batch_add_placeholder', 'e.g.\nJava\nPython\nGo')} />
                            </Form.Item>
                            <Divider>{t('batch_add_shared_value_note', 'Set a shared value for all new items')}</Divider>
                            {renderFormItems([sharedValueField], t, fieldKey, batchAddForm)}
                        </Form>
                    </Modal>

                    <Modal
                        title={`${t('batch_edit', 'Batch Edit')} ${label}`}
                        open={isBatchEditModalVisible}
                        onOk={handleBatchEditOk}
                        onCancel={() => setIsBatchEditModalVisible(false)}
                    >
                        <Form form={batchEditForm} layout="vertical">
                            <p>{t('batch_edit_note', String({ count: selectedItems.length }))}</p>
                             <Divider />
                            {renderFormItems([sharedValueField], t, fieldKey, batchEditForm)}
                        </Form>
                    </Modal>
                </>
            )}
        </div>
    );
};

export default ListManager; 