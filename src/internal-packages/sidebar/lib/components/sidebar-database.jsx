const app = require('ampersand-app');
const ipc = require('hadron-ipc');
const React = require('react');
const SidebarCollection = require('./sidebar-collection');
const { NamespaceStore } = require('hadron-reflux-store');
const toNS = require('mongodb-ns');

class SidebarDatabase extends React.Component {
  constructor(props) {
    super(props);
    this.state = { expanded: props.expanded };
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      expanded: nextProps.expanded || toNS(nextProps.activeNamespace).database === this.props._id}
    );
  }

  getCollectionComponents() {
    if (this.state.expanded) {
      return this.props.collections.map(c => {
        const props = {
          _id: c._id,
          database: c.database,
          capped: c.capped,
          power_of_two: c.power_of_two,
          readonly: c.readonly,
          activeNamespace: this.props.activeNamespace
        };

        return (
          <SidebarCollection key={c._id} {...props} />
        );
      });
    }
  }

  getArrowIconClasses() {
    return 'mms-icon-right-arrow compass-sidebar-expand-icon' +
      (this.state.expanded ? ' fa-rotate-90' : '');
  }

  handleDBClick(db) {
    if (NamespaceStore.ns !== db) {
      this.CollectionStore.setCollection({});
      NamespaceStore.ns = db;
      ipc.call('window:hide-collection-submenu');
    }
  }

  handleArrowClick() {
    this.setState({ expanded: !this.state.expanded });
  }

  handleCreateCollectionClick() {
    console.log('Do create collection');
  }

  handleDropDBClick() {
    console.log('Do drop database');
  }

  render() {
    let className = 'compass-sidebar-item-header compass-sidebar-item-header-is-expandable compass-sidebar-item-header-is-actionable';
    if (this.props.activeNamespace === this.props._id) {
      className += ' compass-sidebar-item-header-is-active';
    }
    return (
      <div className="compass-sidebar-item compass-sidebar-item-is-top-level">
        <div className={className}>
          <i onClick={this.handleArrowClick.bind(this)} className={this.getArrowIconClasses()} />
          <i
            className="compass-sidebar-icon compass-sidebar-icon-create-collection fa fa-plus-circle"
            onClick={this.handleCreateCollectionClick.bind(this)}
          />
          <i
            className="compass-sidebar-icon compass-sidebar-icon-drop-database fa fa-trash-o"
            onClick={this.handleDropDBClick.bind(this)}
          />
          <div
            onClick={this.handleDBClick.bind(this, this.props._id)}
            className="compass-sidebar-title" title={this.props._id}
            data-test-id="sidebar-database">
            {this.props._id}
          </div>
        </div>
        <div className="compass-sidebar-item-content">
          {this.getCollectionComponents.call(this)}
        </div>
      </div>
    );
  }
}

SidebarDatabase.propTypes = {
  _id: React.PropTypes.string,
  activeNamespace: React.PropTypes.string.isRequired,
  collections: React.PropTypes.array,
  expanded: React.PropTypes.bool
};

module.exports = SidebarDatabase;
