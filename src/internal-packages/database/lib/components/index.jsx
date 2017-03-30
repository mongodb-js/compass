const React = require('react');
const { TabNavBar } = require('hadron-react-components');
const CollectionsTableView = require('./connected-collections');

class DatabaseView extends React.Component {

  constructor(props) {
    super(props);
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
        <TabNavBar
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
