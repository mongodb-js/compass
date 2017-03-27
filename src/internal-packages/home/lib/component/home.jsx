const React = require('react');
const app = require('hadron-app');
const ReactTooltip = require('react-tooltip');

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = { collapsed: false };

    // Navigation components
    this.InstanceHeader = app.appRegistry.getComponent('InstanceHeader.Component');
    this.sideBar = app.appRegistry.getComponent('Sidebar.Component');

    // Main working area components
    this.instanceView = app.appRegistry.getComponent('Instance.InstanceView');
    this.databaseView = app.appRegistry.getComponent('Database.DatabaseView');
    this.collectionView = app.appRegistry.getComponent('Collection.CollectionView');

    // Modal dialogs
    this.CreateDatabaseDialog = app.appRegistry.getComponent('Instance.CreateDatabaseDialog');
    this.DropDatabaseDialog = app.appRegistry.getComponent('Instance.DropDatabaseDialog');
    this.CreateCollectionDialog = app.appRegistry.getComponent('Database.CreateCollectionDialog');
    this.DropCollectionDialog = app.appRegistry.getComponent('Database.DropCollectionDialog');
  }

  getContentClasses() {
    return 'content' +
      (this.state.collapsed ? ' content-sidebar-collapsed' : ' content-sidebar-expanded');
  }

  collapseSidebar() {
    this.setState({ collapsed: !this.state.collapsed });
  }

  renderContent() {
    let view;
    switch (this.props.mode) {
      case 'database':
        view = (<this.databaseView />);
        break;
      case 'collection':
        view = (<this.collectionView namespace={this.props.namespace} />);
        break;
      default:
        view = (<this.instanceView interval={1000}/>);
    }

    return view;
  }

  render() {
    // if server is not writable, include global tooltip component for diabled buttons
    const isNotWritableTooltip = app.dataService.isWritable() ? null : (
      <ReactTooltip
        id="is-not-writable"
        effect="solid"
        class="is-not-writable-tooltip"
        place="right"
        delayShow={200}
      />
    );

    return (
      <div className="page-container">
        <this.InstanceHeader sidebarCollapsed={this.state.collapsed}/>
        <div className="page">
          <div className={this.getContentClasses()}>
            {this.renderContent()}
          </div>
          <this.sideBar onCollapse={this.collapseSidebar.bind(this)}/>
          {isNotWritableTooltip}
          <this.CreateDatabaseDialog />
          <this.DropDatabaseDialog />
          <this.CreateCollectionDialog />
          <this.DropCollectionDialog />
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
