import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { debounce } from 'lodash';
import { connect } from 'react-redux';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import {
  css,
  cx,
  Button,
  Body,
  spacing,
  Banner,
  Icon,
  palette,
  useConfirmationModal,
  useDarkMode,
  KeylineCard,
} from '@mongodb-js/compass-components';
import {
  CodemirrorMultilineEditor,
  createValidationAutocompleter,
} from '@mongodb-js/compass-editor';
import { useAutocompleteFields } from '@mongodb-js/compass-field-store';
import { useConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import { parseFilter } from 'mongodb-query-parser';
import type {
  Validation,
  ValidationLevel,
  ValidationServerAction,
  ValidationState,
} from '../modules/validation';
import { ActionSelector, LevelSelector } from './validation-selectors';
import type { RootState } from '../modules';
import {
  changeValidator,
  cancelValidation,
  saveValidation,
  validationActionChanged,
  validationLevelChanged,
} from '../modules/validation';
import { clearSampleDocuments } from '../modules/sample-documents';
import { enableEditRules } from '../modules/edit-mode';

const validationEditorStyles = css({
  padding: spacing[400],
});

const validationOptionsStyles = css({
  display: 'flex',
});

const actionsStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  marginTop: spacing[400],
});

const editorStyles = css({
  marginTop: spacing[400],
});

const editorStylesLight = css({
  borderLeft: `3px solid ${palette.gray.light2}`,
});

const editorStylesDark = css({
  borderLeft: `3px solid ${palette.gray.dark2}`,
});

const modifiedMessageStyles = css({
  color: palette.yellow.dark2,
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
  flex: 1,
});

const modifiedMessageDarkStyles = css({
  color: palette.yellow.light2,
});

const buttonStyles = css({
  marginLeft: spacing[200],
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
      formattable={!readOnly}
      completer={completer}
    />
  );
};

type ValidationEditorProps = {
  namespace: string;
  clearSampleDocuments: () => void;
  onClickEnableEditRules: () => void;
  changeValidator: (text: string) => void;
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
  isEditingEnabled: boolean;
};

function doesValidatorHaveJsonSchema(validator: string): boolean {
  try {
    const parsedValidator = parseFilter(validator);
    return (
      typeof parsedValidator === 'object' && !!parsedValidator?.$jsonSchema
    );
  } catch {
    return false;
  }
}

/**
 * The validation editor component.
 */
export const ValidationEditor: React.FunctionComponent<
  ValidationEditorProps
> = ({
  namespace,
  clearSampleDocuments,
  onClickEnableEditRules,
  changeValidator,
  validationActionChanged,
  validationLevelChanged,
  cancelValidation,
  saveValidation,
  serverVersion,
  validation,
  isEditable,
  isEditingEnabled,
}) => {
  const track = useTelemetry();
  const connectionInfoRef = useConnectionInfoRef();
  const { showConfirmation } = useConfirmationModal();

  const clearSampleDocumentsRef = useRef(clearSampleDocuments);
  clearSampleDocumentsRef.current = clearSampleDocuments;

  const changeValidatorRef = useRef(changeValidator);
  changeValidatorRef.current = changeValidator;

  const saveValidationRef = useRef(saveValidation);
  saveValidationRef.current = saveValidation;

  const validationRef = useRef(validation);
  validationRef.current = validation;

  const trackValidator = useCallback(
    (validator: string) => {
      const trackEvent = {
        json_schema: doesValidatorHaveJsonSchema(validator),
      };
      track('Schema Validation Edited', trackEvent, connectionInfoRef.current);
    },
    [connectionInfoRef, track]
  );

  const debounceChangeValidator = useMemo(() => {
    return debounce((validator: string) => {
      clearSampleDocumentsRef.current();
      trackValidator(validator);
    }, 750);
  }, [trackValidator]);

  useEffect(() => {
    return () => {
      debounceChangeValidator.cancel();
    };
  }, [debounceChangeValidator]);

  const onValidatorChange = useCallback(
    (validator: string) => {
      changeValidatorRef.current(validator);
      debounceChangeValidator(validator);
    },
    [debounceChangeValidator]
  );

  const darkMode = useDarkMode();

  const { validationAction, validationLevel, error, syntaxError, isChanged } =
    validation;

  const onClickApplyValidation = useCallback(async () => {
    const confirmed = await showConfirmation({
      title: 'Are you sure you want to apply these validation rules?',
      description:
        'These rules will be enforced on updates & inserts of your document. Please make sure you have reviewed the rules before applying them.',
    });
    if (!confirmed) {
      return;
    }

    saveValidationRef.current(validationRef.current);
  }, [showConfirmation]);

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
          readOnly={!isEditable || !isEditingEnabled}
          serverVersion={serverVersion}
        />
      </div>
      {syntaxError && <Banner variant="danger">{syntaxError.message}</Banner>}
      {!syntaxError && error && (
        <Banner variant="danger">{error.message}</Banner>
      )}
      {isEditable && (
        <div className={actionsStyles}>
          {isEditingEnabled ? (
            <>
              {isChanged && (
                <Body
                  className={cx(
                    modifiedMessageStyles,
                    darkMode && modifiedMessageDarkStyles
                  )}
                  data-testid="validation-action-message"
                >
                  <Icon glyph="InfoWithCircle" /> Rules are modified &amp; not
                  applied. Please review before applying.
                </Body>
              )}
              <Button
                type="button"
                className={buttonStyles}
                variant="default"
                data-testid="cancel-validation-button"
                onClick={cancelValidation}
              >
                Cancel
              </Button>
              {isChanged && (
                <Button
                  type="button"
                  className={buttonStyles}
                  variant="primary"
                  data-testid="update-validation-button"
                  onClick={() => {
                    void onClickApplyValidation();
                  }}
                  disabled={!!syntaxError}
                >
                  Apply
                </Button>
              )}
            </>
          ) : (
            <Button
              type="button"
              leftGlyph={<Icon glyph="Edit" />}
              variant="primaryOutline"
              data-testid="enable-edit-validation-button"
              onClick={onClickEnableEditRules}
            >
              Edit rules
            </Button>
          )}
        </div>
      )}
    </KeylineCard>
  );
};

const mapStateToProps = (state: RootState) => ({
  serverVersion: state.serverVersion,
  isEditingEnabled: state.editMode.isEditingEnabledByUser,
  validation: state.validation,
  namespace: state.namespace.ns,
});

/**
 * Connect the redux store to the component (dispatch).
 */
export default connect(mapStateToProps, {
  clearSampleDocuments,
  changeValidator,
  cancelValidation,
  saveValidation,
  onClickEnableEditRules: enableEditRules,
  validationActionChanged,
  validationLevelChanged,
})(ValidationEditor);
