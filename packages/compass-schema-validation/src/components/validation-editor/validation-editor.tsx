import React, { Component } from 'react';
import { debounce } from 'lodash';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import { withTelemetry } from '@mongodb-js/compass-telemetry/provider';
import type { BannerVariant } from '@mongodb-js/compass-components';
import {
  css,
  cx,
  Button,
  Body,
  spacing,
  Banner,
  palette,
  withDarkMode,
  KeylineCard,
} from '@mongodb-js/compass-components';
import {
  CodemirrorMultilineEditor,
  createValidationAutocompleter,
} from '@mongodb-js/compass-editor';
import { useAutocompleteFields } from '@mongodb-js/compass-field-store';

import type {
  Validation,
  ValidationLevel,
  ValidationServerAction,
  ValidationState,
} from '../../modules/validation';
import { checkValidator } from '../../modules/validation';
import { ActionSelector, LevelSelector } from '../validation-selectors';
import {
  type ConnectionInfoAccess,
  withConnectionInfoAccess,
} from '@mongodb-js/compass-connections/provider';

const validationEditorStyles = css({
  padding: spacing[3],
});

const validationOptionsStyles = css({
  display: 'flex',
});

const actionsStyles = css({
  display: 'flex',
  alignItems: 'center',
  marginTop: spacing[3],
});

const editorStyles = css({
  marginTop: spacing[3],
});

const editorStylesLight = css({
  borderLeft: `3px solid ${palette.gray.light2}`,
});

const editorStylesDark = css({
  borderLeft: `3px solid ${palette.gray.dark2}`,
});

const modifiedMessageStyles = css({
  flex: 1,
});

const buttonStyles = css({
  marginLeft: spacing[2],
});

export type ValidationCodeEditorProps = Pick<
  React.ComponentProps<typeof CodemirrorMultilineEditor>,
  'onChangeText' | 'readOnly'
> & {
  namespace: string;
  text: string;
  serverVersion: string;
};

const ValidationCodeEditor = ({
  namespace,
  text,
  onChangeText,
  readOnly,
  serverVersion,
}: ValidationCodeEditorProps) => {
  const fields = useAutocompleteFields(namespace);

  const completer = React.useMemo(() => {
    return createValidationAutocompleter({ fields, serverVersion });
  }, [fields, serverVersion]);

  return (
    <CodemirrorMultilineEditor
      id="validation-code-editor"
      text={text}
      onChangeText={onChangeText}
      readOnly={readOnly}
      completer={completer}
    />
  );
};

export type ValidationEditorProps = {
  namespace: string;
  clearSampleDocuments: () => void;
  validatorChanged: (text: string) => void;
  validationActionChanged: (action: ValidationServerAction) => void;
  validationLevelChanged: (level: ValidationLevel) => void;
  cancelValidation: () => void;
  saveValidation: (text: Validation) => void;
  serverVersion: string;
  validation: Pick<
    ValidationState,
    | 'validator'
    | 'validationAction'
    | 'validationLevel'
    | 'isChanged'
    | 'syntaxError'
    | 'error'
  >;
  isEditable: boolean;
  darkMode?: boolean;
  track: TrackFunction;
  connectionInfoAccess: ConnectionInfoAccess;
};

/**
 * The validation editor component.
 */
class ValidationEditor extends Component<ValidationEditorProps> {
  static displayName = 'ValidationEditor';

  debounceValidatorChanged: (text: string) => void;

  /**
   * Set up the autocompleters once on initialization.
   *
   * @param {Object} props - The properties.
   */
  constructor(props: ValidationEditorProps) {
    super(props);
    this.debounceValidatorChanged = debounce((validator) => {
      this.props.clearSampleDocuments();
      this.trackValidator(validator);
    }, 750);
  }

  /**
   * Save validator changes.
   */
  onValidatorSave() {
    this.props.saveValidation(this.props.validation);
  }

  /**
   * Save validator changes.
   *
   * @param {Object} validator - The validator.
   */
  onValidatorChange(validator: string) {
    this.props.validatorChanged(validator);
    this.validatorChanged();
  }

  /**
   * Checks if there is any error.
   */
  hasErrors(): boolean {
    return !!(this.props.validation.error || this.props.validation.syntaxError);
  }

  /**
   * Validator changed.
   */
  validatorChanged() {
    this.debounceValidatorChanged(this.props.validation.validator);
  }

  trackValidator(validator: string) {
    const checkedValidator = checkValidator(validator);
    const trackEvent = {
      json_schema:
        typeof checkedValidator.validator === 'object' &&
        !!checkedValidator.validator?.$jsonSchema,
    };
    this.props.track(
      'Schema Validation Edited',
      trackEvent,
      this.props.connectionInfoAccess.getCurrentConnectionInfo()
    );
  }

  /**
   * Render action selector.
   */
  renderActionSelector() {
    const { validation, isEditable, validationActionChanged } = this.props;
    const { validationAction } = validation;

    return (
      <ActionSelector
        isEditable={isEditable}
        validationActionChanged={validationActionChanged}
        validationAction={validationAction}
      />
    );
  }

  /**
   * Render level selector.
   */
  renderLevelSelector() {
    const { validation, isEditable, validationLevelChanged } = this.props;
    const { validationLevel } = validation;

    return (
      <LevelSelector
        isEditable={isEditable}
        validationLevelChanged={validationLevelChanged}
        validationLevel={validationLevel}
      />
    );
  }

  /**
   * Render validation message.
   */
  renderValidationMessage() {
    if (!this.hasErrors()) {
      return;
    }

    let message = '';
    let variant: BannerVariant = 'info';

    if (this.props.validation.syntaxError) {
      message = this.props.validation.syntaxError.message;
      variant = 'danger';
    } else if (this.props.validation.error) {
      message = this.props.validation.error.message;
      variant = 'warning';
    }

    return <Banner variant={variant}>{message}</Banner>;
  }

  /**
   * Render actions pannel.
   */
  renderActionsPanel() {
    if (!(this.props.validation.isChanged && this.props.isEditable)) {
      return;
    }

    return (
      <div className={actionsStyles}>
        <Body
          className={modifiedMessageStyles}
          data-testid="validation-action-message"
        >
          Validation modified
        </Body>
        <Button
          type="button"
          className={buttonStyles}
          variant="default"
          data-testid="cancel-validation-button"
          onClick={this.props.cancelValidation}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className={buttonStyles}
          variant="primary"
          data-testid="update-validation-button"
          onClick={this.onValidatorSave.bind(this)}
          disabled={this.hasErrors()}
        >
          Update
        </Button>
      </div>
    );
  }

  /**
   * Render ValidationEditor component.
   */
  render() {
    const { darkMode, isEditable, validation } = this.props;

    return (
      <KeylineCard
        data-testid="validation-editor"
        className={validationEditorStyles}
      >
        <div className={validationOptionsStyles}>
          {this.renderActionSelector()}
          {this.renderLevelSelector()}
        </div>
        <div
          className={cx(
            editorStyles,
            darkMode ? editorStylesDark : editorStylesLight
          )}
        >
          <ValidationCodeEditor
            namespace={this.props.namespace}
            text={validation.validator}
            onChangeText={(text) => {
              return this.onValidatorChange(text);
            }}
            readOnly={!isEditable}
            serverVersion={this.props.serverVersion}
          />
        </div>
        {this.renderValidationMessage()}
        {this.renderActionsPanel()}
      </KeylineCard>
    );
  }
}

export default withTelemetry(
  withConnectionInfoAccess(
    withDarkMode<ValidationEditorProps>(ValidationEditor)
  )
);
