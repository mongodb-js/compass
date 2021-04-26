import React from 'react';
import PropTypes from 'prop-types';
import { truncate } from 'hadron-react-utils';
import hexToUUID from 'hex-to-uuid';

/**
 * Base 64 constant.
 */
const BASE_64 = 'base64';

/**
 * Hex constant
 */
const HEX = 'hex';

/**
 * The component class name.
 */
const CLASS = 'element-value element-value-is-binary';

/**
 * BSON Binary value component.
 */
class Binary extends React.Component {

  /**
   * Render the value as a string.
   *
   * @returns {String[]} The binary value, and the tooltip content.
   */
  renderValue() {
    const type = this.props.value.sub_type;
    const buffer = this.props.value.buffer;
    if (type === 6) {
      return ['*********', 'This field is encrypted'];
    } else if (type === 4) {
      const uuid = `UUID('${hexToUUID(buffer.toString(HEX))}')`;
      return [uuid, uuid];
    }
    const val = `Binary('${truncate(buffer.toString(BASE_64), 100)}', ${type})`;
    return [val, val]
  }

  /**
   * Render a BSON binary value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    const value = this.renderValue();
    return (
      <div className={CLASS} title={value[1]}>
        {value[0]}
      </div>
    );
  }
}

Binary.displayName = 'BinaryValue';

Binary.propTypes = {
  type: PropTypes.string,
  value: PropTypes.any.isRequired
};

export default Binary;
