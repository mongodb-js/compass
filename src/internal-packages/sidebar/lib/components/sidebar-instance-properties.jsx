const React = require('react');
const PropTypes = require('prop-types');
const app = require('hadron-app');
const { LOADING_STATE } = require('../constants');

class SidebarInstanceProperties extends React.Component {
  constructor(props) {
    super(props);
    this.DatabaseDDLActions = app.appRegistry.getAction('DatabaseDDL.Actions');
  }

  getRefreshIconClassNames() {
    const fetchingInstance = this.props.fetching;
    return 'fa ' + (fetchingInstance ? 'fa-refresh fa-spin' : 'fa-repeat');
  }

  handleRefresh() {
    const InstanceActions = app.appRegistry.getAction('App.InstanceActions');
    InstanceActions.refreshInstance();
  }

  render() {
    const instance = this.props.instance;
    const numDbs = instance.databases === LOADING_STATE ? '-' : instance.databases.length;
    const numCollections = instance.collections === LOADING_STATE ? '-' : instance.collections.length;

    return (
      <div className="compass-sidebar-properties">
        <div className="compass-sidebar-stats">
          <div className="compass-sidebar-refresh-button-container">
            <button
              onClick={this.handleRefresh}
              className="compass-sidebar-refresh-button"
              data-test-id="instance-refresh-button">
              <i className={this.getRefreshIconClassNames()}></i>
            </button>
          </div>
          <div className="compass-sidebar-property-column">
            <span
              data-test-id="sidebar-db-count"
              className="compass-sidebar-strong-property">
              {numDbs}
            </span> DBs
          </div>
          <div className="compass-sidebar-property-column">
            <span
              data-test-id="sidebar-collection-count"
              className="compass-sidebar-strong-property">
              {numCollections}
            </span> Collections
          </div>
        </div>
      </div>
    );
  }
}

SidebarInstanceProperties.propTypes = {
  connection: PropTypes.object,
  instance: PropTypes.object,
  fetching: PropTypes.bool,
  activeNamespace: PropTypes.string.isRequired
};

module.exports = SidebarInstanceProperties;
