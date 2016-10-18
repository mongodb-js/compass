const React = require('react');
const Actions = require('../actions');
const Performance = require('./performance-component');
const NavBarComponent = require('./navbar-component');
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
  }

  componentDidMount() {
    Actions.restart();
  }

  /**
   * Renders the component.
   *
   * @returns {React.Component} The component.
   <div className="databases">
   <Databases />
   </div>
   */
  render() {
    return (
      <div className="RTSS">
        <NavBarComponent/>
        <div className="performance">
          <Performance interval={this.props.interval}/>
        </div>
      </div>
    );
  }
}

RTSSComponent.propTypes = {
  interval: React.PropTypes.number.isRequired
};


RTSSComponent.displayName = 'RTSSComponent';

module.exports = RTSSComponent;
