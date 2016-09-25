const React = require('react');

/**
 * The document value class.
 */
const VALUE_CLASS = 'element-value';

/**
 * ObjectID value component.
 */
class ObjectIDValue extends React.Component {

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
   * Render a single object id value.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <div className={this.style()}>
        {String(this.element.currentValue)}
      </div>
    );
  }
}

ObjectIDValue.displayName = 'ObjectIDValue';

ObjectIDValue.propTypes = {
  element: React.PropTypes.object.isRequired
};

module.exports = ObjectIDValue;
