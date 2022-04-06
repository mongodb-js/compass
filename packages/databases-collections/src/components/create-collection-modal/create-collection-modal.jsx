import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { ConfirmationModal } from '@mongodb-js/compass-components';
import { Banner } from '@mongodb-js/compass-components';

import { createCollection } from '../../modules/create-collection';
import { clearError } from '../../modules/error';
import { toggleIsVisible } from '../../modules/is-visible';

import CollectionFields from '../collection-fields';
import styles from './create-collection-modal.module.less';

class CreateCollectionModal extends PureComponent {
  static propTypes = {
    error: PropTypes.object,
    clearError: PropTypes.func,
    createCollection: PropTypes.func.isRequired,
    isRunning: PropTypes.bool.isRequired,
    isVisible: PropTypes.bool.isRequired,
    serverVersion: PropTypes.string.isRequired,
    toggleIsVisible: PropTypes.func.isRequired
  }

  constructor() {
    super();
    this.state = { data: {} };
  }

  onCancel = () => {
    return this.props.toggleIsVisible(false);
  }

  onConfirm = () => {
    this.props.createCollection(this.state.data);
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

  render() {
    return (
      <ConfirmationModal
        title="Create Collection"
        open={this.props.isVisible}
        onConfirm={this.onConfirm}
        onCancel={this.onCancel}
        buttonText="Create Collection"
        submitDisabled={!((this.state.data.collection || '').trim())}
        className={styles['create-collection-modal']}
        trackingId="create_collection_modal"
      >
        <CollectionFields
          serverVersion={this.props.serverVersion}
          withDatabase={false}
          onChange={this.onChange}
        />
        {this.renderError()}
      </ConfirmationModal>
    );
  }
}

const mapStateToProps = (state) => ({
  isRunning: state.isRunning,
  isVisible: state.isVisible,
  error: state.error,
  serverVersion: state.serverVersion
});

const MappedCreateCollectionModal = connect(
  mapStateToProps,
  {
    createCollection,
    toggleIsVisible,
    clearError
  },
)(CreateCollectionModal);

export default MappedCreateCollectionModal;
export { CreateCollectionModal };
