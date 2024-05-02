import React, { PureComponent } from 'react';
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
import { createView, changeViewName, close } from '../../modules/create-view';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import { withLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import type { CreateViewRootState } from '../../stores/create-view';

const progressContainerStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

type CreateViewModalProps = {
  createView: () => void;
  isVisible?: boolean;
  closeModal: () => void;
  name?: string;
  changeViewName: (name: string) => void;
  isDuplicating?: boolean;
  source?: string;
  pipeline?: unknown[];
  isRunning?: boolean;
  error: Error | null;
  logger: LoggerAndTelemetry;
};

class CreateViewModal extends PureComponent<CreateViewModalProps> {
  static defaultProps = {
    name: '',
    source: '',
    pipeline: [],
    isRunning: false,
    isVisible: false,
    isDuplicating: false,
  };

  componentDidUpdate(prevProps: CreateViewModalProps) {
    if (prevProps.isVisible !== this.props.isVisible && this.props.isVisible) {
      this.props.logger.track('Screen', { name: 'create_view_modal' });
    }
  }

  onNameChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.props.changeViewName(evt.currentTarget.value);
  };

  onFormSubmit = () => {
    this.props.createView();
  };

  onCancel = () => {
    this.props.closeModal();
  };

  /**
   * Render the save pipeline component.
   */
  render() {
    return (
      <FormModal
        title={this.props.isDuplicating ? 'Duplicate View' : 'Create a View'}
        open={this.props.isVisible}
        onSubmit={this.onFormSubmit}
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
 */
const mapStateToProps = (state: CreateViewRootState) => ({
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
const MappedCreateViewModal = withLoggerAndTelemetry(
  connect(mapStateToProps, {
    createView,
    changeViewName,
    closeModal: close,
  })(CreateViewModal),
  'COMPASS-CREATE-VIEW-UI'
);

export default MappedCreateViewModal;
export { CreateViewModal };
