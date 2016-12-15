const React = require('react');
const app = require('ampersand-app');

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.sideBar = app.appRegistry.getComponent('Sidebar.Component');
    this.collectionView = app.appRegistry.getComponent('Collection.Collection');
    this.collectionsTable = app.appRegistry.getComponent('Database.CollectionsTable');
    /**
     * TODO (imlucas) Handle state when rtss permissions not available.
     */
    this.serverStatsView = app.appRegistry.getComponent('RTSS.ServerStats');
  }

  renderContent() {
    let view;
    switch (this.props.mode) {
      case 'database':
        view = (<this.collectionsTable />);
        break;
      case 'collection':
        view = (<this.collectionView namespace={this.props.namespace} />);
        break;
      default:
        view = (<this.serverStatsView interval={1000}/>);
    }

    return view;
  }

  render() {
    return (
      <div className="page">
        <div className="content with-sidebar">
          {this.renderContent()}
        </div>
        <div className="compass-sidebar-container">
          <this.sideBar />
        </div>
      </div>
    );
  }
}

Home.propTypes = {
  mode: React.PropTypes.oneOf(['instance', 'database', 'collection']),
  namespace: React.PropTypes.string
};

Home.displayName = 'Home';

module.exports = Home;
