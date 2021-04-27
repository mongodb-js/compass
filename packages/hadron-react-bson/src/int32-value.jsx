import React from 'react';
import PropTypes from 'prop-types';

/**
 * The base css class.
 */
const CLASS = 'element-value';

/**
 * General BSON double value component.
 */
class Int32 extends React.Component {
  /**
   * Render a single generic BSON value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    const value = String(this.props.value.valueOf());
    return (
      <div className={`${CLASS} ${CLASS}-is-${this.props.type.toLowerCase()}`} title={value}>
        {value}
      </div>
    );
  }
}

Int32.displayName = 'Int32Value';

Int32.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired
};

export default Int32;
