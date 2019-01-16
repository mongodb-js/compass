import React from 'react';
import { StatusRow } from 'hadron-react-components';
import IndexHeader from 'components/index-header';
import IndexList from 'components/index-list';
import CreateIndexButton from 'components/create-index-button';
import { LoadIndexesStore } from 'stores';

/**
 * Component for the indexes.
 */
class Indexes extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    const appRegistry = global.hadronApp.appRegistry;
    this.CollectionStore = appRegistry.getStore('App.CollectionStore');
    this.WriteStateStore = appRegistry.getStore('DeploymentAwareness.WriteStateStore');
    this.state = this.determineState();
  }

  /**
   * Subscribe on mount.
   */
  componentWillMount() {
    this.unsubscribeLoad = LoadIndexesStore.listen(this.handleLoad.bind(this));
    this.unsubscribeStateStore = this.WriteStateStore.listen(this.deploymentStateChanged.bind(this));
  }

  /**
   * Unsubscribe on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeLoad();
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

  determineState(error) {
    return {
      isWritable: this.WriteStateStore.state.isWritable,
      isReadonly: this.CollectionStore.isReadonly(),
      description: this.WriteStateStore.state.description,
      error: error
    };
  }

  handleLoad(indexes, error) {
    this.setState(this.determineState(error));
  }

  isReadonlyDistro() {
    return process.env.HADRON_READONLY === 'true';
  }

  shouldComponentupdate(nextProps, nextState) {
    return nextState.isWritable !== this.state.isWritable ||
      nextState.isReadonly !== this.state.isReadonly;
  }

  renderComponent() {
    return (
      <div className="column-container">
        <div className="column main">
          <table data-test-id="indexes-table">
            <IndexHeader />
            <IndexList isReadonly={this.isReadonlyDistro()} />
          </table>
        </div>
      </div>
    );
  }

  renderBanner() {
    if (this.state.isReadonly) {
      return (
        <StatusRow style="warning">
          Readonly views may not contain indexes.
        </StatusRow>
      );
    }
    return (
      <StatusRow style="error">
        {this.state.error.message}
      </StatusRow>
    );
  }

  renderCreateIndexButton() {
    if (!this.isReadonlyDistro()) {
      return (
        <CreateIndexButton isWritable={this.state.isWritable} description={this.state.description} />
      );
    }
    return (
      <div className="create-index-btn action-bar"></div>
    );
  }

  /**
   * Render the indexes.
   *
   * @returns {React.Component} The indexes.
   */
  render() {
    return (
      <div className="index-container">
        <div className="controls-container">
          {this.renderCreateIndexButton()}
        </div>
        {(this.state.isReadonly || this.state.error) ? this.renderBanner() : this.renderComponent()}
      </div>
    );
  }
}

Indexes.displayName = 'Indexes';

export default Indexes;
