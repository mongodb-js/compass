import React from 'react';
import PropTypes from 'prop-types';

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
    return (
      <div className={className}>
        {this.props.children}
      </div>
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

export default StatusRow;
