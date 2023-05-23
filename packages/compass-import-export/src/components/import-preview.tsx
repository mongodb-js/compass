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
  IconButton,
  Select,
  Option,
  useDarkMode,
} from '@mongodb-js/compass-components';

import { createDebug } from '../utils/logger';
import type { CSVParsableFieldType, CSVField } from '../csv/csv-types';
import { CSVFieldTypeLabels } from '../csv/csv-types';
import { findBrokenCSVTypeExample } from '../csv/csv-utils';

const debug = createDebug('import-preview');

// the max length of a value in the preview
const MAX_VALUE_LENGTH = 80;

// the max length in a cell in the preview table
const MAX_PREVIEW_LENGTH = 1000;

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

const infoIconCommonStyles = css({
  // Hack: Align the icon relative to the SelectBox.
  marginBottom: `-${spacing[1]}px`,
  marginTop: `-${spacing[1]}px`,
});

const infoIconLightStyles = css({
  color: palette.gray.dark2,
});

const infoIconDarkStyles = css({
  color: palette.gray.light2,
});

const warningIconCommonStyles = css(infoIconCommonStyles, {
  marginLeft: spacing[1],
  marginRight: spacing[1],
  paddingTop: spacing[1],
});

const warningIconLightStyles = css({
  color: palette.red.base,
});

const warningIconDarkStyles = css({
  color: palette.red.light1,
});

const typesListStyles = css({
  margin: `${spacing[3]}px 0`,
});

const selectStyles = css({
  minWidth: spacing[3] * 9,
});

const arrayTextStyles = css({
  fontWeight: 'normal',
  whiteSpace: 'nowrap',
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
    field.result && findBrokenCSVTypeExample(field.result.types, field.type)
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
  isArray?: boolean;
  path: string;
  type: CSVParsableFieldType;
  checked: boolean;
  result?: CSVField;
};

function InfoIcon() {
  const darkMode = useDarkMode();
  return (
    <IconButton
      // NOTE: Leafygreen doesn't support aria-label and only understand "aria-labelledby" and "label" instead
      aria-labelledby=""
      aria-label="Types documentation"
      as="a"
      className={cx(
        infoIconCommonStyles,
        darkMode ? infoIconDarkStyles : infoIconLightStyles
      )}
      href="https://www.mongodb.com/docs/manual/reference/bson-types/"
      target="_blank"
    >
      <Icon glyph="InfoWithCircle"></Icon>
    </IconButton>
  );
}

function WarningIcon() {
  const darkMode = useDarkMode();

  return (
    <div
      className={cx(
        warningIconCommonStyles,
        darkMode ? warningIconDarkStyles : warningIconLightStyles
      )}
    >
      <Icon glyph="Warning"></Icon>
    </div>
  );
}

function MixedWarning({
  result,
  selectedType,
  children: triggerChildren,
}: {
  result: CSVField;
  selectedType: CSVParsableFieldType;
  children: React.ReactElement;
}) {
  return (
    <Tooltip
      align="top"
      justify="middle"
      delay={500}
      style={{ display: 'block' }}
      trigger={({ children: tooltipChildren, ...props }) => (
        <div {...props}>
          {tooltipChildren}
          {triggerChildren}
        </div>
      )}
    >
      <>
        <Body>
          This field has{' '}
          {selectedType === 'number'
            ? 'mixed numeric types'
            : 'mixed data types'}
          :
        </Body>
        <ul className={typesListStyles}>
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
  children: triggerChildren,
}: {
  result: CSVField;
  selectedType: CSVParsableFieldType;
  children: React.ReactElement;
}) {
  const example = findBrokenCSVTypeExample(result.types, selectedType);

  if (!example) {
    return null;
  }

  const value =
    example.firstValue.length < MAX_VALUE_LENGTH
      ? example.firstValue
      : `${example.firstValue.slice(0, MAX_VALUE_LENGTH)}…`;

  return (
    <Tooltip
      align="top"
      justify="middle"
      delay={500}
      style={{ display: 'block' }}
      trigger={({ children: tooltipChildren, ...props }) => (
        <div {...props}>
          {tooltipChildren}
          {triggerChildren}
        </div>
      )}
    >
      <>
        <Body>This field has these detected types:</Body>
        <ul className={typesListStyles}>
          {Object.entries(result.types).map(([type, info]) => {
            return (
              <li key={type}>
                {fieldTypeName(type as CSVParsableFieldType | 'undefined')} *{' '}
                {info.count}
              </li>
            );
          })}
        </ul>
        <Body>
          Row {example.firstRowIndex + 1} contains the value{' '}
          <i>&quot;{value}&quot;</i>. This will cause an error for type{' '}
          {CSVFieldTypeLabels[selectedType]}.
        </Body>
      </>
    </Tooltip>
  );
}

function capStringLength(value: any): string {
  if (typeof value !== 'string') {
    return '';
  }

  if (value.length > MAX_PREVIEW_LENGTH) {
    return value.substring(0, MAX_PREVIEW_LENGTH) + '…';
  }

  return value;
}

function FieldTypeHeading({
  field,
  onFieldCheckedChanged,
  setFieldType,
}: {
  field: Field;
  onFieldCheckedChanged: (fieldPath: string, checked: boolean) => void;
  setFieldType: (fieldPath: string, fieldType: string) => void;
}) {
  const children = (
    <div>
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
            onFieldCheckedChanged(field.path, !!e.target.checked)
          }
        />
        <Label
          id={`toggle-import-field-label-${field.path}`}
          className={cx('import-field-label', fieldPathHeaderStyles)}
          htmlFor={`toggle-import-field-checkbox-${field.path}`}
        >
          <span title={field.path}>{field.path}</span>
        </Label>
      </div>
      <div className={fieldTypeContainerStyles}>
        {field.isArray && <span className={arrayTextStyles}>Array of</span>}
        <SelectFieldType
          fieldPath={field.path}
          selectedType={field.type}
          onChange={(newType: string) => setFieldType(field.path, newType)}
        />
        {field.result && needsMixedWarning(field) && <InfoIcon />}
        {field.result && needsTypeWarning(field) && <WarningIcon />}
      </div>
    </div>
  );

  if (field.result) {
    if (needsMixedWarning(field)) {
      return (
        <MixedWarning result={field.result} selectedType={field.type}>
          {children}
        </MixedWarning>
      );
    } else if (needsTypeWarning(field)) {
      return (
        <TypeWarning result={field.result} selectedType={field.type}>
          {children}
        </TypeWarning>
      );
    }
  }
  return children;
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
                // TODO(COMPASS-6766): move this div into FieldTypeHeading once we get rid of placeholders
                <div
                  className={columnHeaderStyles}
                  data-testid={`preview-field-header-${field.path}`}
                >
                  <FieldTypeHeading
                    field={field}
                    onFieldCheckedChanged={onFieldCheckedChanged}
                    setFieldType={setFieldType}
                  />
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
                title={`${
                  capStringLength(values[fieldIndex]) || 'empty string'
                }`}
              >
                {values[fieldIndex] === '' ? (
                  <i>empty string</i>
                ) : (
                  capStringLength(values[fieldIndex])
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
