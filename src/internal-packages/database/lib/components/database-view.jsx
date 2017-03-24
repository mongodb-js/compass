const React = require('react');
const ReactTooltip = require('react-tooltip');
const app = require('hadron-app');
const CollectionsTableView = require('./connected-collections');

class DatabaseView extends React.Component {

  constructor(props) {
    super(props);
    this.TabNavBar = app.appRegistry.getComponent('App.TabNavBar');
  }

  componentDidMount() {
    // Re-render the global 'is-not-writable' tooltip in a performant way
    // so we don't reintroduce COMPASS-532 on the banks.json data set.
    ReactTooltip.rebuild()
  }

  /**
   * Renders the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const collectionsTableView = <CollectionsTableView />;
    return (
      <div className="collections">
        <this.TabNavBar
          theme="light"
          tabs={['Collections']}
          views={[collectionsTableView]}
          activeTabIndex={0}
          className="rt-nav" />
      </div>
    );
  }
}

DatabaseView.displayName = 'DatabaseView';

module.exports = DatabaseView;
