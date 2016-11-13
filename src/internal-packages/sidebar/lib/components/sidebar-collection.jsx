const app = require('ampersand-app');
const React = require('react');

const { NamespaceStore } = require('hadron-reflux-store');

class SidebarCollection extends React.Component {
  constructor() {
    super();
    this.handleClick = this.handleClick.bind(this);
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
  }

  getCollectionName() {
    const database = this.props.database;
    const _id = this.props._id;

    return _id.slice(database.length + 1);
  }

  handleClick() {
    if (NamespaceStore.ns !== this.props._id) {
      this.CollectionStore.setCollection(this.props);
    }
  }

  renderReadonly() {
    if (this.props.readonly) {
      return (
        <i className="fa fa-eye" aria-hidden="true" />
      );
    }
  }

  render() {
    const collectionName = this.getCollectionName();
    return (
      <div className="compass-sidebar-item">
        <div onClick={this.handleClick}
            className="compass-sidebar-title compass-sidebar-title-is-actionable"
            title={this.props._id}>
          {collectionName}&nbsp;
          {this.renderReadonly()}
        </div>
      </div>
    );
  }
}

SidebarCollection.propTypes = {
  _id: React.PropTypes.string,
  database: React.PropTypes.string,
  capped: React.PropTypes.bool,
  power_of_two: React.PropTypes.bool,
  readonly: React.PropTypes.bool
};

module.exports = SidebarCollection;
