import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import {
  Banner,
  Body,
  FormModal,
  SpinLoader,
  css,
  spacing,
  TextInput,
} from '@mongodb-js/compass-components';

import { createView } from '../../modules/create-view';
import { changeViewName } from '../../modules/create-view/name';
import { toggleIsVisible } from '../../modules/create-view/is-visible';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

const progressContainerStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

class CreateViewModal extends PureComponent {
  static displayName = 'CreateViewModalComponent';

  static propTypes = {
    createView: PropTypes.func.isRequired,

    isVisible: PropTypes.bool.isRequired,
    toggleIsVisible: PropTypes.func.isRequired,

    name: PropTypes.string,
    changeViewName: PropTypes.func.isRequired,
    isDuplicating: PropTypes.bool.isRequired,

    source: PropTypes.string.isRequired,
    pipeline: PropTypes.array.isRequired,
    isRunning: PropTypes.bool.isRequired,
    error: PropTypes.object,
  };

  static defaultProps = {
    name: '',
    source: '',
    pipeline: [],
    isRunning: false,
    isVisible: false,
    isDuplicating: false,
  };

  componentDidUpdate(prevProps) {
    if (prevProps.isVisible !== this.props.isVisible && this.props.isVisible) {
      track('Screen', { name: 'create_view_modal' });
    }
  }

  onNameChange = (evt) => {
    this.props.changeViewName(evt.target.value);
  };

  onFormSubmit = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    this.props.createView();
  };

  onCancel = () => {
    this.props.toggleIsVisible(false);
  };

  /**
   * Render the save pipeline component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <FormModal
        title={this.props.isDuplicating ? 'Duplicate View' : 'Create a View'}
        open={this.props.isVisible}
        onSubmit={this.props.createView}
        onCancel={this.onCancel}
        submitButtonText="Create"
        data-testid="create-view-modal"
      >
        <TextInput
          data-testid="create-view-name"
          value={this.props.name || ''}
          onChange={this.onNameChange}
          label="Name"
          name="name"
        />
        {this.props.error ? (
          <Banner variant="danger">{this.props.error.message}</Banner>
        ) : null}
        {this.props.isRunning ? (
          <Body className={progressContainerStyles}>
            <SpinLoader />
            <span>Creating view&hellip;</span>
          </Body>
        ) : null}
      </FormModal>
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
  isDuplicating: state.isDuplicating,
  name: state.name,
  error: state.error,
  source: state.source,
  pipeline: state.pipeline,
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedCreateViewModal = connect(mapStateToProps, {
  createView,
  changeViewName,
  toggleIsVisible,
})(CreateViewModal);

export default MappedCreateViewModal;
export { CreateViewModal };
