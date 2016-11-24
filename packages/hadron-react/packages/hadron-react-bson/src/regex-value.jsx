const React = require('react');

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
  type: React.PropTypes.string.isRequired,
  value: React.PropTypes.any.isRequired
};

module.exports = Regex;
