import React from 'react';
import PropTypes from 'prop-types';

/**
 * The base css class.
 */
const CLASS = 'element-value';

/**
 * General BSON key value component.
 */
class Key extends React.Component {

  /**
   * Render a single generic BSON key value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    const value = `${String(this.props.value.constructor.name)}()`;
    return (
      <div className={`${CLASS} ${CLASS}-is-${this.props.type.toLowerCase()}`} title={value}>
        {value}
      </div>
    );
  }
}

Key.displayName = 'KeyValue';

Key.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired
};

export default Key;
