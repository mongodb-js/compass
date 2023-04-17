import React, { useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../../../modules';
import {
  Body,
  ComboboxWithCustomOption,
  Icon,
  IconButton,
  css,
  palette,
  spacing,
} from '@mongodb-js/compass-components';

// Types
export type ProjectOwnProps = {
  onChange: (value: string, error: Error | null) => void;
};

export type HOCProps = {
  variant: 'include' | 'exclude';
};

type MapStateProps = {
  fields: string[];
};

export type ProjectProps = ProjectOwnProps & HOCProps & MapStateProps;

type ProjectFormState = (string | null)[];

// Helpers
const PLACEHOLDER_TEXT = 'Select field names';

const mapProjectFormStateToStageValue = (
  variant: HOCProps['variant'],
  formState: ProjectFormState
) => {
  return formState.reduce<{ [field: string]: 1 | -1 }>((projection, field) => {
    if (field === null) {
      return projection;
    } else {
      return {
        ...projection,
        [field]: variant === 'include' ? 1 : -1,
      };
    }
  }, {});
};

// Components
const formGroupStyles = css({
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  gap: spacing[2],
});

const labelStyles = css({
  minWidth: '140px',
  textAlign: 'right',
});

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
});

export const ProjectForm = ({
  fields,
  variant = 'include',
  onChange,
}: ProjectProps) => {
  const [projectFields, setProjectFields] = useState<ProjectFormState>([null]);
  const comboboxStyles = useMemo(() => {
    const placeholderLength = PLACEHOLDER_TEXT.length;
    return {
      width: `calc(${String(
        Math.max(placeholderLength, ...fields.map((label) => label.length))
      )}ch)`,
    };
  }, [fields]);

  useEffect(() => {
    const stageValue = mapProjectFormStateToStageValue(variant, projectFields);

    onChange(
      JSON.stringify(stageValue),
      Object.keys(stageValue).length === 0
        ? new Error('No field selected')
        : null
    );
  }, [projectFields, onChange, variant]);

  const variantText = variant === 'include' ? 'Include' : 'Exclude';

  const onSelectField = (index: number, value: string | null) => {
    if (!value) return;
    const nextProjectFields = [...projectFields];
    nextProjectFields[index] = value;
    setProjectFields(nextProjectFields);
  };

  const addItem = (at: number) => {
    const nextProjectFields = [...projectFields];
    nextProjectFields.splice(at + 1, 0, null);
    setProjectFields(nextProjectFields);
  };

  const removeItem = (at: number) => {
    const nextProjectFields = [...projectFields];
    nextProjectFields.splice(at, 1);
    setProjectFields(nextProjectFields);
  };

  return (
    <div className={containerStyles}>
      {projectFields.map((fieldValue, index) => (
        <div
          className={formGroupStyles}
          key={`project-${variant}-form-${index}`}
          data-testid={`project-${variant}-form-${index}`}
        >
          <Body className={labelStyles}>
            {index === 0 ? variantText : 'and'}
          </Body>
          <div data-testid={`project-${variant}-form-${index}-field`}>
            <ComboboxWithCustomOption
              placeholder={PLACEHOLDER_TEXT}
              style={comboboxStyles}
              aria-label={PLACEHOLDER_TEXT}
              size="default"
              clearable={false}
              value={fieldValue}
              onChange={(value: string | null) => onSelectField(index, value)}
              options={fields}
              optionLabel="Field:"
              // Used for testing to access the popover for a stage
              popoverClassName={`project-${variant}-form-${index}-field-combobox`}
            />
          </div>
          <IconButton aria-label="Add" onClick={() => addItem(index)}>
            <Icon color={palette.black} glyph="Plus" />
          </IconButton>
          {index !== 0 && (
            <IconButton aria-label="Remove" onClick={() => removeItem(index)}>
              <Icon color={palette.black} glyph="Minus" />
            </IconButton>
          )}
        </div>
      ))}
    </div>
  );
};

export default connect((state: RootState) => ({
  fields: state.fields.map((x: { name: string }) => x.name),
}))(ProjectForm);
