const React = require('react');
const IndexHeader = require('./index-header');
const IndexList = require('./index-list');
const CreateIndexButton = require('./create-index-button');
const LoadIndexesStore = require('../store/load-indexes-store');
const app = require('ampersand-app');
const StatusRow = app.appRegistry.getComponent('App.StatusRow');

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
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
    this.state = this.determineState();
  }

  /**
   * Subscribe on mount.
   */
  componentWillMount() {
    this.unsubscribeLoad = LoadIndexesStore.listen(this.handleLoad.bind(this));
  }

  /**
   * Unsubscribe on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeLoad();
  }

  determineState() {
    return {
      writable: this.CollectionStore.isWritable(),
      readonly: this.CollectionStore.isReadonly()
    };
  }

  handleLoad() {
    this.setState(this.determineState());
  }

  shouldComponentupdate(nextProps, nextState) {
    return nextState.writable !== this.state.writable ||
      nextState.readonly !== this.state.readonly;
  }

  renderComponent() {
    return (
      <div className="column-container">
        {this.state.writable ? <CreateIndexButton /> : null}
        <div className="column main">
          <table>
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
      <div className="index-container header-margin">
        {this.state.readonly ? this.renderReadonly() : this.renderComponent()}
      </div>
    );
  }
}

Indexes.displayName = 'Indexes';

module.exports = Indexes;
