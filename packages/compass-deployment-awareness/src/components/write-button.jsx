const React = require('react');
const PropTypes = require('prop-types');
const WriteStateStore = require('../stores/write-state-store');

const BUTTON = 'button';
const COLLECTION_STORE = 'App.CollectionStore';
const NAMESPACE_STORE = 'App.NamespaceStore';
const WRAPPER = 'tooltip-button-wrapper';

class WriteButton extends React.Component {

  constructor(props) {
    super(props);
    this.CollectionStore = global.hadronApp.appRegistry.getStore(COLLECTION_STORE);
    this.NamespaceStore = global.hadronApp.appRegistry.getStore(NAMESPACE_STORE);
  }

  componentDidMount() {
    this.unsubscribeNamespace = this.NamespaceStore.listen(this.namespaceChanged.bind(this));
    this.unsubscribeWriteState = WriteStateStore.listen(this.writeStateChanged.bind(this));
  }

  componentWillUnmount() {
    this.unsubscribeNamespace();
    this.unsubscribeWriteState();
  }

  isWritable() {
    const isWritable = WriteStateStore.state.isWritable;
    if (!this.props.isCollectionLevel) {
      return isWritable;
    }
    return isWritable && !this.CollectionStore.isReadonly();
  }

  namespaceChanged() {
    this.setState(this.state);
  }

  writeStateChanged(state) {
    this.setState(state);
  }

  render() {
    const tooltipText = '';
    const tooltipId = '';

    return (
      <div className={WRAPPER} data-tip={tooltipText} data-for={tooltipId}>
        <button
          className={this.props.className}
          type={BUTTON}
          data-test-id={this.props.dataTestId}
          disabled={!this.isWritable()}
          onClick={this.props.clickHandler}>
          {this.props.text}
        </button>
      </div>
    );
  }
}

WriteButton.propTypes = {
  className: PropTypes.string.isRequired,
  clickHandler: PropTypes.func.isRequired,
  dataTestId: PropTypes.string,
  isCollectionLevel: PropTypes.bool,
  text: PropTypes.string.isRequired
};

WriteButton.displayName = 'WriteButton';

module.exports = WriteButton;
