import React from 'react';

import {
  IconButton,
  Icon,
  Label,
  Select,
  Option,
  useId,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { hasErrorAndLogValidationActionSupport } from '../modules/validation';
import type {
  ValidationLevel,
  ValidationServerAction,
} from '../modules/validation';

const ACTION_HELP_URL =
  'https://www.mongodb.com/docs/manual/reference/command/collMod/#mongodb-collflag-validationAction';

const LEVEL_HELP_URL =
  'https://www.mongodb.com/docs/manual/reference/command/collMod/#mongodb-collflag-validationLevel';

const validationOptionStyles = css({
  display: 'flex',
  marginLeft: spacing[600],
  alignItems: 'center',
});

const selectStyles = css({
  width: spacing[1600] * 2,
});

type ActionSelectorProps = {
  isEditable: boolean;
  validationActionChanged: (value: ValidationServerAction) => void;
  validationAction: ValidationServerAction;
  serverVersion: string;
};

export function ActionSelector({
  isEditable,
  validationActionChanged,
  validationAction,
  serverVersion,
}: ActionSelectorProps) {
  const labelId = useId();
  const controlId = useId();

  return (
    <div className={validationOptionStyles}>
      <Label htmlFor={controlId}>Action</Label>
      <IconButton
        href={ACTION_HELP_URL}
        target="_blank"
        aria-label="More information on validation actions"
      >
        <Icon glyph="InfoWithCircle" size="small" />
      </IconButton>
      <Select
        data-testid="validation-action-selector"
        aria-labelledby={labelId}
        disabled={!isEditable}
        onChange={validationActionChanged as (value: string) => void}
        value={validationAction}
        allowDeselect={false}
        className={selectStyles}
        size="small"
      >
        <Option value="warn">Warning</Option>
        <Option value="error">Error</Option>
        {hasErrorAndLogValidationActionSupport(serverVersion) && (
          <Option
            value="errorAndLog"
            data-testid="validation-action-option-error-and-log"
          >
            Error and Log
          </Option>
        )}
      </Select>
    </div>
  );
}

type LevelSelectorProps = {
  isEditable: boolean;
  validationLevelChanged: (value: ValidationLevel) => void;
  validationLevel: ValidationLevel;
};

export function LevelSelector({
  isEditable,
  validationLevelChanged,
  validationLevel,
}: LevelSelectorProps) {
  const labelId = useId();
  const controlId = useId();

  return (
    <div className={validationOptionStyles}>
      <Label htmlFor={controlId}>Level</Label>
      <IconButton
        href={LEVEL_HELP_URL}
        target="_blank"
        aria-label="More information on validation levels"
      >
        <Icon glyph="InfoWithCircle" size="small" />
      </IconButton>
      <Select
        data-testid="validation-level-selector"
        aria-labelledby={labelId}
        disabled={!isEditable}
        onChange={validationLevelChanged as (value: string) => void}
        value={validationLevel}
        allowDeselect={false}
        className={selectStyles}
        size="small"
      >
        <Option value="off">Off</Option>
        <Option value="moderate">Moderate</Option>
        <Option value="strict">Strict</Option>
      </Select>
    </div>
  );
}
