import React, { useMemo, useState } from 'react';

import { Select, Option, css, spacing } from '@mongodb-js/compass-components';
import type { WizardComponentProps } from '..';
import { FieldCombobox } from '../field-combobox';

// Types
type ProjectionFields = string[];
export type ProjectionType = 'include' | 'exclude';
type ProjectFormState = {
  projectionFields: ProjectionFields;
  projectionType: ProjectionType;
};

// Helpers
export const SELECT_PLACEHOLDER_TEXT = 'Select projection type';
export const COMBOBOX_PLACEHOLDER_TEXT = 'Select field names';

export const mapProjectFormStateToStageValue = ({
  projectionFields,
  projectionType,
}: ProjectFormState) => {
  return projectionFields.reduce<{ [field: string]: 1 | 0 }>(
    (projection, field) => {
      if (field === null) {
        return projection;
      } else {
        return {
          ...projection,
          [field]: projectionType === 'include' ? 1 : 0,
        };
      }
    },
    {}
  );
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

const selectStyles = css({ minWidth: '120px' });

// Because our combobox renders with a horizontal scroll
// for selected items, we render it with an appropriate
// width to make it easier for user to glance at larger
// set of options
const comboboxStyles = css({ width: '350px' });

const ProjectForm = ({ fields, onChange }: WizardComponentProps) => {
  const fieldNames = useMemo(() => fields.map(({ name }) => name), [fields]);

  const [projectFormState, setProjectFormState] = useState<ProjectFormState>({
    projectionType: 'include',
    projectionFields: [],
  });

  const handleProjectFormStateChange = <T extends keyof ProjectFormState>(
    property: T,
    value: ProjectFormState[T]
  ) => {
    const nextProjectState = {
      ...projectFormState,
      [property]: value,
    };
    setProjectFormState(nextProjectState);

    const stageValue = mapProjectFormStateToStageValue(nextProjectState);
    onChange(
      JSON.stringify(stageValue),
      Object.keys(stageValue).length === 0
        ? new Error('No field selected')
        : null
    );
  };

  return (
    <div className={containerStyles}>
      <div className={formGroupStyles} data-testid="project-form">
        {/* @ts-expect-error leafygreen unresonably expects a labelledby here */}
        <Select
          data-testid="project-form-projection"
          className={selectStyles}
          allowDeselect={false}
          aria-label={SELECT_PLACEHOLDER_TEXT}
          value={projectFormState.projectionType}
          onChange={(value) =>
            handleProjectFormStateChange(
              'projectionType',
              value as ProjectionType
            )
          }
        >
          <Option value="include">Include</Option>
          <Option value="exclude">Exclude</Option>
        </Select>
        <FieldCombobox
          data-testid="project-form-field"
          className={comboboxStyles}
          multiselect={true}
          value={projectFormState.projectionFields}
          onChange={(fields: string[]) =>
            handleProjectFormStateChange('projectionFields', [...fields])
          }
          fields={fields}
          overflow="scroll-x"
          isRelatedFieldDisabled={true}
        />
      </div>
    </div>
  );
};

export default ProjectForm;
