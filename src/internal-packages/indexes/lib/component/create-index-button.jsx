const React = require('react');
const PropTypes = require('prop-types');
const CreateIndexModal = require('./create-index-modal');
const { Tooltip } = require('hadron-react-components');

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
    const tooltipId = 'index-is-not-writable';
    const isNotWritableTooltip = this.props.isWritable ? null : (
      <Tooltip id={tooltipId} />
    );
    const tooltipText = 'This action is not available on a secondary node';

    return (
      <div className="create-index-btn action-bar">
        <div className="tooltip-button-wrapper" data-tip={tooltipText} data-for={tooltipId}>
          <button
            className="btn btn-primary btn-xs"
            type="button"
            data-test-id="open-create-index-modal-button"
            disabled={!this.props.isWritable}
            onClick={this.clickCreateHandler.bind(this)}>
            Create Index
          </button>
        </div>
        {isNotWritableTooltip}
        <CreateIndexModal
          open={this.state.showModal}
          close={this.close.bind(this)} />
      </div>
    );
  }
}

CreateIndexButton.displayName = 'CreateIndexButton';

CreateIndexButton.propTypes = {
  isWritable: PropTypes.bool.isRequired
};

module.exports = CreateIndexButton;
