const React = require('react');
const PropTypes = require('prop-types');
const { humanize } = require('../models/server-type');

/**
 * The single component.
 */
class Single extends React.Component {

  /**
   * Render single component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="topology-single">
        <div className="topology-single-address">
          {this.props.server.address}
        </div>
        <div className="topology-single-type">
          {humanize(this.props.server.type)}
        </div>
      </div>
    );
  }
}

Single.propTypes = {
  server: PropTypes.object.isRequired
};

Single.displayName = 'Single';

module.exports = Single;
