import React, { useState } from 'react';

import { css, spacing } from '@mongodb-js/compass-components';
import type { WizardComponentProps } from '..';
import { FieldCombobox } from '../field-combobox';

// Types
type UnwindFormState = {
  unwindField: string;
};

// Helpers
export const COMBOBOX_PLACEHOLDER_TEXT = 'Select field names';

export const mapUnwindFormStateToStageValue = ({
  unwindField,
}: UnwindFormState) => {
  return unwindField;
};

// Components
const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
});

const formGroupStyles = css({
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  gap: spacing[2],
});

// Because our combobox renders with a horizontal scroll
// for selected items, we render it with an appropriate
// width to make it easier for user to glance at larger
// set of options
const comboboxStyles = css({ width: '350px' });

const UnwindForm = ({ fields, onChange }: WizardComponentProps) => {
  const [unwindFormState, setUnwindFormState] = useState<UnwindFormState>({
    unwindField: '',
  });

  const handleUnwindFormStateChange = <T extends keyof UnwindFormState>(
    property: T,
    value: UnwindFormState[T]
  ) => {
    const nextUnwindState = {
      ...unwindFormState,
      [property]: value,
    };
    setUnwindFormState(nextUnwindState);

    const stageValue = mapUnwindFormStateToStageValue(nextUnwindState);

    onChange(
      stageValue ? { path: `$${stageValue}` } : {},
      !stageValue ? new Error('No field selected') : null
    );
  };

  return (
    <div className={containerStyles}>
      <div className={formGroupStyles} data-testid="unwind-form">
        Deconstruct array elements from
        <FieldCombobox
          data-testid="unwind-form-field"
          className={comboboxStyles}
          multiselect={false}
          value={unwindFormState.unwindField}
          onChange={(field: string | null) =>
            handleUnwindFormStateChange('unwindField', field ?? '')
          }
          fields={fields}
          fieldFilter={(field) => field.type === 'Array'}
        />
      </div>
    </div>
  );
};

export default UnwindForm;
