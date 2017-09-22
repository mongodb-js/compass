const React = require('react');
const PropTypes = require('prop-types');

const { StoreConnector } = require('hadron-react-components');
const Sidebar = require('./sidebar');
const SidebarStore = require('../stores');

// const debug = require('debug')('mongodb-compass:compass-explain:index');

class ConnectedSidebar extends React.Component {

  /**
   * Connect CompassExplainComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={SidebarStore}>
        <Sidebar onCollapse={this.props.onCollapse.bind(this)}/>
      </StoreConnector>
    );
  }
}

ConnectedSidebar.propTypes = {
  onCollapse: PropTypes.func
};

ConnectedSidebar.displayName = 'ConnectedSidbar';

module.exports = ConnectedSidebar;
