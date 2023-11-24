import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Banner,
  Button,
  ButtonVariant,
  EmptyContent,
  Link,
  WarningSummary,
  WorkspaceContainer,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import ValidationEditor from '../validation-editor';
import SampleDocuments from '../sample-documents';
import { ZeroGraphic } from '../zero-graphic';
import type { ValidationEditorProps } from '../validation-editor/validation-editor';

const validationStatesStyles = css({ padding: spacing[3] });
const contentContainerStyles = css({ height: '100%' });

/**
 * Warnings for the banner.
 */
export const READ_ONLY_WARNING = {
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

export interface ValidationStatesProps
  extends Omit<ValidationEditorProps, 'isEditable'> {
  isZeroState: boolean;
  isLoaded: boolean;
  changeZeroState: (value: boolean) => void;
  editMode: {
    collectionTimeSeries?: boolean;
    collectionReadOnly?: boolean;
    writeStateStoreReadOnly?: boolean;
    oldServerReadOnly?: boolean;
  };
  readOnly: boolean;
}

/**
 * The ValidationStates component.
 */
class ValidationStates extends Component<ValidationStatesProps> {
  static displayName = 'ValidationStates';

  static propTypes = {
    isZeroState: PropTypes.bool.isRequired,
    isLoaded: PropTypes.bool.isRequired,
    changeZeroState: PropTypes.func.isRequired,
    editMode: PropTypes.object.isRequired,
    serverVersion: PropTypes.string,
    readOnly: PropTypes.bool,
  };

  renderBanner() {
    if (this.props.editMode.collectionTimeSeries) {
      return (
        <WarningSummary
          warnings={READ_ONLY_WARNING.collectionTimeSeries}
          data-testid="collection-validation-warning"
        />
      );
    }

    if (this.props.editMode.collectionReadOnly) {
      return (
        <WarningSummary
          warnings={READ_ONLY_WARNING.collectionReadOnly}
          data-testid="collection-validation-warning"
        />
      );
    }

    if (this.props.editMode.writeStateStoreReadOnly) {
      return (
        <WarningSummary
          warnings={READ_ONLY_WARNING.writeStateStoreReadOnly}
          data-testid="collection-validation-warning"
        />
      );
    }

    if (this.props.editMode.oldServerReadOnly) {
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
  }

  isEditable() {
    return (
      !this.props.editMode.collectionReadOnly &&
      !this.props.editMode.collectionTimeSeries &&
      !this.props.editMode.writeStateStoreReadOnly &&
      !this.props.editMode.oldServerReadOnly &&
      !this.props.readOnly
    );
  }

  /**
   * Renders the schema validation zero state.
   */
  renderZeroState() {
    if (!this.props.isZeroState) {
      return;
    }

    if (!this.props.isLoaded) {
      // Don't display the form until we finished fetching validation because that would be misleading.
      return;
    }

    return (
      <EmptyContent
        icon={ZeroGraphic}
        title="Add validation rules"
        subTitle="Create rules to enforce data structure of documents on updates and inserts."
        callToAction={
          <Button
            data-testid="add-rule-button"
            disabled={!this.isEditable()}
            onClick={this.props.changeZeroState.bind(this, false)}
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
    );
  }

  /**
   * Renders the schema validation content.
   */
  renderContent() {
    if (this.props.isZeroState) {
      return;
    }

    if (!this.props.isLoaded) {
      return;
    }

    return (
      <div className={contentContainerStyles}>
        <ValidationEditor {...this.props} isEditable={this.isEditable()} />
        <SampleDocuments />
      </div>
    );
  }

  /**
   * Renders the ValidationStates component.
   */
  render() {
    return (
      <WorkspaceContainer>
        <div
          className={validationStatesStyles}
          data-testid="schema-validation-states"
        >
          {this.renderBanner()}
          {this.renderZeroState()}
          {this.renderContent()}
        </div>
      </WorkspaceContainer>
    );
  }
}

export default ValidationStates;
