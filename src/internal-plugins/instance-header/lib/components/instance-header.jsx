const React = require('react');
const PropTypes = require('prop-types');
const InstanceHeaderActions = require('../actions');
const FontAwesome = require('react-fontawesome');
const ipc = require('hadron-ipc');
const app = require('hadron-app');
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:instance-header');

const HOST_STRING_LENGTH = 30;

class InstanceHeaderComponent extends React.Component {

  constructor(props) {
    super(props);
    this.setupHeaderItems();

    this.state = { name: this.connectionString(props.name)};
  }

  componentWillReceiveProps(nextProps) {
    const state = { name: this.connectionString(nextProps.name)};
    this.setState(state);
  }

  onClick() {
    InstanceHeaderActions.toggleStatus();
  }

  /**
   * creates React components for the plugins registering as the
   * Heeader.Item role. Separates left/right aligned items, and passes the
   * order into the css style so that flexbox can handle ordering.
   */
  setupHeaderItems() {
    const roles = app.appRegistry.getRole('Header.Item');
    // create all left-aligned header items
    this.leftHeaderItems = _.map(_.filter(roles, (role) => {
      return role.alignment === 'left';
    }), (role, i) => {
      return React.createElement(role.component, { key: i });
    });
    // create all right-aligned header items
    this.rightHeaderItems = _.map(_.filter(roles, (role) => {
      return role.alignment !== 'left';
    }), (role, i) => {
      return React.createElement(role.component, { key: i });
    });
  }

  connectionString(name, showFull) {
    const str = (name.length < HOST_STRING_LENGTH) || showFull ?
      name
      : `${name.substring(0, HOST_STRING_LENGTH)}...`;
    return str;
  }

  showConnectionString(showFullString) {
    this.setState({ name: this.connectionString(this.props.name, showFullString) });
  }

  handleClickHostname() {
    const NamespaceStore = app.appRegistry.getStore('App.NamespaceStore');
    NamespaceStore.ns = '';
    ipc.call('window:hide-collection-submenu');
  }

  renderConnectionString() {
    return (
      <div className="instance-header-details" data-test-id="instance-header-details">
        {this.state.name}
      </div>
    );
  }

  /**
   * Render Component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const headerClasses = 'instance-header' +
      (this.props.sidebarCollapsed ? ' instance-header-sidebar-collapsed' : ' instance-header-sidebar-expanded');

    const hostnameClasses = 'instance-header-connection-string' +
      (this.props.activeNamespace === '' ? ' instance-header-connection-string-is-active' : '');

    return (
      <div className={headerClasses}>
        <div className={hostnameClasses} onClick={this.handleClickHostname}>
          <div className="instance-header-icon-container">
            <FontAwesome name="home" className="instance-header-icon instance-header-icon-home"/>
          </div>
          {this.renderConnectionString()}
        </div>
        <div className="instance-header-items instance-header-items-is-left">
          {this.leftHeaderItems}
        </div>
        <div className="instance-header-items instance-header-items-is-right">
          {this.rightHeaderItems}
        </div>
      </div>
    );
  }
}

InstanceHeaderComponent.propTypes = {
  name: PropTypes.string,
  activeNamespace: PropTypes.string,
  sidebarCollapsed: PropTypes.bool
};

InstanceHeaderComponent.defaultProps = {
};

InstanceHeaderComponent.displayName = 'InstanceHeaderComponent';

module.exports = InstanceHeaderComponent;
