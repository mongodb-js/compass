import React from 'react';
import { Select, Option } from '@mongodb-js/compass-components';
import {
  getOperatorsForType,
  type VisualBuilderOperator,
} from '../../../constants/visual-builder-operators';

type Props = {
  bsonType: string;
  value: VisualBuilderOperator;
  onChange: (op: VisualBuilderOperator) => void;
};

export function OperatorDropdown({ bsonType, value, onChange }: Props) {
  const { operators } = getOperatorsForType(bsonType);
  return (
    <Select
      aria-label="Operator"
      allowDeselect={false}
      size="small"
      // Default 'trigger' makes the popover inherit the trigger's intrinsic
      // width — which clips longer operator labels when the current value is
      // short ($eq). 'option' sizes the popover to the widest option.
      dropdownWidthBasis="option"
      value={value}
      onChange={(v: string) => onChange(v as VisualBuilderOperator)}
      data-testid="visual-query-builder-operator"
    >
      {operators.map((op) => (
        <Option key={op} value={op}>
          {op}
        </Option>
      ))}
    </Select>
  );
}
