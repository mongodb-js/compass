const React = require('react');
const PropTypes = require('prop-types');

/**
 * The sharded component.
 */
class Sharded extends React.Component {

  /**
   * Renders the server count.
   *
   * @returns {String} The count string.
   */
  renderServerCount() {
    const count = this.props.servers.length;
    if (count > 1) {
      return `${count} mongoses`;
    }
    return `${count} mongos`;
  }

  /**
   * Render the sharded component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="topology-sharded">
        <div className="topology-sharded-name">
          Cluster0
        </div>
        <div className="topology-sharded-type">
          <i className="mms-icon-cluster" />
          <span className="topology-sharded-type-name">Sharded Cluster</span>
        </div>
        <div className="topology-sharded-mongos">
          {this.renderServerCount()}
        </div>
      </div>
    );
  }
}

Sharded.propTypes = {
  servers: PropTypes.array.isRequired
};

Sharded.displayName = 'Sharded';

module.exports = Sharded;
