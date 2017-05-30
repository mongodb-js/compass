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
    this.DeploymentStateStore = appRegistry.getStore('DeploymentAwareness.DeploymentStateStore');
    this.state = this.DeploymentStateStore.state;
  }

  componentDidMount() {
    this.unsubscribeStateStore = this.DeploymentStateStore.listen(this.deploymentStateChanged.bind(this));
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
        {(!this.CollectionStore.isReadonly() && this.state.isWritable) ?
          <DropColumn indexName={this.props.index.name} />
          : null}
      </tr>
    );
  }
}

Index.displayName = 'Index';

Index.propTypes = {
  index: PropTypes.object.isRequired
};

module.exports = Index;
