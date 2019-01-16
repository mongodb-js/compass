import React from 'react';
import PropTypes from 'prop-types';
import CreateIndexModal from 'components/create-index-modal';

/**
 * Component for the create index button.
 */
class CreateIndexButton extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.TextWriteButton = global.hadronApp.appRegistry.getComponent('DeploymentAwareness.TextWriteButton');
    this.state = {
      showModal: false
    };
  }

  /**
   * Show modal when create button is clicked.
   *
   * @param {Object} evt - The click event.
   */
  clickCreateHandler(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.setState({ showModal: true });
  }

  /**
   * Close the modal.
   */
  close() {
    this.setState({ showModal: false });
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
        <CreateIndexModal
          open={this.state.showModal}
          close={this.close.bind(this)} />
      </div>
    );
  }
}

CreateIndexButton.displayName = 'CreateIndexButton';

CreateIndexButton.propTypes = {
  isWritable: PropTypes.bool.isRequired,
  description: PropTypes.string.isRequired
};

export default CreateIndexButton;
