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
import { nameChanged } from '../../modules/create-index/name';
import { changeSchemaFields } from '../../modules/create-index/schema-fields';
import {
  createNewIndexField,
  clearNewIndexField,
} from '../../modules/create-index/new-index-field';
import { clearError, handleError } from '../../modules/error';
import { toggleIsVisible } from '../../modules/is-visible';
import { toggleIsUnique } from '../../modules/create-index/is-unique';
import { toggleUsePartialFilterExpression } from '../../modules/create-index/use-partial-filter-expression';
import { toggleUseTtl } from '../../modules/create-index/use-ttl';
import { ttlChanged } from '../../modules/create-index/ttl';
import { toggleUseWildcardProjection } from '../../modules/create-index/use-wildcard-projection';
import { toggleUseColumnstoreProjection } from '../../modules/create-index/use-columnstore-projection';
import { wildcardProjectionChanged } from '../../modules/create-index/wildcard-projection';
import { columnstoreProjectionChanged } from '../../modules/create-index/columnstore-projection';
import { partialFilterExpressionChanged } from '../../modules/create-index/partial-filter-expression';
import { toggleUseCustomCollation } from '../../modules/create-index/use-custom-collation';
import { collationStringChanged } from '../../modules/create-index/collation-string';
import { openLink } from '../../modules/link';
import { createIndex } from '../../modules/create-index';
import { resetForm } from '../../modules/reset-form';
import type { CreateIndexProps } from '../create-index-form';
import CreateIndexForm from '../create-index-form';
import { toggleUseIndexName } from '../../modules/create-index/use-index-name';

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
  useTtl: state.useTtl,
  ttl: state.ttl,
  useWildcardProjection: state.useWildcardProjection,
  useColumnstoreProjection: state.useColumnstoreProjection,
  columnstoreProjection: state.columnstoreProjection,
  wildcardProjection: state.wildcardProjection,
  isUnique: state.isUnique,
  usePartialFilterExpression: state.usePartialFilterExpression,
  partialFilterExpression: state.partialFilterExpression,
  useCustomCollation: state.useCustomCollation,
  useIndexName: state.useIndexName,
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
  toggleUseTtl,
  toggleUseWildcardProjection,
  toggleUseColumnstoreProjection,
  toggleIsUnique,
  toggleUsePartialFilterExpression,
  toggleUseCustomCollation,
  toggleUseIndexName,
  partialFilterExpressionChanged,
  ttlChanged,
  wildcardProjectionChanged,
  columnstoreProjectionChanged,
  collationStringChanged,
  createNewIndexField,
  clearNewIndexField,
  openLink,
  nameChanged,
  createIndex,
  resetForm,
  addField,
  removeField,
  updateFieldName,
  updateFieldType,
})(CreateIndexModal);

export default MappedCreateIndexModal;
export { CreateIndexModal };
