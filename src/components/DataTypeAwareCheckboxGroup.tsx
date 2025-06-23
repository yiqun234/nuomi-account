import React from 'react';
import { Checkbox, Row, Col } from 'antd';
import type { TFunction } from 'i18next';
import type { Field } from '../types';

interface DataTypeAwareCheckboxGroupProps {
  field: Field;
  t: TFunction;
  value?: { [key: string]: boolean } | string[];
  onChange?: (value: { [key: string]: boolean } | string[]) => void;
}

const DataTypeAwareCheckboxGroup: React.FC<DataTypeAwareCheckboxGroupProps> = ({ field, t, value, onChange }) => {
  // The schema `type` property is the single source of truth for the data type.
  const isArrayType = field.type === 'array';

  // Convert the incoming value (object or array) into a string array for the Checkbox.Group.
  const internalValue = isArrayType
    ? (value as string[] || [])
    : value ? Object.keys(value).filter(key => (value as { [key: string]: boolean })[key]) : [];

  const handleChange = (checkedKeys: string[]) => {
    if (onChange) {
      if (isArrayType) {
        // If the schema expects an array, pass the new array of checked keys directly.
        onChange(checkedKeys);
      } else {
        // If the schema expects an object, convert the array of keys back into an object.
        const newValue: { [key: string]: boolean } = {};
        field.options!.forEach(option => {
          newValue[option.key] = checkedKeys.includes(option.key);
        });
        onChange(newValue);
      }
    }
  };

  return (
    <Checkbox.Group style={{ width: '100%' }} value={internalValue} onChange={handleChange}>
      <Row>
        {field.options!.map(option => (
          <Col span={8} key={option.key}>
            <Checkbox value={option.key}>
              {t(`${field.key}_${option.key}`, option.en_label)}
            </Checkbox>
          </Col>
        ))}
      </Row>
    </Checkbox.Group>
  );
};

export default DataTypeAwareCheckboxGroup; 