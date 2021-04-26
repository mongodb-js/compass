import React from 'react';
import PropTypes from 'prop-types';

/**
 * The component class name.
 */
const CLASS = 'element-value element-value-is-code';

/**
 * BSON code value component.
 */
class Code extends React.Component {

  /**
   * Render a single BSON code value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    const value = `Code('${this.props.value.code}', ${JSON.stringify(this.props.value.scope)})`;
    return (
      <div className={CLASS} title={value}>
        {value}
      </div>
    );
  }
}

Code.displayName = 'CodeValue';

Code.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired
};

export default Code;
