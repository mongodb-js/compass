const React = require('react');
const app = require('ampersand-app');
const CollectionsTableView = require('./connected-collections');
const toNS = require('mongodb-ns');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;

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
        <header>
          <h1>
            <span className="breadcrumb">
              DATABASE <span>{toNS(NamespaceStore.ns).database}</span>
            </span>
            <span className="breadcrumb">
              CHOOSE A COLLECTION
            </span>
          </h1>
        </header>
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
