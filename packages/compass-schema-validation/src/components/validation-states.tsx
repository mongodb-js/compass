import React from 'react';
import {
  Banner,
  Button,
  ButtonVariant,
  CancelLoader,
  EmptyContent,
  ErrorSummary,
  Link,
  SpinLoaderWithLabel,
  WarningSummary,
  css,
  spacing,
  useTranslation,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { usePreferences } from 'compass-preferences-model/provider';
import { changeZeroState } from '../modules/zero-state';
import type { EditModeState } from '../modules/edit-mode';
import type { RootState } from '../modules';
import ValidationEditor from './validation-editor';
import { SampleDocuments } from './sample-documents';
import { ZeroGraphic } from './zero-graphic';
import {
  clearRulesGenerationError,
  generateValidationRules,
  stopRulesGeneration,
  type RulesGenerationError,
} from '../modules/rules-generation';

const validationStatesStyles = css({
  padding: spacing[400],
  height: '100%',
});
const contentContainerStyles = css({ height: '100%' });
const zeroStateButtonsStyles = css({
  display: 'flex',
  gap: spacing[400],
});

const loaderStyles = css({
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
});

/**
 * Link to the schema validation documentation.
 */
const DOC_SCHEMA_VALIDATION =
  'https://docs.mongodb.com/manual/core/schema-validation/';

/**
 * Link to the upgrading to the latest revision documentation.
 */
const DOC_UPGRADE_REVISION =
  'https://docs.mongodb.com/manual/tutorial/upgrade-revision/';

type ValidationStatesProps = {
  isZeroState: boolean;
  isRulesGenerationInProgress?: boolean;
  rulesGenerationError?: RulesGenerationError;
  isLoaded: boolean;
  changeZeroState: (value: boolean) => void;
  generateValidationRules: () => void;
  clearRulesGenerationError: () => void;
  stopRulesGeneration: () => void;
  editMode: Pick<
    EditModeState,
    | 'collectionTimeSeries'
    | 'collectionReadOnly'
    | 'writeStateStoreReadOnly'
    | 'oldServerReadOnly'
    | 'constraintValidation'
  >;
};

function ValidationBanners({
  editMode,
}: {
  editMode: ValidationStatesProps['editMode'];
}) {
  const t = useTranslation();

  if (editMode.collectionTimeSeries) {
    return (
      <WarningSummary
        warnings={t(
          'schemaValidation.states.timeSeries',
          'Schema validation for time-series collections is not supported.'
        )}
        data-testid="collection-validation-warning"
      />
    );
  }

  if (editMode.collectionReadOnly) {
    return (
      <WarningSummary
        warnings={t(
          'schemaValidation.states.readOnlyView',
          'Schema validation for readonly views is not supported.'
        )}
        data-testid="collection-validation-warning"
      />
    );
  }

  if (editMode.writeStateStoreReadOnly) {
    return (
      <WarningSummary
        warnings={t(
          'schemaValidation.states.secondaryNode',
          'This action is not available on a secondary node.'
        )}
        data-testid="collection-validation-warning"
      />
    );
  }

  if (editMode.constraintValidation === 'active') {
    return (
      <WarningSummary
        warnings={t(
          'schemaValidation.states.constraintActive',
          'This collection uses the "constraint" validation level, which guarantees every document matches the validator. The rules cannot be changed while it is in effect.'
        )}
        data-testid="collection-validation-warning"
      />
    );
  }

  if (editMode.constraintValidation === 'prepared') {
    return (
      <WarningSummary
        warnings={t(
          'schemaValidation.states.constraintPrepared',
          'This collection is prepared for an upgrade to the "constraint" validation level. The rules cannot be changed until the upgrade completes, or until the prepared state is cleared by running collMod with prepareConstraintValidationLevel: false.'
        )}
        data-testid="collection-validation-warning"
      />
    );
  }

  if (editMode.oldServerReadOnly) {
    return (
      <Banner variant="warning">
        <div data-testid="old-server-read-only">
          {t(
            'schemaValidation.states.oldServer',
            'Compass no longer supports the visual rule builder for server versions below 3.2. To use the visual rule builder, please'
          )}
          &nbsp;
          <Link target="_blank" href={DOC_UPGRADE_REVISION}>
            {t('schemaValidation.states.upgrade', 'upgrade to MongoDB 3.2.')}
          </Link>
        </div>
      </Banner>
    );
  }

  return null;
}

const GeneratingScreen: React.FunctionComponent<{
  onCancelClicked: () => void;
}> = ({ onCancelClicked }) => {
  const t = useTranslation();
  return (
    <div className={loaderStyles}>
      <CancelLoader
        data-testid="generating-rules"
        progressText={t(
          'schemaValidation.states.generating',
          'Generating rules'
        )}
        cancelText={t('schemaValidation.states.stop', 'Stop')}
        onCancel={onCancelClicked}
      />
    </div>
  );
};

const RulesGenerationErrorBanner: React.FunctionComponent<{
  error: RulesGenerationError;
  onDismissError: () => void;
}> = ({ error, onDismissError }) => {
  const t = useTranslation();
  if (error?.errorType === 'timeout') {
    return (
      <WarningSummary
        data-testid="rules-generation-timeout-message"
        warnings={[
          t(
            'schemaValidation.states.timeout',
            'Operation exceeded time limit. Please try increasing the maxTimeMS in Compass Settings.'
          ),
        ]}
        dismissible={true}
        onClose={onDismissError}
      />
    );
  }
  return (
    <ErrorSummary
      data-testid="rules-generation-error-message"
      errors={[
        `${t(
          'schemaValidation.states.generationError',
          'Error occured during rules generation'
        )}: ${error.errorMessage}`,
      ]}
      dismissible={true}
      onClose={onDismissError}
    />
  );
};

export function ValidationStates({
  isZeroState,
  isRulesGenerationInProgress,
  rulesGenerationError,
  isLoaded,
  changeZeroState,
  generateValidationRules,
  clearRulesGenerationError,
  stopRulesGeneration,
  editMode,
}: ValidationStatesProps) {
  const t = useTranslation();
  const { readOnly } = usePreferences(['readOnly']);

  const isEditable =
    !editMode.collectionReadOnly &&
    !editMode.collectionTimeSeries &&
    !editMode.writeStateStoreReadOnly &&
    !editMode.oldServerReadOnly &&
    editMode.constraintValidation === 'none' &&
    !readOnly;

  return (
    <div
      className={validationStatesStyles}
      data-testid="schema-validation-states"
    >
      {rulesGenerationError && (
        <RulesGenerationErrorBanner
          error={rulesGenerationError}
          onDismissError={clearRulesGenerationError}
        />
      )}
      <ValidationBanners editMode={editMode} />
      {!isLoaded && (
        <div className={loaderStyles}>
          <SpinLoaderWithLabel
            progressText={t(
              'schemaValidation.states.loading',
              'Loading Validation'
            )}
          />
        </div>
      )}
      {isLoaded && (
        <>
          {isZeroState && !isRulesGenerationInProgress && (
            <EmptyContent
              icon={ZeroGraphic}
              title={t(
                'schemaValidation.states.createTitle',
                'Create validation rules'
              )}
              subTitle={t(
                'schemaValidation.states.createSubtitle',
                'Generate rules via schema analysis from existing sample data or add them manually to enforce document structure during updates and inserts'
              )}
              callToAction={
                <div className={zeroStateButtonsStyles}>
                  <Button
                    data-testid="generate-rules-button"
                    disabled={!isEditable}
                    onClick={generateValidationRules}
                    variant={ButtonVariant.Primary}
                    size="small"
                  >
                    {t('schemaValidation.states.generate', 'Generate rules')}
                  </Button>
                  <Button
                    data-testid="add-rule-button"
                    disabled={!isEditable}
                    onClick={() => changeZeroState(false)}
                    variant={ButtonVariant.PrimaryOutline}
                    size="small"
                  >
                    {t('schemaValidation.states.addRule', 'Add rule')}
                  </Button>
                </div>
              }
              callToActionLink={
                <Link href={DOC_SCHEMA_VALIDATION} target="_blank">
                  {t(
                    'schemaValidation.states.learnMore',
                    'Learn more about validations'
                  )}
                </Link>
              }
            />
          )}
          {isZeroState && isRulesGenerationInProgress && (
            <GeneratingScreen onCancelClicked={stopRulesGeneration} />
          )}
          {!isZeroState && (
            <div className={contentContainerStyles}>
              <ValidationEditor isEditable={isEditable} />
              <SampleDocuments />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Map the store state to properties to pass to the component.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state: RootState) => ({
  isZeroState: state.isZeroState,
  isLoaded: state.isLoaded,
  editMode: state.editMode,
  isRulesGenerationInProgress: state.rulesGeneration.isInProgress,
  rulesGenerationError: state.rulesGeneration.error,
});

/**
 * Connect the redux store to the component (dispatch).
 */
export default connect(mapStateToProps, {
  changeZeroState,
  generateValidationRules,
  clearRulesGenerationError,
  stopRulesGeneration,
})(ValidationStates);
