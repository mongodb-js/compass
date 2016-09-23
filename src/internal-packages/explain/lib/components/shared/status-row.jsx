const React = require('react');

class StatusRow extends React.Component {

  /**
   * Render status row component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className="status-row">
        {this.props.children}
      </div>
    );
  }
}

StatusRow.propTypes = {
  children: React.PropTypes.node
};

StatusRow.displayName = 'StatusRow';

module.exports = StatusRow;
