import React from 'react';
import PropTypes from 'prop-types';

/**
 * The base css class.
 */
const CLASS = 'element-value';

/**
 * General BSON regex value component.
 */
class Regex extends React.Component {

  /**
   * Render a single BSON regex value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    const value = `/${this.props.value.pattern}/${this.props.value.options}`;
    return (
      <div className={`${CLASS} ${CLASS}-is-${this.props.type.toLowerCase()}`} title={value}>
        {value}
      </div>
    );
  }
}

Regex.displayName = 'RegexValue';

Regex.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired
};

export default Regex;
