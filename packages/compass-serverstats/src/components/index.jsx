const React = require('react');
const Actions = require('../actions');
const Performance = require('./performance-component');
const NavBarComponent = require('./navbar-component');

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

  /**
   * Restart the actions on mount.
   */
  componentDidMount() {
    Actions.restart();
  }

  /**
   * Renders the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className="rtss">
        <NavBarComponent/>
        <div className="rtss-performance">
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
