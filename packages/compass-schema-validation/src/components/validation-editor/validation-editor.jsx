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
  withTheme,
  KeylineCard,
} from '@mongodb-js/compass-components';
import {
  Editor,
  EditorVariant,
  EditorTextCompleter,
  ValidationAutoCompleter,
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
  padding: '10px 0',
  marginTop: spacing[3],
});

const editorStylesLight = css({
  backgroundColor: palette.gray.light3,
  borderLeft: `3px solid ${palette.gray.light2}`,
});

const editorStylesDark = css({
  backgroundColor: palette.gray.dark3,
  borderLeft: `3px solid ${palette.gray.dark2}`,
});

const modifiedMessageStyles = css({
  flex: 1,
});

const buttonStyles = css({
  marginLeft: spacing[2],
});

/**
 * The validation editor component.
 */
class UnthemedValidationEditor extends Component {
  static displayName = 'ValidationEditor';

  static propTypes = {
    fetchSampleDocuments: PropTypes.func.isRequired,
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
    this.completer = new ValidationAutoCompleter(
      props.serverVersion,
      EditorTextCompleter,
      props.fields
    );
    this.debounceValidatorChanged = debounce((validator, hasErrors) => {
      this.props.fetchSampleDocuments(validator, hasErrors);
      this.trackValidator(validator);
    }, 750);
  }

  /**
   * Should the component update?
   *
   * @param {Object} nextProps - The next properties.
   *
   * @returns {Boolean} If the component should update.
   */
  shouldComponentUpdate(nextProps) {
    return (
      nextProps.validation.validator !== this.props.validation.validator ||
      nextProps.validation.validationAction !==
        this.props.validation.validationAction ||
      nextProps.validation.validationLevel !==
        this.props.validation.validationLevel ||
      nextProps.validation.error !== this.props.validation.error ||
      nextProps.validation.syntaxError !== this.props.validation.syntaxError ||
      nextProps.validation.isChanged !== this.props.validation.isChanged ||
      nextProps.serverVersion !== this.props.serverVersion ||
      nextProps.fields.length !== this.props.fields.length ||
      nextProps.isEditable !== this.props.isEditable
    );
  }

  /**
   * If there are new fields update autocompleter with new fields.
   */
  componentDidUpdate() {
    this.completer.update(this.props.fields);
    this.completer.version = this.props.serverVersion;
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
    return this.props.validation.error || this.props.validation.syntaxError;
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
        <Body className={modifiedMessageStyles} data-testid="validation-action-message">Validation modified</Body>
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
          <Editor
            variant={EditorVariant.Shell}
            text={validation.validator}
            onChangeText={(text) => this.onValidatorChange(text)}
            options={{
              highlightActiveLine: false,
            }}
            readOnly={!isEditable}
            completer={this.completer}
          />
        </div>
        {this.renderValidationMessage()}
        {this.renderActionsPanel()}
      </KeylineCard>
    );
  }
}

const ValidationEditor = withTheme(UnthemedValidationEditor);

export default ValidationEditor;
