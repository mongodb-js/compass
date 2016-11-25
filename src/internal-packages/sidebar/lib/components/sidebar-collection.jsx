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

  handleClick(col) {
    if (NamespaceStore.ns !== this.props._id) {
      this.CollectionStore.setCollection(this.props);
    }
    this.props.onClick(col);
  }

  renderReadonly() {
    if (this.props.readonly) {
      return (
        <i className="fa fa-lock" aria-hidden="true" />
      );
    }
  }

  render() {
    const collectionName = this.getCollectionName();
    return (
      <div className="compass-sidebar-item">
        <div onClick={this.handleClick.bind(this, this.props._id)}
            className={ (this.props._id !== this.props.active) ? "compass-sidebar-title compass-sidebar-title-is-actionable" : "compass-sidebar-title compass-sidebar-title-is-actionable compass-sidebar-title-is-active"}
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
  readonly: React.PropTypes.bool,
  active: React.PropTypes.string,
  onClick: React.PropTypes.func
};

module.exports = SidebarCollection;
