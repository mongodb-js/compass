import React, { useEffect, useState } from 'react';

import {
  ComboboxWithCustomOption,
  Select,
  Option,
  css,
  spacing,
} from '@mongodb-js/compass-components';

// Types
export type ProjectOwnProps = {
  onChange: (value: string, error: Error | null) => void;
};
type MapStateProps = { fields: string[] };
export type ProjectProps = ProjectOwnProps & MapStateProps;

type ProjectFormState = string[];
export type ProjectionType = 'include' | 'exclude';

// Helpers
export const SELECT_PLACEHOLDER_TEXT = 'Select projection type';
export const COMBOBOX_PLACEHOLDER_TEXT = 'Select field names';

export const mapProjectFormStateToStageValue = (
  projectionType: ProjectionType,
  formState: ProjectFormState
) => {
  return formState.reduce<{ [field: string]: 1 | 0 }>((projection, field) => {
    if (field === null) {
      return projection;
    } else {
      return {
        ...projection,
        [field]: projectionType === 'include' ? 1 : 0,
      };
    }
  }, {});
};

// Generates parent paths for a list of paths
// by joining paths one at a time.
// ['a','b','c'] => ['a', 'a.b', 'a.b.c']
export const getParentPaths = (paths: string[], excluding: string[] = []) => {
  const parentPaths = paths.reduce<string[]>((parents, path) => {
    const parentPath = !parents.length
      ? path
      : parents[parents.length - 1] + '.' + path;

    return [...parents, parentPath];
  }, []);

  return parentPaths.filter((path) => !excluding.includes(path));
};

export const makeIsOptionDisabled = (projectFields: string[]) => {
  return (option: string) => {
    const paths = option.split('.');
    // If option is nested property then we might need to disable
    // it if one of its possible children or one of its parent is
    //  already in projection
    if (paths.length > 1) {
      const parentPaths = getParentPaths(paths, [option]);
      const parentPathInProjection = parentPaths.some((path) =>
        projectFields.includes(path)
      );
      const childrenInProjection = projectFields.some((field) =>
        field.startsWith(`${option}.`)
      );
      return parentPathInProjection || childrenInProjection;
    }
    // If option is a path at first level then we disable it only
    // when any of its children are already in projection
    else {
      return projectFields.some((field) => field.startsWith(`${option}.`));
    }
  };
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

const ProjectForm = ({ fields, onChange }: ProjectProps) => {
  const [projectionType, setProjectionType] =
    useState<ProjectionType>('include');
  const [projectFields, setProjectFields] = useState<ProjectFormState>([]);

  useEffect(() => {
    const stageValue = mapProjectFormStateToStageValue(
      projectionType,
      projectFields
    );

    onChange(
      JSON.stringify(stageValue),
      Object.keys(stageValue).length === 0
        ? new Error('No field selected')
        : null
    );
  }, [projectFields, onChange, projectionType]);

  const onSelectField = (value: string[]) => {
    const nextProjectFields = [...value];
    setProjectFields(nextProjectFields);
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
          value={projectionType}
          onChange={(value) => setProjectionType(value as ProjectionType)}
        >
          <Option value="include">Include</Option>
          <Option value="exclude">Exclude</Option>
        </Select>
        <ComboboxWithCustomOption<true>
          data-testid="project-form-field"
          placeholder={COMBOBOX_PLACEHOLDER_TEXT}
          className={comboboxStyles}
          aria-label={COMBOBOX_PLACEHOLDER_TEXT}
          size="default"
          clearable={true}
          multiselect={true}
          value={projectFields}
          onChange={onSelectField}
          options={fields}
          optionLabel="Field:"
          overflow="scroll-x"
          isOptionDisabled={makeIsOptionDisabled(projectFields)}
          // Used for testing to access the popover for a stage
          popoverClassName="project-form-field-combobox"
        />
      </div>
    </div>
  );
};

export default ProjectForm;
