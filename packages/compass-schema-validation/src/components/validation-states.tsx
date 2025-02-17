import React from 'react';
import {
  Banner,
  Button,
  ButtonVariant,
  EmptyContent,
  Link,
  WarningSummary,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { usePreference } from 'compass-preferences-model/provider';
import { changeZeroState } from '../modules/zero-state';
import type { RootState } from '../modules';
import ValidationEditor from './validation-editor';
import { SampleDocuments } from './sample-documents';
import { ZeroGraphic } from './zero-graphic';

const validationStatesStyles = css({ padding: spacing[3] });
const contentContainerStyles = css({ height: '100%' });

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
  isLoaded: boolean;
  changeZeroState: (value: boolean) => void;
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

export function ValidationStates({
  isZeroState,
  isLoaded,
  changeZeroState,
  editMode,
}: ValidationStatesProps) {
  const readOnly = usePreference('readOnly');

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
      <ValidationBanners editMode={editMode} />
      {isLoaded && (
        <>
          {isZeroState ? (
            <EmptyContent
              icon={ZeroGraphic}
              title="Add validation rules"
              subTitle="Create rules to enforce data structure of documents on updates and inserts."
              callToAction={
                <Button
                  data-testid="add-rule-button"
                  disabled={!isEditable}
                  onClick={() => changeZeroState(false)}
                  variant={ButtonVariant.Primary}
                  size="small"
                >
                  Add Rule
                </Button>
              }
              callToActionLink={
                <Link href={DOC_SCHEMA_VALIDATION} target="_blank">
                  Learn more about validations
                </Link>
              }
            />
          ) : (
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
});

/**
 * Connect the redux store to the component (dispatch).
 */
export default connect(mapStateToProps, {
  changeZeroState,
})(ValidationStates);
