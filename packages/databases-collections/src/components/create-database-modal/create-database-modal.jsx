import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import ConfirmationModal from '@leafygreen-ui/confirmation-modal';
import Banner from '@leafygreen-ui/banner';

import { createDatabase } from '../../modules/create-database';
import { clearError } from '../../modules/error';
import { toggleIsVisible } from '../../modules/is-visible';
import { openLink } from '../../modules/link';
import CollectionFields from '../collection-fields';
import styles from './create-database-modal.less';

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
    openLink: PropTypes.func.isRequired
  }

  state = {
    data: {},
    submitDisabled: true
  };

  /**
   * Called when info is clicked.
   *
   * @param {Object} evt - The event.
   */
  onInfoClicked = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    this.props.openLink(INFO_URL_CREATE_DB);
  }

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
    const submitDisabled = !(data.collection || '').trim() || !(data.database || '').trim();
    this.setState({
      data,
      submitDisabled
    });
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
        variant="info"
      >
        Before MongoDB can save your new database, a collection name
        must also be specified at the time of creation.&nbsp;
        <a onClick={this.onInfoClicked}>More Information</a>
      </Banner>
    );
  }

  /**
   * Render the modal dialog.
   *
   * @returns {React.Component} The react component.
   */
  render() {
    return (
      <ConfirmationModal
        open
        title="Create Database"
        open={this.props.isVisible}
        onConfirm={this.onConfirm}
        onCancel={this.onCancel}
        buttonText="Create Database"
        submitDisabled={this.state.submitDisabled}
        className={styles['create-database-modal']}
      >
        <CollectionFields
          serverVersion={this.props.serverVersion}
          withDatabase
          onChange={this.onChange}
          openLink={this.props.openLink}
        />
        {this.renderCollectionNameRequiredNotice()}
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
  isCapped: state.isCapped,
  isCustomCollation: state.isCustomCollation,
  isRunning: state.isRunning,
  isVisible: state.isVisible,
  name: state.name,
  collation: state.collation,
  collectionName: state.collectionName,
  cappedSize: state.cappedSize,
  serverVersion: state.serverVersion,
  error: state.error
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedCreateDatabaseModal = connect(
  mapStateToProps,
  {
    createDatabase,
    openLink,
    toggleIsVisible,
    clearError
  },
)(CreateDatabaseModal);

export default MappedCreateDatabaseModal;
export { CreateDatabaseModal };
