const React = require('react');
const PropTypes = require('prop-types');

class StatusRow extends React.Component {

  /**
   * Render status row component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div>
          {this.props.children}
      </div>
    );
  }
}

StatusRow.propTypes = {
  children: PropTypes.node
};

StatusRow.displayName = 'StatusRow';

module.exports = StatusRow;
