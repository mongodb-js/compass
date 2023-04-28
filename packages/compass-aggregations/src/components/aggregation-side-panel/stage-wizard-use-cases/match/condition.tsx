import React from 'react';
import {
  css,
  spacing,
  ComboboxWithCustomOption,
  Select,
  TextInput,
  IconButton,
  Icon,
  Option,
} from '@mongodb-js/compass-components';
import TypeChecker from 'hadron-type-checker';
import type { TypeCastTypes } from 'hadron-type-checker';
import type { MatchCondition, MatchOperator } from './match';
import type { WizardComponentProps } from '..';

// Types
export type ConditionProps = {
  fields: WizardComponentProps['fields'];
  disableRemoveBtn: boolean;
  condition: MatchCondition;
  onConditionChange: (newCondition: MatchCondition) => void;
  onAddConditionClick: () => void;
  onRemoveConditionClick: () => void;
};

export type CreateConditionFn = (
  condition?: Partial<MatchCondition>
) => MatchCondition;

// Helpers
export const CONDITION_CONTROLS_WIDTH = 60;

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
  fieldCombobox: (id: number) => `match-condition-${id}-field-combobox`,
  operatorSelect: (id: number) => `match-condition-${id}-operator-select`,
  valueInput: (id: number) => `match-condition-${id}-value-input`,
  typeSelect: (id: number) => `match-condition-${id}-type-select`,
  addBtn: (id: number) => `match-condition-${id}-add`,
  removeBtn: (id: number) => `match-condition-${id}-remove`,
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
    field: condition.field ?? '',
    operator: condition.operator ?? '$eq',
    value: condition.value ?? '',
    bsonType: condition.bsonType ?? '',
  });
};

export const createCondition = makeCreateCondition();

// The current list of operators that we provide in the
// form can not realistically work with the following types
// hence we exclude them to avoid any possible confusion.
const EXCLUDED_TYPES: TypeCastTypes[] = [
  'Array',
  'Binary',
  'Code',
  'MaxKey',
  'MinKey',
  'Object',
  'BSONSymbol',
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
});

const fieldGroupStyles = css({
  width: `calc(100% - ${CONDITION_CONTROLS_WIDTH}px)`,
  display: 'flex',
  gap: spacing[2],
});

const fieldComboboxStyles = css({ flex: '1 1 50%' });
const operatorSelectStyles = css({ flex: '1 0 90px' });
const valueInputStyles = css({ flex: '1 0 20%' });
const bsonTypeSelectStyles = css({ flex: '1 0 15%' });

const conditionControlsStyles = css({
  width: `${CONDITION_CONTROLS_WIDTH}px`,
  justifyContent: 'flex-end',
  display: 'flex',
});

const Condition = ({
  fields,
  disableRemoveBtn,
  condition,
  onConditionChange,
  onAddConditionClick,
  onRemoveConditionClick,
}: ConditionProps) => {
  const fieldNames = fields.map((field) => field.name);
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
      onConditionChange({ ...condition, bsonType });
    }
  };

  const { id } = condition;

  return (
    <div
      data-testid={TEST_IDS.condition(id)}
      className={conditionContainerStyles}
    >
      <div className={fieldGroupStyles}>
        <div
          data-testid={TEST_IDS.fieldCombobox(id)}
          className={fieldComboboxStyles}
        >
          <ComboboxWithCustomOption
            placeholder={LABELS.fieldCombobox}
            aria-label={LABELS.fieldCombobox}
            size="default"
            clearable={false}
            value={condition.field}
            onChange={handleFieldChange}
            options={fieldNames}
            optionLabel="Field:"
            // Used for testing to access the popover for a stage
            popoverClassName={TEST_IDS.fieldCombobox(id)}
          />
        </div>
        <div
          data-testid={TEST_IDS.operatorSelect(id)}
          className={operatorSelectStyles}
        >
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
        </div>
        <div data-testid={TEST_IDS.valueInput(id)} className={valueInputStyles}>
          <TextInput
            placeholder={LABELS.valueInput}
            aria-label={LABELS.valueInput}
            value={condition.value}
            onChange={handleValueChange}
          />
        </div>
        <div
          data-testid={TEST_IDS.typeSelect(id)}
          className={bsonTypeSelectStyles}
        >
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
        </div>
      </div>
      <div className={conditionControlsStyles}>
        <IconButton
          data-testid={TEST_IDS.addBtn(id)}
          aria-label={LABELS.addBtn}
          onClick={onAddConditionClick}
        >
          <Icon glyph="Plus" />
        </IconButton>
        <IconButton
          data-testid={TEST_IDS.removeBtn(id)}
          disabled={disableRemoveBtn}
          aria-label={LABELS.removeBtn}
          onClick={onRemoveConditionClick}
        >
          <Icon glyph="Minus" />
        </IconButton>
      </div>
    </div>
  );
};

export default Condition;
