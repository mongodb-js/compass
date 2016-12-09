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
    this.TabNavBar = app.appRegistry.getComponent('App.TabNavBar');
  }

  componentDidMount() {
    Actions.restart();
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
        <header>
          <h1>
            <span className="breadcrumb">
              CHOOSE A DATABASE
            </span>
            <span className="breadcrumb">
              CHOOSE A COLLECTION
            </span>
          </h1>
        </header>
        <this.TabNavBar
          theme="light"
          tabs={['Databases', 'Performance']}
          views={[databasesView, performanceView]}
          activeTabIndex={0}
          className="rt-nav"
        />
      </div>
    );
  }
}

RTSSComponent.propTypes = {
  interval: React.PropTypes.number.isRequired
};


RTSSComponent.displayName = 'RTSSComponent';

module.exports = RTSSComponent;
