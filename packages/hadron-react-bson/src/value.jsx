import React from 'react';
import PropTypes from 'prop-types';

/**
 * The base css class.
 */
const CLASS = 'element-value';

/**
 * General BSON value component.
 */
class Value extends React.Component {
  /**
   * Render a single generic BSON value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    const value = String(this.props.value);
    return (
      <div className={`${CLASS} ${CLASS}-is-${this.props.type.toLowerCase()}`} title={value}>
        {value}
      </div>
    );
  }
}

Value.displayName = 'Value';

Value.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.any
};

export default Value;
