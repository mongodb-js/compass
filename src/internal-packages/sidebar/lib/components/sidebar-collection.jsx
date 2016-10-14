const React = require('react');

const { NamespaceStore } = require('hadron-reflux-store');

class SidebarCollection extends React.Component {
  constructor() {
    super();
    this.handleClick = this.handleClick.bind(this);
  }

  getCollectionName() {
    const database = this.props.database;
    const _id = this.props._id;

    return _id.slice(database.length + 1);
  }

  handleClick() {
    NamespaceStore.ns = this.props._id;
  }

  render() {
    const collectionName = this.getCollectionName();
    return (
      <div className="compass-sidebar-item">
        <div onClick={this.handleClick}
            className="compass-sidebar-title compass-sidebar-title-is-actionable"
            title={collectionName}>
          {collectionName}
        </div>
      </div>
    );
  }
}

SidebarCollection.propTypes = {
  _id: React.PropTypes.string,
  database: React.PropTypes.string
};

module.exports = SidebarCollection;
