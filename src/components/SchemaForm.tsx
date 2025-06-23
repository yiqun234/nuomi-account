import { Typography, Row, Col } from 'antd';
import FormField from './FormField';
import type { Group } from '../types';
import type { FormInstance } from 'antd';
import type { TFunction } from 'i18next';
import React from 'react';

interface SchemaFormProps {
  group: Group;
  form: FormInstance;
  t: TFunction;
  namePrefix?: (string | number)[];
}

const SchemaForm: React.FC<SchemaFormProps> = ({ group, form, t, namePrefix = [] }) => {
  return (
    <>
      <Typography.Title level={4}>{t(group.key, group.group_name_en)}</Typography.Title>
      <Row gutter={24} align="middle">
        {group.fields.map(field => {
          const keyPath = field.key.includes('.') ? field.key.split('.') : [field.key];
          const currentNamePath = [...namePrefix, ...keyPath];
          return (
            <Col
              key={field.key}
              span={
                [
                  'textarea',
                  'card_list',
                  'checkbox_group',
                  'group',
                  'checkbox',
                  'radio_group_inline',
                  'checkbox_button',
                  'checkbox_prompt',
                ].includes(field.ui_hint)
                  ? 24
                  : 12
              }
            >
              <FormField field={field} t={t} form={form} namePath={currentNamePath} />
            </Col>
          );
        })}
      </Row>
    </>
  );
};

export default SchemaForm;
 