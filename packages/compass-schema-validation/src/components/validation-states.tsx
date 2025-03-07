import React from 'react';
import {
  Banner,
  BannerVariant,
  Button,
  ButtonVariant,
  CancelLoader,
  EmptyContent,
  ErrorSummary,
  Link,
  WarningSummary,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { usePreferences } from 'compass-preferences-model/provider';
import { changeZeroState } from '../modules/zero-state';
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
import { DISTINCT_FIELDS_ABORT_THRESHOLD } from '@mongodb-js/compass-schema';

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
 * Warnings for the banner.
 */
const READ_ONLY_WARNING = {
  collectionTimeSeries:
    'Schema validation for time-series collections is not supported.',
  collectionReadOnly: 'Schema validation for readonly views is not supported.',
  writeStateStoreReadOnly: 'This action is not available on a secondary node.',
  oldServerReadOnly:
    'Compass no longer supports the visual rule builder for server versions below 3.2. To use the visual rule builder, please',
};

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
  editMode: {
    collectionTimeSeries?: boolean;
    collectionReadOnly?: boolean;
    writeStateStoreReadOnly?: boolean;
    oldServerReadOnly?: boolean;
  };
};

function ValidationBanners({
  editMode,
}: {
  editMode: ValidationStatesProps['editMode'];
}) {
  if (editMode.collectionTimeSeries) {
    return (
      <WarningSummary
        warnings={READ_ONLY_WARNING.collectionTimeSeries}
        data-testid="collection-validation-warning"
      />
    );
  }

  if (editMode.collectionReadOnly) {
    return (
      <WarningSummary
        warnings={READ_ONLY_WARNING.collectionReadOnly}
        data-testid="collection-validation-warning"
      />
    );
  }

  if (editMode.writeStateStoreReadOnly) {
    return (
      <WarningSummary
        warnings={READ_ONLY_WARNING.writeStateStoreReadOnly}
        data-testid="collection-validation-warning"
      />
    );
  }

  if (editMode.oldServerReadOnly) {
    return (
      <Banner variant="warning">
        <div data-testid="old-server-read-only">
          {READ_ONLY_WARNING.oldServerReadOnly}&nbsp;
          <Link target="_blank" href={DOC_UPGRADE_REVISION}>
            upgrade to MongoDB 3.2.
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
  return (
    <div className={loaderStyles}>
      <CancelLoader
        data-testid="generating-rules"
        progressText="Generating rules"
        cancelText="Stop"
        onCancel={onCancelClicked}
      />
    </div>
  );
};

const RulesGenerationErrorBanner: React.FunctionComponent<{
  error: RulesGenerationError;
  onDismissError: () => void;
}> = ({ error, onDismissError }) => {
  if (error?.errorType === 'timeout') {
    return (
      <WarningSummary
        data-testid="rules-generation-timeout-message"
        warnings={[
          'Operation exceeded time limit. Please try increasing the maxTimeMS for the query in the filter options.',
        ]}
        dismissible={true}
        onClose={onDismissError}
      />
    );
  }
  if (error?.errorType === 'highComplexity') {
    return (
      <Banner
        variant={BannerVariant.Danger}
        data-testid="rules-generation-complexity-abort-message"
        dismissible={true}
        onClose={onDismissError}
      >
        The rules generation was aborted because the number of fields exceeds{' '}
        {DISTINCT_FIELDS_ABORT_THRESHOLD}. Consider breaking up your data into
        more collections with smaller documents, and using references to
        consolidate the data you need.&nbsp;
        <Link href="https://www.mongodb.com/docs/manual/data-modeling/design-antipatterns/bloated-documents/">
          Learn more
        </Link>
      </Banner>
    );
  }

  return (
    <ErrorSummary
      data-testid="rules-generation-error-message"
      errors={[`Error occured during rules generation: ${error.errorMessage}`]}
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
  const { readOnly, enableExportSchema } = usePreferences([
    'readOnly',
    'enableExportSchema',
  ]);

  const isEditable =
    !editMode.collectionReadOnly &&
    !editMode.collectionTimeSeries &&
    !editMode.writeStateStoreReadOnly &&
    !editMode.oldServerReadOnly &&
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
      {isLoaded && (
        <>
          {isZeroState && !isRulesGenerationInProgress && (
            <EmptyContent
              icon={ZeroGraphic}
              title="Create validation rules"
              subTitle={
                enableExportSchema
                  ? 'Generate rules via schema analysis from existing sample data or add them manually to enforce document structure during updates and inserts'
                  : 'Create rules to enforce data structure of documents on updates and inserts.'
              }
              callToAction={
                <div className={zeroStateButtonsStyles}>
                  {enableExportSchema && (
                    <Button
                      data-testid="generate-rules-button"
                      disabled={!isEditable}
                      onClick={generateValidationRules}
                      variant={ButtonVariant.Primary}
                      size="small"
                    >
                      Generate rules
                    </Button>
                  )}
                  <Button
                    data-testid="add-rule-button"
                    disabled={!isEditable}
                    onClick={() => changeZeroState(false)}
                    variant={ButtonVariant.PrimaryOutline}
                    size="small"
                  >
                    Add Rule
                  </Button>
                </div>
              }
              callToActionLink={
                <Link href={DOC_SCHEMA_VALIDATION} target="_blank">
                  Learn more about validations
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
