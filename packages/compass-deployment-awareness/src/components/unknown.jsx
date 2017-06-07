const React = require('react');
const PropTypes = require('prop-types');

/**
 * The unknown component.
 */
class Unknown extends React.Component {

  /**
   * Renders the server count.
   *
   * @returns {String} The count string.
   */
  renderServerCount() {
    const count = this.props.servers.length;
    if (count > 1) {
      return `${count} servers`;
    }
    return `${count} server`;
  }

  /**
   * Render the unknown component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="topology-unknown">
        <div className="topology-unknown-name">
          Unknown
        </div>
        <div className="topology-unknown-type">
          <i className="mms-icon-unknown" />
          <span className="topology-unknown-type-name">Unknown</span>
        </div>
        <div className="topology-unknown-nodes">
          {this.renderServerCount()}
        </div>
      </div>
    );
  }
}

Unknown.propTypes = {
  servers: PropTypes.array.isRequired
};

Unknown.displayName = 'Unknown';

module.exports = Unknown;
