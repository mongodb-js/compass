import React from 'react';
import PropTypes from 'prop-types';

/**
 * The base css class.
 */
const CLASS = 'element-value';

/**
 * General BSON Timestamp component.
 */
class TimestampValue extends React.Component {
  /**
   * Render a single BSON Timestamp value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    const ts = this.props.value;
    const value = `Timestamp({ t: ${ts.high}, i: ${ts.low} })`;
    return (
      <div className={`${CLASS} ${CLASS}-is-${this.props.type.toLowerCase()}`} title={value}>
        {value}
      </div>
    );
  }
}

TimestampValue.displayName = 'TimestampValue';

TimestampValue.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.any
};

export default TimestampValue;
