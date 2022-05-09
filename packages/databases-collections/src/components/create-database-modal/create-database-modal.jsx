import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Banner, ConfirmationModal, Link } from '@mongodb-js/compass-components';

import { createDatabase } from '../../modules/create-database';
import { clearError } from '../../modules/error';
import { toggleIsVisible } from '../../modules/is-visible';
import CollectionFields from '../collection-fields';
import styles from './create-database-modal.module.less';

// The more information url.
const INFO_URL_CREATE_DB =
  'https://docs.mongodb.com/manual/faq/fundamentals/#how-do-i-create-a-database-and-a-collection';

/**
 * The modal to create a database.
 */
class CreateDatabaseModal extends PureComponent {
  static displayName = 'CreateDatabaseModalComponent';

  static propTypes = {
    isRunning: PropTypes.bool.isRequired,
    isVisible: PropTypes.bool.isRequired,
    error: PropTypes.object,
    createDatabase: PropTypes.func.isRequired,
    toggleIsVisible: PropTypes.func.isRequired,
    clearError: PropTypes.func.isRequired,
    serverVersion: PropTypes.string.isRequired,
    configuredKMSProviders: PropTypes.array,
    currentTopologyType: PropTypes.string
  }

  state = {
    data: {}
  };

  /**
   * Called when the error message close icon is clicked.
   */
  onDismissErrorMessage = () => {
    this.props.clearError();
  }

  onCancel = () => {
    return this.props.toggleIsVisible(false);
  }

  onConfirm = () => {
    this.props.createDatabase(this.state.data);
  }

  onChange = (data) => {
    this.setState({ data });
  }

  renderError() {
    if (!this.props.error) {
      return;
    }

    return (
      <Banner
        variant="danger"
        dismissible
        onClose={this.props.clearError}
      >
        {this.props.error.message}
      </Banner>
    );
  }

  renderCollectionNameRequiredNotice() {
    return (
      <Banner
        className={styles['collection-name-info-banner']}
        variant="info"
      >
        Before MongoDB can save your new database, a collection name
        must also be specified at the time of creation.&nbsp;
        <Link
          href={INFO_URL_CREATE_DB}
          target="_blank"
        >More Information</Link>
      </Banner>
    );
  }

  /**
   * Render the modal dialog.
   *
   * @returns {React.Component} The react component.
   */
  render() {
    const hasCollectionName = !!(this.state.data.collection || '').trim();

    return (
      <ConfirmationModal
        title="Create Database"
        open={this.props.isVisible}
        onConfirm={this.onConfirm}
        onCancel={this.onCancel}
        buttonText="Create Database"
        submitDisabled={(
          !hasCollectionName ||
          !(this.state.data.database || '').trim()
        )}
        className={styles['create-database-modal']}
        trackingId="create_database_modal"
      >
        <CollectionFields
          serverVersion={this.props.serverVersion}
          withDatabase
          onChange={this.onChange}
          configuredKMSProviders={this.props.configuredKMSProviders}
          currentTopologyType={this.props.currentTopologyType}
        />
        {!hasCollectionName && this.renderCollectionNameRequiredNotice()}
        {this.renderError()}
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
const mapStateToProps = (state) => ({
  isRunning: state.isRunning,
  isVisible: state.isVisible,
  error: state.error,
  serverVersion: state.serverVersion,
  configuredKMSProviders: state.dataService.configuredKMSProviders,
  currentTopologyType: state.dataService.currentTopologyType
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedCreateDatabaseModal = connect(
  mapStateToProps,
  {
    createDatabase,
    toggleIsVisible,
    clearError
  },
)(CreateDatabaseModal);

export default MappedCreateDatabaseModal;
export { CreateDatabaseModal };
