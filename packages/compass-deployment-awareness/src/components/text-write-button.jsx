const React = require('react');
const PropTypes = require('prop-types');
const { TextButton } = require('hadron-react-buttons');
const { Tooltip } = require('hadron-react-components');
const WriteStateStore = require('../stores/write-state-store');

/**
 * The collection store name.
 */
const COLLECTION_STORE = 'App.CollectionStore';

/**
 * The readonly collection message.
 */
const READONLY = 'Write operations are not permitted on readonly collections.';

/**
 * The wrapper class.
 */
const WRAPPER = 'tooltip-button-wrapper';

/**
 * Button component that is aware of the write state of the application.
 * This button contains only text, no icons, no animations.
 */
class TextWriteButton extends React.Component {

  /**
   * Instantiate the component.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.CollectionStore = global.hadronApp.appRegistry.getStore(COLLECTION_STORE);
  }

  /**
   * Subscribe to the state changing stores.
   */
  componentDidMount() {
    global.hadronApp.appRegistry.on('namespace-changed', this.namespaceChanged.bind(this));
    this.unsubscribeWriteState = WriteStateStore.listen(this.writeStateChanged.bind(this));
  }

  /**
   * Unsubscribe from the stores.
   */
  componentWillUnmount() {
    this.unsubscribeNamespace();
    this.unsubscribeWriteState();
  }

  /**
   * Determine if the application is in a writable state.
   *
   * @returns {Boolean} If the application is writable.
   */
  isWritable() {
    const isWritable = WriteStateStore.state.isWritable;
    if (!this.props.isCollectionLevel) {
      return isWritable;
    }
    return isWritable && !this.CollectionStore.isReadonly();
  }

  /**
   * Handle namespace changes.
   */
  namespaceChanged() {
    this.forceUpdate();
  }

  /**
   * Handle write state changes.
   *
   * @param {Object} state - The write state.
   */
  writeStateChanged(state) {
    this.setState(state);
  }

  /**
   * Get the tooltip text.
   *
   * @returns {String} The tooltip text.
   */
  tooltipText() {
    if (!this.isWritable()) {
      if (this.props.isCollectionLevel && this.CollectionStore.isReadonly()) {
        return READONLY;
      }
      return WriteStateStore.state.description;
    }
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const tooltip = (this.isWritable()) ? null : (<Tooltip id={this.props.tooltipId} />);
    return (
      <div className={WRAPPER} data-tip={this.tooltipText()} data-for={this.props.tooltipId}>
        <TextButton
          className={this.props.className}
          dataTestId={this.props.dataTestId}
          disabled={!this.isWritable()}
          clickHandler={this.props.clickHandler}
          text={this.props.text} />
        {tooltip}
      </div>
    );
  }
}

TextWriteButton.propTypes = {
  className: PropTypes.string.isRequired,
  clickHandler: PropTypes.func.isRequired,
  dataTestId: PropTypes.string,
  isCollectionLevel: PropTypes.bool,
  text: PropTypes.string.isRequired,
  tooltipId: PropTypes.string.isRequired
};

TextWriteButton.displayName = 'TextWriteButton';

module.exports = TextWriteButton;
