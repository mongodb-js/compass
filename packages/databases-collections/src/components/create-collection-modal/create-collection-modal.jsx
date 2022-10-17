import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { FormModal } from '@mongodb-js/compass-components';
import { Banner } from '@mongodb-js/compass-components';

import { createCollection } from '../../modules/create-collection';
import { clearError } from '../../modules/error';
import { toggleIsVisible } from '../../modules/is-visible';

import CollectionFields from '../collection-fields';

class CreateCollectionModal extends PureComponent {
  static propTypes = {
    error: PropTypes.object,
    clearError: PropTypes.func,
    createCollection: PropTypes.func.isRequired,
    isRunning: PropTypes.bool.isRequired,
    isVisible: PropTypes.bool.isRequired,
    serverVersion: PropTypes.string.isRequired,
    toggleIsVisible: PropTypes.func.isRequired,
    configuredKMSProviders: PropTypes.array,
    currentTopologyType: PropTypes.string
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
      <FormModal
        title="Create Collection"
        open={this.props.isVisible}
        onSubmit={this.onConfirm}
        onCancel={this.onCancel}
        submitButtonText="Create Collection"
        submitDisabled={!((this.state.data.collection || '').trim())}
        trackingId="create_collection_modal"
        data-testid="create-collection-modal"
      >
        <CollectionFields
          serverVersion={this.props.serverVersion}
          withDatabase={false}
          onChange={this.onChange}
          configuredKMSProviders={this.props.configuredKMSProviders}
          currentTopologyType={this.props.currentTopologyType}
        />
        {this.renderError()}
      </FormModal>
    );
  }
}

const mapStateToProps = (state) => ({
  isRunning: state.isRunning,
  isVisible: state.isVisible,
  error: state.error,
  serverVersion: state.serverVersion,
  configuredKMSProviders: state.dataService.configuredKMSProviders,
  currentTopologyType: state.dataService.currentTopologyType
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
