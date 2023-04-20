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
  palette,
  Tooltip,
  Icon,
  Select,
  Option,
  useDarkMode,
} from '@mongodb-js/compass-components';

import { createDebug } from '../utils/logger';
import type { CSVParsableFieldType, CSVField } from '../csv/csv-types';
import { CSVFieldTypeLabels } from '../csv/csv-types';
import { findBrokenCSVTypeExample } from '../csv/csv-utils';

const debug = createDebug('import-preview');

const MAX_STRING_LENGTH = 80;

const columnHeaderStyles = css({
  display: 'flex',
  gap: spacing[1],
  minWidth: spacing[6] * 2,
  flexDirection: 'column',
  alignItems: 'flex-start',
});

const warningCellStylesLight = css({
  backgroundColor: palette.yellow.light3,
});

const warningCellStylesDark = css({
  backgroundColor: palette.yellow.dark3,
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

const fieldTypeContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[1],
});

const infoIconCSSCommon = css({
  // align the icon relative to the selectbox
  height: `${spacing[3]}px`,
});

const infoIconCSSLight = css({
  color: palette.gray.dark2,
});

const infoIconCSSDark = css({
  color: palette.gray.light2,
});

const warningIconCSSCommon = infoIconCSSCommon;

const warningIconCSSLight = css({
  color: palette.red.base,
});

const warningIconCSSDark = css({
  color: palette.red.light1,
});

const typesListCSS = css({
  margin: `${spacing[3]}px 0`,
});

const selectStyles = css({
  minWidth: spacing[3] * 9,
});

function fieldTypeName(type: CSVParsableFieldType | 'undefined') {
  if (type === 'undefined') {
    return 'Blank';
  }
  return CSVFieldTypeLabels[type];
}

function needsMixedWarning(field: Field) {
  // Only show the warning for mixed and number types and once the user manually
  // changed the type, make the warning go away
  return (
    field.result &&
    ['mixed', 'number'].includes(field.result.detected) &&
    field.result.detected === field.type
  );
}

function needsTypeWarning(field: Field) {
  return !!(
    field.result &&
    findBrokenCSVTypeExample(
      field.result.types,
      field.type as CSVParsableFieldType
    )
  );
}

function needsWarning(field: Field) {
  return needsMixedWarning(field) || needsTypeWarning(field);
}

function SelectFieldType({
  fieldPath,
  selectedType,
  onChange,
}: {
  fieldPath: string;
  selectedType: CSVParsableFieldType;
  onChange: (type: string) => void;
}) {
  return (
    <Select
      // NOTE: Leafygreen gives an error with only aria-label for select.
      aria-labelledby={`toggle-import-field-label-${fieldPath}`}
      // leafygreen bases ids inside Select off this id which is why we have it in addition to data-testid
      id={`import-preview-field-type-select-menu-${fieldPath}`}
      data-testid={`import-preview-field-type-select-menu-${fieldPath}`}
      className={selectStyles}
      aria-label="Field type"
      value={selectedType}
      onChange={onChange}
      allowDeselect={false}
      size="xsmall"
    >
      {Object.entries(CSVFieldTypeLabels).map(([value, display]) => (
        <Option key={value} value={value}>
          {display}
        </Option>
      ))}
    </Select>
  );
}

type Field = {
  path: string;
  type: CSVParsableFieldType | 'placeholder';
  checked: boolean;
  result?: CSVField;
};

function InfoIcon() {
  const darkMode = useDarkMode();

  return (
    <div
      className={cx(
        infoIconCSSCommon,
        darkMode ? infoIconCSSDark : infoIconCSSLight
      )}
    >
      <Icon glyph="InfoWithCircle"></Icon>
    </div>
  );
}

function WarningIcon() {
  const darkMode = useDarkMode();

  return (
    <div
      className={cx(
        warningIconCSSCommon,
        darkMode ? warningIconCSSDark : warningIconCSSLight
      )}
    >
      <Icon glyph="Warning"></Icon>
    </div>
  );
}

function MixedWarning({
  result,
  selectedType,
}: {
  result: CSVField;
  selectedType: CSVParsableFieldType;
}) {
  return (
    <Tooltip
      align="top"
      justify="middle"
      delay={500}
      trigger={({ children, ...props }) => (
        <div {...props}>
          {children}
          <InfoIcon />
        </div>
      )}
    >
      <>
        <Body as="p">
          This field has{' '}
          {selectedType === 'number'
            ? 'mixed numeric types'
            : 'mixed data types'}
          :
        </Body>
        <ul className={typesListCSS}>
          {Object.entries(result.types).map(([type, info]) => {
            return (
              <li key={type}>
                {fieldTypeName(type as CSVParsableFieldType | 'undefined')} *{' '}
                {info.count}
              </li>
            );
          })}
        </ul>
        <Body>To standardize your data, select a different type.</Body>
      </>
    </Tooltip>
  );
}

function TypeWarning({
  result,
  selectedType,
}: {
  result: CSVField;
  selectedType: CSVParsableFieldType;
}) {
  const example = findBrokenCSVTypeExample(result.types, selectedType);

  if (!example) {
    return null;
  }

  const value =
    example.firstValue.length < MAX_STRING_LENGTH
      ? example.firstValue
      : `${example.firstValue.slice(0, MAX_STRING_LENGTH)}…`;

  return (
    <Tooltip
      align="top"
      justify="middle"
      delay={500}
      trigger={({ children, ...props }) => (
        <div {...props}>
          {children}
          <WarningIcon />
        </div>
      )}
    >
      <>
        <Body as="p">This field has these detected types:</Body>
        <ul className={typesListCSS}>
          {Object.entries(result.types).map(([type, info]) => {
            return (
              <li key={type}>
                {fieldTypeName(type as CSVParsableFieldType | 'undefined')} *{' '}
                {info.count}
              </li>
            );
          })}
        </ul>
        <Body as="p">
          Row {example.firstRowIndex + 1} contains the value{' '}
          <i>&quot;{value}&quot;</i>. This will cause an error for type{' '}
          {CSVFieldTypeLabels[selectedType]}.
        </Body>
      </>
    </Tooltip>
  );
}

function ImportPreview({
  fields,
  values,
  onFieldCheckedChanged,
  setFieldType,
  loaded,
}: {
  fields: Field[];
  values: string[][];
  onFieldCheckedChanged: (fieldPath: string, checked: boolean) => void;
  setFieldType: (fieldPath: string, fieldType: string) => void;
  loaded: boolean;
}) {
  const darkMode = useDarkMode();

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

  const warningCellStyles = darkMode
    ? warningCellStylesDark
    : warningCellStylesLight;

  return (
    <Table
      data={values}
      columns={gapOrFields.map((field) => {
        if (typeof field !== 'string' && 'path' in field) {
          return (
            <TableHeader
              key={`col-${field.path}`}
              className={cx(needsWarning(field) && warningCellStyles)}
              label={
                <div
                  className={columnHeaderStyles}
                  data-testid={`preview-field-header-${field.path}`}
                >
                  {field.type !== 'placeholder' && (
                    <>
                      <div className={columnNameStyles}>
                        <Checkbox
                          aria-labelledby={`toggle-import-field-label-${field.path}`}
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
                            onFieldCheckedChanged(
                              field.path,
                              !!e.target.checked
                            )
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
                      <div className={fieldTypeContainerStyles}>
                        <SelectFieldType
                          fieldPath={field.path}
                          selectedType={field.type}
                          onChange={(newType: string) =>
                            setFieldType(field.path, newType)
                          }
                        />
                        {field.result && needsMixedWarning(field) && (
                          <MixedWarning
                            result={field.result}
                            selectedType={field.type}
                          />
                        )}
                        {field.result && needsTypeWarning(field) && (
                          <TypeWarning
                            result={field.result}
                            selectedType={field.type}
                          />
                        )}
                      </div>
                    </>
                  )}
                </div>
              }
            />
          );
        } else {
          return (
            <TableHeader key="row-index" label="" className={rowIndexStyles} />
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
              className={cx(
                cellContainerStyles,
                needsWarning(fields[fieldIndex]) && warningCellStyles
              )}
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
  );
}

export { ImportPreview };
