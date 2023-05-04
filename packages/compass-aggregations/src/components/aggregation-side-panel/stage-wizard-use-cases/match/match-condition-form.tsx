import React, { useMemo } from 'react';
import {
  css,
  spacing,
  ComboboxWithCustomOption,
  Select,
  TextInput,
  Option,
  FormFieldContainer,
} from '@mongodb-js/compass-components';
import TypeChecker from 'hadron-type-checker';
import type { TypeCastTypes } from 'hadron-type-checker';
import type { MatchCondition, MatchOperator } from './match';
import type { WizardComponentProps } from '..';

// Types
export type MatchConditionFormProps = {
  fields: WizardComponentProps['fields'];
  condition: MatchCondition;
  onConditionChange: (newCondition: MatchCondition) => void;
};

export type CreateConditionFn = (
  condition?: Partial<MatchCondition>
) => MatchCondition;

// Helpers
export const LABELS = {
  fieldCombobox: 'Select a field',
  operatorSelect: 'Select an operator',
  valueInput: 'Expected value',
  typeSelect: 'Select type',
  addBtn: 'Add condition',
  removeBtn: 'Remove condition',
};

export const TEST_IDS = {
  condition: (id: number) => `match-condition-${id}`,
};

/**
 * Returns a function to create a condition with incremental ids. Consider using
 * already created `createCondition` below instead of making another one
 * yourself. This function is exported primarily to aid in testing.
 */
export const makeCreateCondition = (): CreateConditionFn => {
  let id = 1;
  return (
    condition: Omit<Partial<MatchCondition>, 'id'> = {}
  ): MatchCondition => ({
    id: id++,
    field: '',
    operator: '$eq',
    value: '',
    bsonType: 'String',
    ...condition,
  });
};

export const createCondition = makeCreateCondition();

// The current list of comparison operators that we provide in the form can not
// realistically work with the following types hence we exclude them to avoid
// any possible confusion.
const EXCLUDED_TYPES: TypeCastTypes[] = [
  'Array',
  'Binary',
  'Code',
  'MaxKey',
  'MinKey',
  'Object',
  'BSONSymbol',
  'BSONRegExp',
  'Timestamp',
];

const CASTABLE_TYPES = TypeChecker.castableTypes(false).filter(
  (type) => !EXCLUDED_TYPES.includes(type)
);

const MATCH_OPERATOR_LABELS: { operator: MatchOperator; label: string }[] = [
  {
    operator: '$eq',
    label: '=',
  },
  {
    operator: '$ne',
    label: '!=',
  },
  {
    operator: '$gt',
    label: '>',
  },
  {
    operator: '$gte',
    label: '>=',
  },
  {
    operator: '$lt',
    label: '<',
  },
  {
    operator: '$lte',
    label: '<=',
  },
];

// Components - Condition
const conditionContainerStyles = css({
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  gap: spacing[2],
});
const fieldComboboxStyles = css({ margin: 0, flex: '1 1 50%' });
const operatorSelectStyles = css({ margin: 0, flex: '1 0 70px' });
const valueInputStyles = css({ margin: 0, flex: '1 0 20%' });
const bsonTypeSelectStyles = css({ margin: 0, flex: `1 0 130px` });

const MatchConditionForm = ({
  fields,
  condition,
  onConditionChange,
}: MatchConditionFormProps) => {
  const fieldNames = useMemo(() => fields.map((field) => field.name), [fields]);

  const handleFieldChange = (field: string | null) => {
    if (field !== null) {
      const bsonType =
        fields.find(({ name }) => name === field)?.type ||
        TypeChecker.type(condition.value);
      onConditionChange({ ...condition, field, bsonType });
    }
  };

  const handleOperatorChange = (operator: string | null) => {
    if (operator !== null) {
      onConditionChange({ ...condition, operator: operator as MatchOperator });
    }
  };

  const handleValueChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    const value = event.target.value;
    onConditionChange({ ...condition, value });
  };

  const handleBsonTypeChange = (bsonType: string | null) => {
    if (bsonType !== null) {
      onConditionChange({ ...condition, bsonType: bsonType as TypeCastTypes });
    }
  };

  return (
    <div
      data-testid={TEST_IDS.condition(condition.id)}
      className={conditionContainerStyles}
    >
      <FormFieldContainer className={fieldComboboxStyles}>
        <ComboboxWithCustomOption
          placeholder={LABELS.fieldCombobox}
          aria-label={LABELS.fieldCombobox}
          size="default"
          clearable={false}
          value={condition.field}
          onChange={handleFieldChange}
          options={fieldNames}
          optionLabel="Field:"
        />
      </FormFieldContainer>
      <FormFieldContainer className={operatorSelectStyles}>
        {/* @ts-expect-error leafygreen unresonably expects a labelledby here */}
        <Select
          size="default"
          allowDeselect={false}
          aria-label={LABELS.operatorSelect}
          usePortal={true}
          value={condition.operator}
          onChange={handleOperatorChange}
        >
          {MATCH_OPERATOR_LABELS.map(({ operator, label }) => {
            return (
              <Option key={operator} value={operator}>
                {label}
              </Option>
            );
          })}
        </Select>
      </FormFieldContainer>
      <FormFieldContainer className={valueInputStyles}>
        <TextInput
          placeholder={LABELS.valueInput}
          aria-label={LABELS.valueInput}
          value={condition.value}
          onChange={handleValueChange}
        />
      </FormFieldContainer>
      <FormFieldContainer className={bsonTypeSelectStyles}>
        {/* @ts-expect-error leafygreen unresonably expects a labelledby here */}
        <Select
          allowDeselect={false}
          aria-label={LABELS.typeSelect}
          usePortal={true}
          value={condition.bsonType}
          onChange={handleBsonTypeChange}
        >
          {CASTABLE_TYPES.map((type) => (
            <Option key={type} value={`${type}`}>
              {type}
            </Option>
          ))}
        </Select>
      </FormFieldContainer>
    </div>
  );
};

export default MatchConditionForm;
