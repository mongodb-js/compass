import React from 'react';
import PropTypes from 'prop-types';

/**
 * The base css class.
 */
const CLASS = 'element-value';

/**
 * General BSON DBRef component.
 */
class DBRefValue extends React.Component {
  /**
   * Render a single BSON DBRef value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    const dbref = this.props.value;
    const value = `DBRef(${dbref.namespace}, ${String(dbref.oid)}, ${dbref.db})`;
    return (
      <div className={`${CLASS} ${CLASS}-is-${this.props.type.toLowerCase()}`} title={value}>
        {value}
      </div>
    );
  }
}

DBRefValue.displayName = 'DBRefValue';

DBRefValue.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.any
};

export default DBRefValue;
