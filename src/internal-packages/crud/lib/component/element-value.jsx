const React = require('react');
const EditableValue = require('./editable-value');

/**
 * The default non-editable value component.
 */
const DEFAULT = './non-editable-value';

/**
 * Mappings for non editable value components.
 */
const MAPPINGS = {
  'Binary': './binary-value',
  'MinKey': './min-key-value',
  'MaxKey': './max-key-value',
  'Code': './code-value',
  'Timestamp': './timestamp-value',
  'ObjectID': './objectid-value'
};

/**
 * Component for the value of an element.
 */
class ElementValue extends React.Component {

  /**
   * Get the value component for the type.
   *
   * @param {String} type - The type.
   *
   * @returns {React.Component} The value component.
   */
  valueComponent(type) {
    return require(MAPPINGS[type] || DEFAULT);
  }

  /**
   * Render the value for the component.
   *
   * @returns {React.Component} The value component.
   */
  render() {
    if (this.props.element.isValueEditable()) {
      return (<EditableValue element={this.props.element} />);
    }
    const props = { element: this.props.element };
    return React.createElement(this.valueComponent(this.props.element.currentType), props);
  }
}

ElementValue.displayName = 'ElementValue';

ElementValue.propTypes = {
  element: React.PropTypes.object.isRequired
};

module.exports = ElementValue;
