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
  useTranslation,
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
  const t = useTranslation();
  const labelId = useId();
  const controlId = useId();

  return (
    <div className={validationOptionStyles}>
      <Label htmlFor={controlId}>
        {t('schemaValidation.selectors.action', 'Action')}
      </Label>
      <IconButton
        href={ACTION_HELP_URL}
        target="_blank"
        aria-label={t(
          'schemaValidation.selectors.actionInfo',
          'More information on validation actions'
        )}
      >
        <Icon glyph="InfoWithCircle" size="small" />
      </IconButton>
      <Select
        data-testid="validation-action-selector"
        aria-labelledby={labelId}
        disabled={!isEditable}
        onChange={validationActionChanged}
        value={validationAction}
        allowDeselect={false}
        className={selectStyles}
        size="small"
      >
        <Option value="warn">
          {t('schemaValidation.selectors.warning', 'Warning')}
        </Option>
        <Option value="error">
          {t('schemaValidation.selectors.error', 'Error')}
        </Option>
        {hasErrorAndLogValidationActionSupport(serverVersion) && (
          <Option
            value="errorAndLog"
            data-testid="validation-action-option-error-and-log"
          >
            {t('schemaValidation.selectors.errorAndLog', 'Error and Log')}
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
  const t = useTranslation();
  const labelId = useId();
  const controlId = useId();

  return (
    <div className={validationOptionStyles}>
      <Label htmlFor={controlId}>
        {t('schemaValidation.selectors.level', 'Level')}
      </Label>
      <IconButton
        href={LEVEL_HELP_URL}
        target="_blank"
        aria-label={t(
          'schemaValidation.selectors.levelInfo',
          'More information on validation levels'
        )}
      >
        <Icon glyph="InfoWithCircle" size="small" />
      </IconButton>
      <Select
        data-testid="validation-level-selector"
        aria-labelledby={labelId}
        disabled={!isEditable}
        onChange={validationLevelChanged}
        value={validationLevel}
        allowDeselect={false}
        className={selectStyles}
        size="small"
      >
        <Option value="off">
          {t('schemaValidation.selectors.off', 'Off')}
        </Option>
        <Option value="moderate">
          {t('schemaValidation.selectors.moderate', 'Moderate')}
        </Option>
        <Option value="strict">
          {t('schemaValidation.selectors.strict', 'Strict')}
        </Option>
        {/* Upgrading to "constraint" requires a separate two-command collMod
            workflow that Compass does not drive, so the option is only ever
            rendered to display a level that is already in effect. */}
        {validationLevel === 'constraint' && (
          <Option
            value="constraint"
            data-testid="validation-level-option-constraint"
          >
            {t('schemaValidation.selectors.constraint', 'Constraint')}
          </Option>
        )}
      </Select>
    </div>
  );
}
