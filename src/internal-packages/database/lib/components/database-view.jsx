const React = require('react');
const app = require('hadron-app');
const CollectionsTableView = require('./connected-collections');

class DatabaseView extends React.Component {

  constructor(props) {
    super(props);
    this.TabNavBar = app.appRegistry.getComponent('App.TabNavBar');
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
