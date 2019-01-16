import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import CreateIndexModal from 'components/create-index-modal';
import createIndexStore from 'stores/create-index';

/**
 * Component for the create index button.
 */
class CreateIndexButton extends PureComponent {
  static displayName = 'CreateIndexButton';
  static propTypes = {
    toggleIsVisible: PropTypes.func.isRequired
  };

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.TextWriteButton = global.hadronApp.appRegistry.getComponent(
      'DeploymentAwareness.TextWriteButton'
    );
  }

  /**
   * Show modal when create button is clicked.
   *
   * @param {Object} evt - The click event.
   */
  clickCreateHandler(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    createIndexStore.dispatch(this.props.toggleIsVisible(true));
  }

  /**
   * Render the create index button.
   *
   * @returns {React.Component} The create index button.
   */
  render() {
    return (
      <div className="create-index-btn action-bar">
        <this.TextWriteButton
          className="btn btn-primary btn-xs"
          dataTestId="open-create-index-modal-button"
          isCollectionLevel
          text="Create Index"
          tooltipId="index-is-not-writable"
          clickHandler={this.clickCreateHandler.bind(this)} />
        <Provider store={createIndexStore}>
          <CreateIndexModal />
        </Provider>
      </div>
    );
  }
}

export default CreateIndexButton;
