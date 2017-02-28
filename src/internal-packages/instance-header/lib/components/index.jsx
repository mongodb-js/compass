const React = require('react');
const app = require('hadron-app');
const StoreConnector = app.appRegistry.getComponent('App.StoreConnector');
const InstanceHeaderComponent = require('./instance-header');
const Store = require('../stores');

// const debug = require('debug')('mongodb-compass:instance-header:index');

class ConnectedInstanceHeaderComponent extends React.Component {
  /**
   * Connect InstanceHeaderComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={Store}>
        <InstanceHeaderComponent sidebarCollapsed={this.props.sidebarCollapsed}/>
      </StoreConnector>
    );
  }
}

ConnectedInstanceHeaderComponent.propTypes = {
  sidebarCollapsed: React.PropTypes.bool
};

ConnectedInstanceHeaderComponent.displayName = 'ConnectedInstanceHeaderComponent';

module.exports = ConnectedInstanceHeaderComponent;
