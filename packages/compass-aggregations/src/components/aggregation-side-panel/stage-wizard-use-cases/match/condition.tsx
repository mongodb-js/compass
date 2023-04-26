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
import type { MatchCondition, MatchOperator } from './match';
import TypeChecker from 'hadron-type-checker';
import type { TypeCastTypes } from 'hadron-type-checker';
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

// Helpers
export const createCondition = (() => {
  let id = 1;
  return (
    condition: Omit<Partial<MatchCondition>, 'id'> = {}
  ): MatchCondition => ({
    id: id++,
    field: '',
    operator: '$eq',
    value: '',
    bsonType: '',
    ...condition,
  });
})();

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
export const CONDITION_CONTROLS_WIDTH = 60;

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
const bsonTypeSelectStyles = css({ flex: '1 0 20%' });

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
    onConditionChange({ ...condition, value: event.target.value });
  };

  const handleBsonTypeChange = (bsonType: string | null) => {
    if (bsonType !== null) {
      onConditionChange({ ...condition, bsonType });
    }
  };

  return (
    <div
      data-testid={`match-condition-${condition.id}`}
      className={conditionContainerStyles}
    >
      <div className={fieldGroupStyles}>
        <div className={fieldComboboxStyles}>
          <ComboboxWithCustomOption
            placeholder="Select a field"
            aria-label="Select a field"
            size="default"
            clearable={false}
            value={condition.field}
            onChange={handleFieldChange}
            options={fieldNames}
            optionLabel="Field:"
            // Used for testing to access the popover for a stage
            popoverClassName={`match-condition-${condition.id}-combobox`}
          />
        </div>
        <div className={operatorSelectStyles}>
          {/* @ts-expect-error leafygreen unresonably expects a labelledby here */}
          <Select
            // className={operatorFieldStyles}
            size="default"
            allowDeselect={false}
            aria-label="Select direction"
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
        <div className={valueInputStyles}>
          <TextInput
            placeholder="Expected value"
            aria-label="Expected value"
            value={condition.value}
            onChange={handleValueChange}
          />
        </div>
        <div className={bsonTypeSelectStyles}>
          {/* @ts-expect-error leafygreen unresonably expects a labelledby here */}
          <Select
            allowDeselect={false}
            aria-label="Select type"
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
        <IconButton aria-label="Add condition" onClick={onAddConditionClick}>
          <Icon glyph="Plus" />
        </IconButton>
        <IconButton
          disabled={disableRemoveBtn}
          aria-label="Remove condition"
          onClick={onRemoveConditionClick}
        >
          <Icon glyph="Minus" />
        </IconButton>
      </div>
    </div>
  );
};

export default Condition;
