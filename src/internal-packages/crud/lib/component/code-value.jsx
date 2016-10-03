const React = require('react');
const truncate = require('hadron-app-registry').truncate;

/**
 * The document value class.
 */
const VALUE_CLASS = 'element-value';

/**
 * Code value component.
 */
class CodeValue extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.element = props.element;
  }

  style() {
    return `${VALUE_CLASS} ${VALUE_CLASS}-is-${this.element.currentType.toLowerCase()}`;
  }

  /**
   * Render a single max key value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <div className={this.style()}>
        {truncate(this.element.currentValue.code)}
      </div>
    );
  }
}

CodeValue.displayName = 'CodeValue';

CodeValue.propTypes = {
  element: React.PropTypes.object.isRequired
};

module.exports = CodeValue;
