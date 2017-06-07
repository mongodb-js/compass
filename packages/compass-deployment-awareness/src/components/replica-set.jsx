const React = require('react');
const PropTypes = require('prop-types');

/**
 * The replica-set component.
 */
class ReplicaSet extends React.Component {

  /**
   * Renders the server count.
   *
   * @returns {String} The count string.
   */
  renderServerCount() {
    const count = this.props.servers.length;
    if (count > 1) {
      return `${count} nodes`;
    }
    return `${count} node`;
  }

  /**
   * Render the replica-set component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="topology-replica-set">
        <div className="topology-replica-set-name">
          {this.props.setName}
        </div>
        <div className="topology-replica-set-type">
          <i className="mms-icon-replica-set" />
          <span className="topology-replica-set-type-name">Replica Set</span>
        </div>
        <div className="topology-replica-set-nodes">
          {this.renderServerCount()}
        </div>
      </div>
    );
  }
}

ReplicaSet.propTypes = {
  servers: PropTypes.array.isRequired,
  setName: PropTypes.string.isRequired,
  topologyType: PropTypes.string.isRequired
};

ReplicaSet.displayName = 'ReplicaSet';

module.exports = ReplicaSet;
