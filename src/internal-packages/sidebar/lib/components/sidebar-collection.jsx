const app = require('ampersand-app');
const React = require('react');

const { NamespaceStore } = require('hadron-reflux-store');

class SidebarCollection extends React.Component {
  constructor() {
    super();
    this.state = {
      active: false
    };
  }

  getCollectionName() {
    const database = this.props.database;
    const _id = this.props._id;

    return _id.slice(database.length + 1);
  }

  handleClick() {
    if (NamespaceStore.ns !== this.props._id) {
      const HomeActions = app.appRegistry.getAction('Home.Actions');
      HomeActions.navigateRoute(app.router.history.location.hash, `${this.props._id}`);
    }
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
    let className = 'compass-sidebar-title compass-sidebar-title-is-actionable';
    if (this.props.activeNamespace === this.props._id) {
      className += ' compass-sidebar-title-is-active';
    }
    return (
      <div className="compass-sidebar-item">
        <div
          onClick={this.handleClick.bind(this)}
          className={className}
          data-test-id="sidebar-collection"
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
  activeNamespace: React.PropTypes.string.isRequired
};

module.exports = SidebarCollection;
