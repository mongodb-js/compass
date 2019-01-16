import React from 'react';
import PropTypes from 'prop-types';
import NameColumn from 'components/name-column';
import TypeColumn from 'components/type-column';
import SizeColumn from 'components/size-column';
import UsageColumn from 'components/usage-column';
import PropertyColumn from 'components/property-column';
import DropColumn from 'components/drop-column';

/**
 * Component for the index.
 */
class IndexComponent extends React.Component {

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

IndexComponent.displayName = 'IndexComponent';

IndexComponent.propTypes = {
  index: PropTypes.object.isRequired,
  isReadonly: PropTypes.bool.isRequired
};

export default IndexComponent;
