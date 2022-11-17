import React from 'react';
import {
  Body,
  Cell,
  Checkbox,
  Row,
  Table,
  TableHeader,
  css,
  cx,
  spacing,
  Label,
} from '@mongodb-js/compass-components';
import type { Document } from 'mongodb';

import { SelectFieldType } from './select-field-type';
import { createDebug } from '../utils/logger';

const debug = createDebug('import-preview');

const columnHeaderStyles = css({
  display: 'flex',
  gap: spacing[1],
  minWidth: spacing[6] * 2,
  paddingRight: spacing[2],
  alignItems: 'center',
});

const fieldPathHeaderStyles = css({
  maxWidth: spacing[7] * 3,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
});

const cellContainerStyles = css({
  padding: `${spacing[1]}px ${spacing[2]}px`,
});

const cellStyles = css({
  maxWidth: spacing[7] * 3,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
});

const cellUncheckedStyles = css({
  opacity: 0.4,
});

function ImportPreview({
  fields,
  values,
  onFieldCheckedChanged,
  setFieldType,
  loaded,
}: {
  fields: {
    path: string;
    type: string;
    checked: boolean;
  }[];
  values: Document[];
  onFieldCheckedChanged: (fieldPath: string, checked: boolean) => void;
  setFieldType: (fieldPath: string, fieldType: string) => void;
  loaded: boolean;
}) {
  if (!loaded) {
    debug('Preview unavailable: not loaded yet');
    return null;
  }

  if (!Array.isArray(fields) || !Array.isArray(values)) {
    debug('Preview unavailable: Fields or values is not an array', {
      fields,
      values,
    });
    return null;
  }

  return (
    <>
      <Body weight="medium">Specify Fields and Types</Body>
      <Table
        data={values}
        columns={fields.map((field) => (
          <TableHeader
            key={`col-${field.path}`}
            label={
              <div
                className={columnHeaderStyles}
                data-testid={`preview-field-header-${field.path}`}
              >
                <Checkbox
                  aria-labelledby={`toggle-import-field-${field.path}`}
                  id={`toggle-import-field-checkbox-${field.path}`}
                  data-testid={`toggle-import-field-checkbox-${field.path}`}
                  aria-label={
                    field.checked
                      ? `${field.path} values will be imported`
                      : `Values for ${field.path} will be ignored`
                  }
                  checked={field.checked}
                  title={
                    field.checked
                      ? `${field.path} values will be imported`
                      : `Values for ${field.path} will be ignored`
                  }
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onFieldCheckedChanged(field.path, !!e.target.checked)
                  }
                />
                <div>
                  <Label
                    id={`toggle-import-field-label-${field.path}`}
                    className={fieldPathHeaderStyles}
                    htmlFor={`toggle-import-field-checkbox-${field.path}`}
                  >
                    <span title={field.path}>{field.path}</span>
                  </Label>
                  <SelectFieldType
                    fieldPath={field.path}
                    selectedType={field.type}
                    onChange={(newType: string) =>
                      setFieldType(field.path, newType)
                    }
                  />
                </div>
              </div>
            }
          />
        ))}
      >
        {({ datum: values }) => (
          <Row>
            {fields.map(({ path }, fieldIndex) => (
              <Cell
                className={cellContainerStyles}
                key={`item-${path}-${fieldIndex}`}
              >
                <div
                  className={cx(
                    cellStyles,
                    !fields[fieldIndex].checked && cellUncheckedStyles
                  )}
                  title={`${
                    (values[fieldIndex] as unknown as string) || 'empty string'
                  }`}
                >
                  {(values[fieldIndex] as unknown as string) === '' ? (
                    <i>empty string</i>
                  ) : (
                    values[fieldIndex]
                  )}
                </div>
              </Cell>
            ))}
          </Row>
        )}
      </Table>
    </>
  );
}

export { ImportPreview };
