const React = require('react');
const PropTypes = require('prop-types');
const NameColumn = require('./name-column');
const TypeColumn = require('./type-column');
const SizeColumn = require('./size-column');
const UsageColumn = require('./usage-column');
const PropertyColumn = require('./property-column');
const DropColumn = require('./drop-column');

/**
 * Component for the index.
 */
class Index extends React.Component {

  constructor(props) {
    super(props);
    const appRegistry = global.hadronApp.appRegistry;
    this.CollectionStore = appRegistry.getStore('App.CollectionStore');
    this.WriteStateStore = appRegistry.getStore('DeploymentAwareness.WriteStateStore');
    this.state = this.WriteStateStore.state;
  }

  componentDidMount() {
    this.unsubscribeStateStore = this.WriteStateStore.listen(this.deploymentStateChanged.bind(this));
  }

  componentWillUnmount() {
    this.unsubscribeStateStore();
  }

  /**
   * Called when the deployment state changes.
   *
   * @param {Object} state - The deployment state.
   */
  deploymentStateChanged(state) {
    this.setState(state);
  }

  isWritable() {
    return !this.CollectionStore.isReadonly() &&
      this.state.isWritable &&
      !this.props.isReadonly;
  }

  /**
   * Render the index.
   *
   * @returns {React.Component} The index.
   */
  render() {
    return (
      <tr>
        <NameColumn index={this.props.index} />
        <TypeColumn index={this.props.index} />
        <SizeColumn
          size={this.props.index.size}
          relativeSize={this.props.index.relativeSize} />
        <UsageColumn usage={this.props.index.usageCount} since={this.props.index.usageSince} />
        <PropertyColumn index={this.props.index} />
        <DropColumn indexName={this.props.index.name} isReadonly={!this.isWritable()} />
      </tr>
    );
  }
}

Index.displayName = 'Index';

Index.propTypes = {
  index: PropTypes.object.isRequired,
  isReadonly: PropTypes.bool.isRequired
};

module.exports = Index;
