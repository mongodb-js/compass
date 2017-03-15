const React = require('react');
const app = require('hadron-app');
const InstanceHeaderComponent = require('./instance-header');
const Store = require('../stores');

// const debug = require('debug')('mongodb-compass:instance-header:index');

class ConnectedInstanceHeaderComponent extends React.Component {

  constructor(props) {
    super(props);
    this.StoreConnector = app.appRegistry.getComponent('App.StoreConnector');
  }

  /**
   * Connect InstanceHeaderComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <this.StoreConnector store={Store}>
        <InstanceHeaderComponent sidebarCollapsed={this.props.sidebarCollapsed}/>
      </this.StoreConnector>
    );
  }
}

ConnectedInstanceHeaderComponent.propTypes = {
  sidebarCollapsed: React.PropTypes.bool
};

ConnectedInstanceHeaderComponent.displayName = 'ConnectedInstanceHeaderComponent';

module.exports = ConnectedInstanceHeaderComponent;
