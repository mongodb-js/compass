import React from 'react';
import PropTypes from 'prop-types';
import { truncate } from 'hadron-react-utils';

/**
 * The base css class.
 */
const CLASS = 'element-value';

/**
 * General BSON string value component.
 */
class StringValue extends React.Component {

  /**
   * Render a single generic BSON value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <div className={`${CLASS} ${CLASS}-is-string`} title={this.props.value}>
        {`\"${truncate(this.props.value, 70)}\"`}
      </div>
    );
  }
}

StringValue.displayName = 'StringValue';

StringValue.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired
};

export default StringValue;
