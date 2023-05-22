import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
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

import { checkValidator } from '../../modules/validation';

import { ActionSelector, LevelSelector } from '../validation-selectors';

const { track } = createLoggerAndTelemetry('COMPASS-SCHEMA-VALIDATION-UI');

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

const ValidationCodeEditor = ({
  text,
  onChangeText,
  readOnly,
  fields,
  serverVersion,
}) => {
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

ValidationCodeEditor.propTypes = {
  text: PropTypes.string.isRequired,
  onChangeText: PropTypes.func.isRequired,
  readOnly: PropTypes.bool.isRequired,
  fields: PropTypes.array,
  serverVersion: PropTypes.string,
};

/**
 * The validation editor component.
 */
class ValidationEditor extends Component {
  static displayName = 'ValidationEditor';

  static propTypes = {
    clearSampleDocuments: PropTypes.func.isRequired,
    validatorChanged: PropTypes.func.isRequired,
    validationActionChanged: PropTypes.func.isRequired,
    validationLevelChanged: PropTypes.func.isRequired,
    cancelValidation: PropTypes.func.isRequired,
    saveValidation: PropTypes.func.isRequired,
    serverVersion: PropTypes.string,
    fields: PropTypes.array,
    validation: PropTypes.shape({
      validator: PropTypes.string.isRequired,
      validationAction: PropTypes.string.isRequired,
      validationLevel: PropTypes.string.isRequired,
      isChanged: PropTypes.bool.isRequired,
      syntaxError: PropTypes.object,
      error: PropTypes.object,
    }),
    isEditable: PropTypes.bool.isRequired,
    darkMode: PropTypes.bool.isRequired,
  };

  /**
   * Set up the autocompleters once on initialization.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
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
  onValidatorChange(validator) {
    this.props.validatorChanged(validator);
    this.validatorChanged();
  }

  /**
   * Checks if there is any error.
   *
   * @returns {Boolean} True if there is an error.
   */
  hasErrors() {
    return !!(this.props.validation.error || this.props.validation.syntaxError);
  }

  /**
   * Validator changed.
   */
  validatorChanged() {
    this.debounceValidatorChanged(
      this.props.validation.validator,
      this.hasErrors()
    );
  }

  trackValidator(validator) {
    const checkedValidator = checkValidator(validator);
    const trackEvent = {
      json_schema: Boolean(checkedValidator.validator.$jsonSchema),
    };
    track('Schema Validation Edited', trackEvent);
  }

  /**
   * Render action selector.
   *
   * @returns {React.Component} The component.
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
   *
   * @returns {React.Component} The component.
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
   *
   * @returns {React.Component} The component.
   */
  renderValidationMessage() {
    if (!this.hasErrors()) {
      return;
    }

    let message = '';
    let variant = 'default';

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
   *
   * @returns {React.Component} The component.
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
   *
   * @returns {React.Component} The rendered component.
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
            text={validation.validator}
            onChangeText={(text) => {
              return this.onValidatorChange(text);
            }}
            readOnly={!isEditable}
            fields={this.props.fields}
            serverVersion={this.props.serverVersion}
          />
        </div>
        {this.renderValidationMessage()}
        {this.renderActionsPanel()}
      </KeylineCard>
    );
  }
}

export default withDarkMode(ValidationEditor);
