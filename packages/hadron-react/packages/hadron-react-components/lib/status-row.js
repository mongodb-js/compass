const React = require('react');
const PropTypes = require('prop-types');

class StatusRow extends React.Component {

  /**
   * Render status row component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    let className = 'status-row';
    if (this.props.style !== 'default') {
      className += ` status-row-has-${this.props.style}`;
    }
    return React.createElement(
      'div',
      { className: className },
      this.props.children
    );
  }
}

StatusRow.propTypes = {
  style: PropTypes.oneOf(['default', 'warning', 'error']),
  children: PropTypes.node
};

StatusRow.defaultProps = {
  style: 'default'
};

StatusRow.displayName = 'StatusRow';

module.exports = StatusRow;