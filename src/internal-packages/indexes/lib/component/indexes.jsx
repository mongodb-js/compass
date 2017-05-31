const React = require('react');
const { StatusRow } = require('hadron-react-components');
const IndexHeader = require('./index-header');
const IndexList = require('./index-list');
const CreateIndexButton = require('./create-index-button');
const LoadIndexesStore = require('../store/load-indexes-store');

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
    this.DeploymentStateStore = appRegistry.getStore('DeploymentAwareness.DeploymentStateStore');
    this.state = this.determineState();
  }

  /**
   * Subscribe on mount.
   */
  componentWillMount() {
    this.unsubscribeLoad = LoadIndexesStore.listen(this.handleLoad.bind(this));
    this.unsubscribeStateStore = this.DeploymentStateStore.listen(this.deploymentStateChanged.bind(this));
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

  determineState() {
    return {
      isWritable: this.DeploymentStateStore.state.isWritable,
      isReadonly: this.CollectionStore.isReadonly(),
      description: this.DeploymentStateStore.state.description
    };
  }

  handleLoad() {
    this.setState(this.determineState());
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
            <IndexList />
          </table>
        </div>
      </div>
    );
  }

  renderReadonly() {
    return (
      <StatusRow style="warning">
        Readonly views may not contain indexes.
      </StatusRow>
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
        {/* NOT SURE if we need to wrap the controls-container in a readonly conditional as well. */}
        <div className="controls-container">
          <CreateIndexButton isWritable={this.state.isWritable} description={this.state.description} />
        </div>
        {this.state.isReadonly ? this.renderReadonly() : this.renderComponent()}
      </div>
    );
  }
}

Indexes.displayName = 'Indexes';

module.exports = Indexes;
