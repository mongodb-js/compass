const React = require('react');
const Actions = require('../action');
const Performance = require('./performance-component');
const Databases = require('./connected-databases');
const app = require('ampersand-app');

// const debug = require('debug')('mongodb-compass:server-stats-RTSSComponent');

/**
 * Represents the component that renders all the server stats.
 */
class RTSSComponent extends React.Component {

  /**
   * The RTSS view component constructor.
   *
   * @param {Object} props - The component properties.
   */
  constructor(props) {
    super(props);
    this.TabNav = app.appRegistry.getComponent('App.TabNavRoute');
  }

  componentDidMount() {
    Actions.restart();
  }

  onRouteClicked(tab) {
    const HomeActions = app.appRegistry.getAction('Home.Actions');
    HomeActions.navigateRoute(tab);
  }

  /**
   * Renders the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const performanceView = <Performance interval={this.props.interval} />;
    const databasesView = <Databases />;
    return (
      <div className="RTSS">
        <this.TabNav
          theme="light"
          tabNames={['Databases', 'Performance']}
          tabRoutes={['databases', 'performance']}
          onTabClicked={this.onRouteClicked.bind(this)}
          views={[databasesView, performanceView]}
          activeTab={this.props.tab}
          className="rt-nav"
        />
      </div>
    );
  }
}

RTSSComponent.propTypes = {
  interval: React.PropTypes.number.isRequired,
  tab: React.PropTypes.string
};

RTSSComponent.defaultProps = {
  tab: ''
};


RTSSComponent.displayName = 'RTSSComponent';

module.exports = RTSSComponent;
