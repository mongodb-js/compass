import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import {
  ConfirmationModal,
  Banner,
  Disclaimer,
  css,
  spacing,
} from '@mongodb-js/compass-components';

import { toggleInProgress } from '../../modules/in-progress';
import {
  addField,
  removeField,
  updateFieldType,
  updateFieldName,
} from '../../modules/create-index/fields';
import { changeName } from '../../modules/create-index/name';
import { changeSchemaFields } from '../../modules/create-index/schema-fields';
import {
  createNewIndexField,
  clearNewIndexField,
} from '../../modules/create-index/new-index-field';
import { clearError, handleError } from '../../modules/error';
import { toggleIsVisible } from '../../modules/is-visible';
import { toggleIsUnique } from '../../modules/create-index/is-unique';
import { toggleIsPartialFilterExpression } from '../../modules/create-index/is-partial-filter-expression';
import { toggleIsTtl } from '../../modules/create-index/is-ttl';
import { changeTtl } from '../../modules/create-index/ttl';
import { toggleHasWildcardProjection } from '../../modules/create-index/has-wildcard-projection';
import { toggleHasColumnstoreProjection } from '../../modules/create-index/has-columnstore-projection';
import { wildcardProjectionChanged } from '../../modules/create-index/wildcard-projection';
import { columnstoreProjectionChanged } from '../../modules/create-index/columnstore-projection';
import { changePartialFilterExpression } from '../../modules/create-index/partial-filter-expression';
import { toggleIsCustomCollation } from '../../modules/create-index/is-custom-collation';
import { collationStringChanged } from '../../modules/create-index/collation-string';
import { openLink } from '../../modules/link';
import { createIndex } from '../../modules/create-index';
import { resetForm } from '../../modules/reset-form';
import type { CreateIndexProps } from '../create-index-form';
import CreateIndexForm from '../create-index-form';
import { toggleHasIndexName } from '../../modules/create-index/has-index-name';

const { track } = createLoggerAndTelemetry('COMPASS-IMPORT-EXPORT-UI');

const bannerStyles = css({
  marginTop: spacing[3],
});

/**
 * Component for the create index modal.
 */
class CreateIndexModal extends PureComponent<
  Omit<CreateIndexProps, 'darkMode'>
> {
  static displayName = 'CreateIndexModal';

  handleShow() {
    track('Screen', { name: 'create_index_modal' });
  }

  /**
   * Close modal and fire clear create index form action.
   */
  handleClose() {
    this.props.toggleIsVisible(false);
    this.props.resetForm();
  }

  onConfirm = () => {
    this.props.createIndex();
  };

  onCancel = () => {
    return this.props.toggleIsVisible(false);
  };

  renderError() {
    if (!this.props.error) {
      return;
    }

    return (
      <Banner
        className={bannerStyles}
        variant="danger"
        dismissible
        onClose={this.props.clearError}
      >
        {this.props.error}
      </Banner>
    );
  }

  renderInProgress() {
    if (!this.props.error || !this.props.inProgress) {
      return;
    }

    return (
      <Banner className={bannerStyles} variant="info" dismissible>
        Create in Progress
      </Banner>
    );
  }

  /**
   * Render the create index modal.
   *
   * @returns {React.Component} The create index modal.
   */
  render() {
    return (
      <ConfirmationModal
        title="Create Index"
        open={this.props.isVisible}
        onConfirm={this.onConfirm}
        onCancel={this.onCancel}
        buttonText="Create Index"
        trackingId="create_index_modal"
      >
        <Disclaimer>{this.props.namespace}</Disclaimer>
        <CreateIndexForm {...this.props} />
        {this.renderError()}
        {this.renderInProgress()}
      </ConfirmationModal>
    );
  }
}

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state: any) => ({
  fields: state.fields,
  inProgress: state.inProgress,
  schemaFields: state.schemaFields,
  error: state.error,
  isVisible: state.isVisible,
  isTtl: state.isTtl,
  ttl: state.ttl,
  hasWildcardProjection: state.hasWildcardProjection,
  hasColumnstoreProjection: state.hasColumnstoreProjection,
  columnstoreProjection: state.columnstoreProjection,
  wildcardProjection: state.wildcardProjection,
  isUnique: state.isUnique,
  isPartialFilterExpression: state.isPartialFilterExpression,
  partialFilterExpression: state.partialFilterExpression,
  isCustomCollation: state.isCustomCollation,
  hasIndexName: state.hasIndexName,
  collationString: state.collationString,
  name: state.name,
  namespace: state.namespace,
  serverVersion: state.serverVersion,
  newIndexField: state.newIndexField,
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedCreateIndexModal = connect(mapStateToProps, {
  toggleInProgress,
  changeSchemaFields,
  clearError,
  handleError,
  toggleIsVisible,
  toggleIsTtl,
  toggleHasWildcardProjection,
  toggleHasColumnstoreProjection,
  toggleIsUnique,
  toggleIsPartialFilterExpression,
  toggleIsCustomCollation,
  toggleHasIndexName,
  changePartialFilterExpression,
  changeTtl,
  wildcardProjectionChanged,
  columnstoreProjectionChanged,
  collationStringChanged,
  createNewIndexField,
  clearNewIndexField,
  openLink,
  changeName,
  createIndex,
  resetForm,
  addField,
  removeField,
  updateFieldName,
  updateFieldType,
})(CreateIndexModal);

export default MappedCreateIndexModal;
export { CreateIndexModal };
