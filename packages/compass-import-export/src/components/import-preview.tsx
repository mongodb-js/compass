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
  Placeholder,
  palette,
} from '@mongodb-js/compass-components';

import { SelectFieldType } from './select-field-type';
import { createDebug } from '../utils/logger';
import type { CSVParsableFieldType } from '../utils/csv';

const debug = createDebug('import-preview');

const columnHeaderStyles = css({
  display: 'flex',
  gap: spacing[1],
  minWidth: spacing[6] * 2,
  paddingRight: spacing[2],
  flexDirection: 'column',
  alignItems: 'flex-start',
});

const columnNameStyles = css({
  display: 'flex',
  flexDirection: 'row',
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

const rowIndexStyles = css({
  minWidth: 0,
  color: palette.gray.base,
});

type Field = {
  path: string;
  type: CSVParsableFieldType | 'placeholder';
  checked: boolean;
  summary?: string;
};

function FieldHeader(
  field: Field,
  analyzed: boolean,
  onFieldCheckedChanged: (fieldPath: string, checked: boolean) => void,
  setFieldType: (fieldPath: string, fieldType: string) => void
) {
  return (
    <TableHeader
      key={`col-${field.path}`}
      label={
        <div
          className={columnHeaderStyles}
          data-testid={`preview-field-header-${field.path}`}
        >
          {field.type === 'placeholder' ? (
            ''
          ) : (
            <>
              <div className={columnNameStyles}>
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
                <Label
                  id={`toggle-import-field-label-${field.path}`}
                  className={fieldPathHeaderStyles}
                  htmlFor={`toggle-import-field-checkbox-${field.path}`}
                >
                  <span title={field.path}>{field.path}</span>
                </Label>
              </div>
              <div>
                {analyzed ? (
                  <SelectFieldType
                    fieldPath={field.path}
                    selectedType={field.type}
                    summary={field.summary}
                    onChange={(newType: string) =>
                      setFieldType(field.path, newType)
                    }
                  />
                ) : (
                  <Placeholder
                    width={spacing[3] * 9}
                    data-testid={`import-preview-placeholder-${field.path}`}
                  />
                )}
              </div>
            </>
          )}
        </div>
      }
    />
  );
}

function ImportPreview({
  fields,
  values,
  onFieldCheckedChanged,
  setFieldType,
  loaded,
  analyzed,
}: {
  fields: Field[];
  values: string[][];
  onFieldCheckedChanged: (fieldPath: string, checked: boolean) => void;
  setFieldType: (fieldPath: string, fieldType: string) => void;
  loaded: boolean;
  analyzed: boolean;
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

  const gapOrFields: (string | Field)[] = ['', ...fields];

  return (
    <>
      <Body weight="medium">Specify Fields and Types</Body>
      <Table
        data={values}
        columns={gapOrFields.map((field) => {
          if (typeof field !== 'string' && 'path' in field) {
            return FieldHeader(
              field,
              analyzed,
              onFieldCheckedChanged,
              setFieldType
            );
          } else {
            return (
              <TableHeader
                key="row-index"
                label=""
                className={rowIndexStyles}
              />
            );
          }
        })}
      >
        {({ datum: values, index: rowIndex }) => (
          <Row>
            <Cell
              className={cx(cellContainerStyles, rowIndexStyles)}
              key={`rowindex-${rowIndex}`}
            >
              {rowIndex + 1}
            </Cell>
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
                  title={`${values[fieldIndex] || 'empty string'}`}
                >
                  {values[fieldIndex] === '' ? (
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
