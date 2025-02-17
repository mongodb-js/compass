import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { debounce } from 'lodash';
import { connect } from 'react-redux';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import type { BannerVariant } from '@mongodb-js/compass-components';
import {
  css,
  cx,
  Button,
  Body,
  spacing,
  Banner,
  palette,
  useDarkMode,
  KeylineCard,
} from '@mongodb-js/compass-components';
import {
  CodemirrorMultilineEditor,
  createValidationAutocompleter,
} from '@mongodb-js/compass-editor';
import { useAutocompleteFields } from '@mongodb-js/compass-field-store';
import { useConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import type {
  Validation,
  ValidationLevel,
  ValidationServerAction,
  ValidationState,
} from '../modules/validation';
import { ActionSelector, LevelSelector } from './validation-selectors';
import type { RootState } from '../modules';
import {
  checkValidator,
  validatorChanged,
  cancelValidation,
  saveValidation,
  validationActionChanged,
  validationLevelChanged,
} from '../modules/validation';
import { namespaceChanged } from '../modules/namespace';
import { clearSampleDocuments } from '../modules/sample-documents';

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

type ValidationCodeEditorProps = Pick<
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

type ValidationEditorProps = {
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
};

/**
 * The validation editor component.
 */
export const ValidationEditor: React.FunctionComponent<
  ValidationEditorProps
> = ({
  namespace,
  clearSampleDocuments,
  validatorChanged,
  validationActionChanged,
  validationLevelChanged,
  cancelValidation,
  saveValidation,
  serverVersion,
  validation,
  isEditable,
}) => {
  const track = useTelemetry();
  const connectionInfoRef = useConnectionInfoRef();

  const clearSampleDocumentsRef = useRef(clearSampleDocuments);
  clearSampleDocumentsRef.current = clearSampleDocuments;

  const validatorChangedRef = useRef(validatorChanged);
  validatorChangedRef.current = validatorChanged;

  const saveValidationRef = useRef(saveValidation);
  saveValidationRef.current = saveValidation;

  const validationRef = useRef(validation);
  validationRef.current = validation;

  const trackValidator = useCallback(
    (validator: string) => {
      const checkedValidator = checkValidator(validator);
      const trackEvent = {
        json_schema:
          typeof checkedValidator.validator === 'object' &&
          !!checkedValidator.validator?.$jsonSchema,
      };
      track('Schema Validation Edited', trackEvent, connectionInfoRef.current);
    },
    [connectionInfoRef, track]
  );

  const debounceValidatorChanged = useMemo(() => {
    return debounce((validator: string) => {
      clearSampleDocumentsRef.current();
      trackValidator(validator);
    }, 750);
  }, [trackValidator]);

  useEffect(() => {
    return () => {
      debounceValidatorChanged.cancel();
    };
  }, [debounceValidatorChanged]);

  const onValidatorChange = useCallback(
    (validator: string) => {
      validatorChangedRef.current(validator);
      debounceValidatorChanged(validator);
    },
    [debounceValidatorChanged]
  );

  const onValidatorSave = useCallback(() => {
    saveValidationRef.current(validationRef.current);
  }, []);

  const darkMode = useDarkMode();

  const { validationAction, validationLevel, error, syntaxError, isChanged } =
    validation;

  const hasErrors = !!(error || syntaxError);

  let message = '';
  let variant: BannerVariant = 'info';

  if (syntaxError) {
    message = syntaxError.message;
    variant = 'danger';
  } else if (error) {
    message = error.message;
    variant = 'warning';
  }

  const hasChangedAndEditable = isChanged && isEditable;

  return (
    <KeylineCard
      data-testid="validation-editor"
      className={validationEditorStyles}
    >
      <div className={validationOptionsStyles}>
        <ActionSelector
          isEditable={isEditable}
          validationActionChanged={validationActionChanged}
          validationAction={validationAction}
        />
        <LevelSelector
          isEditable={isEditable}
          validationLevelChanged={validationLevelChanged}
          validationLevel={validationLevel}
        />
      </div>
      <div
        className={cx(
          editorStyles,
          darkMode ? editorStylesDark : editorStylesLight
        )}
      >
        <ValidationCodeEditor
          namespace={namespace}
          text={validation.validator}
          onChangeText={(text) => {
            onValidatorChange(text);
          }}
          readOnly={!isEditable}
          serverVersion={serverVersion}
        />
      </div>
      {variant && message && <Banner variant={variant}>{message}</Banner>}
      {hasChangedAndEditable && (
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
            onClick={cancelValidation}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className={buttonStyles}
            variant="primary"
            data-testid="update-validation-button"
            onClick={onValidatorSave}
            disabled={hasErrors}
          >
            Update
          </Button>
        </div>
      )}
    </KeylineCard>
  );
};

const mapStateToProps = (state: RootState) => ({
  serverVersion: state.serverVersion,
  validation: state.validation,
  namespace: state.namespace.ns,
});

/**
 * Connect the redux store to the component (dispatch).
 */
export default connect(mapStateToProps, {
  clearSampleDocuments,
  validatorChanged,
  cancelValidation,
  saveValidation,
  namespaceChanged,
  validationActionChanged,
  validationLevelChanged,
})(ValidationEditor);
