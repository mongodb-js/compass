const React = require('react');
const SidebarCollection = require('./sidebar-collection');
const { NamespaceStore } = require('hadron-reflux-store');
// const debug = require('debug')('mongodb-compass:sidebar');

class SidebarDatabase extends React.Component {
  constructor() {
    super();
    this.state = {
      expanded: true
    };
  }

  getCollectionComponents() {
    if (this.state.expanded) {
      return this.props.collections.map(c => {
        const props = {
          _id: c._id,
          database: c.database,
          capped: c.capped,
          power_of_two: c.power_of_two
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
      NamespaceStore.ns = db;
    }
  }

  handleArrowClick() {
    this.setState({ expanded: !this.state.expanded });
  }

  render() {
    return (
      <div className="compass-sidebar-item compass-sidebar-item-is-top-level">
        <div className="compass-sidebar-item-header compass-sidebar-item-header-is-expandable">
          <i onClick={this.handleDBClick.bind(this, this.props._id)} className="compass-sidebar-database-icon mms-icon-database"></i>
          <i onClick={this.handleArrowClick.bind(this)} className={this.getArrowIconClasses()}></i>
          <div onClick={this.handleDBClick.bind(this, this.props._id)} className="compass-sidebar-title" title={this.props._id}>
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
  collections: React.PropTypes.array
};

module.exports = SidebarDatabase;
