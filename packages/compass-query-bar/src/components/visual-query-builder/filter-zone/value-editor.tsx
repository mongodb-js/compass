import React from 'react';
import {
  Select,
  Option,
  TextInput,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import {
  VALUELESS_OPERATORS,
  type VisualBuilderOperator,
} from '../../../constants/visual-builder-operators';

const inputStyles = css({
  minWidth: '120px',
  flexGrow: 1,
});

const existsHintStyles = css({
  display: 'inline-flex',
  alignItems: 'center',
  height: spacing[600],
});

type Props = {
  bsonType: string;
  operator: VisualBuilderOperator;
  valueString: string;
  onChange: (valueString: string) => void;
};

function inputTypeForBson(bsonType: string): 'number' | 'text' {
  switch (bsonType) {
    case 'Number':
    case 'Double':
    case 'Int32':
    case 'Long':
    case 'Decimal128':
      return 'number';
    default:
      return 'text';
  }
}

function placeholderForBson(bsonType: string): string | undefined {
  if (bsonType === 'Date') return 'YYYY-MM-DD or ISO string';
  return undefined;
}

export function ValueEditor({
  bsonType,
  operator,
  valueString,
  onChange,
}: Props) {
  if (VALUELESS_OPERATORS.includes(operator)) {
    return (
      <span
        className={existsHintStyles}
        data-testid="visual-query-builder-value-exists"
      >
        exists in document
      </span>
    );
  }

  if (operator === '$regex') {
    return (
      <TextInput
        aria-label="Regex value (pattern/flags)"
        sizeVariant="small"
        className={inputStyles}
        placeholder="pattern/i"
        value={valueString}
        onChange={(evt) => onChange(evt.target.value)}
        data-testid="visual-query-builder-value-regex"
      />
    );
  }

  if (operator === '$in' || operator === '$nin') {
    return (
      <TextInput
        aria-label="Comma-separated values"
        sizeVariant="small"
        className={inputStyles}
        placeholder="a, b, c"
        value={valueString}
        onChange={(evt) => onChange(evt.target.value)}
        data-testid="visual-query-builder-value-list"
      />
    );
  }

  if (bsonType === 'Boolean') {
    return (
      <Select
        aria-label="Boolean value"
        allowDeselect={false}
        size="small"
        value={valueString || 'true'}
        onChange={(v: string) => onChange(v)}
        data-testid="visual-query-builder-value-boolean"
      >
        <Option value="true">true</Option>
        <Option value="false">false</Option>
      </Select>
    );
  }

  const inputType = inputTypeForBson(bsonType);
  return (
    <TextInput
      aria-label="Filter value"
      sizeVariant="small"
      className={inputStyles}
      type={inputType}
      placeholder={placeholderForBson(bsonType)}
      value={valueString}
      onChange={(evt) => onChange(evt.target.value)}
      data-testid="visual-query-builder-value"
    />
  );
}
