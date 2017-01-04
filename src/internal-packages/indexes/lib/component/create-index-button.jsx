const React = require('react');
const CreateIndexModal = require('./create-index-modal');
const ReactTooltip = require('react-tooltip');

const TOOLTIP_ID = 'create-index';

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
    const tooltipText = 'This action is not available on a secondary node.';
    const tooltipOptions = {
      'data-tip': tooltipText,
      'data-for': TOOLTIP_ID,
      'data-effect': 'solid',
      'data-class': 'secondary-tooltip',
      'data-place': 'right',
      'data-offset': '{"left": 900}'
    };

    return (
      <div className="create-index-btn action-bar" {...tooltipOptions}>
        <button
          className="btn btn-primary btn-xs"
          type="button"
          data-test-id="open-create-index-modal-button"
          disabled={!this.props.isWritable}
          onClick={this.clickCreateHandler.bind(this)}>
          Create Index
        </button>
        {this.props.isWritable ? null : <ReactTooltip id={TOOLTIP_ID}/>}
        <CreateIndexModal
          open={this.state.showModal}
          close={this.close.bind(this)} />
      </div>
    );
  }
}

CreateIndexButton.displayName = 'CreateIndexButton';

CreateIndexButton.propTypes = {
  isWritable: React.PropTypes.bool.isRequired
};

module.exports = CreateIndexButton;
