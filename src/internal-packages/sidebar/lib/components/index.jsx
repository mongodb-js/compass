const React = require('react');

const app = require('hadron-app');
const Sidebar = require('./sidebar');
const SidebarStore = require('../stores');

// const debug = require('debug')('mongodb-compass:compass-explain:index');

class ConnectedSidebar extends React.Component {

  constructor(props) {
    super(props);
    this.StoreConnector = app.appRegistry.getComponent('App.StoreConnector');
  }

  /**
   * Connect CompassExplainComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <this.StoreConnector store={SidebarStore}>
        <Sidebar onCollapse={this.props.onCollapse.bind(this)}/>
      </this.StoreConnector>
    );
  }
}

ConnectedSidebar.propTypes = {
  onCollapse: React.PropTypes.func
};

ConnectedSidebar.displayName = 'ConnectedSidbar';

module.exports = ConnectedSidebar;
