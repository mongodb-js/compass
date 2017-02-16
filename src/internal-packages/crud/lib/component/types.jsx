const _ = require('lodash');
const app = require('hadron-app');
const React = require('react');
const TypeChecker = require('hadron-type-checker');

require('bootstrap/js/dropdown');

/**
 * Object constant.
 */
const OBJECT = 'Object';

/**
 * The version at which high precision values are available.
 */
const HP_VERSION = '3.4.0';

/**
 * General types component.
 */
class Types extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.element = props.element;
    this._version = app.instance.build.version;
  }

  /**
   * Get the class name for the dropdown.
   *
   * @returns {String} The class name.
   */
  getClassName() {
    let className = 'editable-element-types dropdown';
    if (this.element.currentType !== this.element.type) {
      className = `${className} editable-element-types-is-edited`;
    }
    return className;
  }

  /**
   * Get the castable value for this value.
   *
   * @returns {Object} The cast value.
   */
  castableValue() {
    if (this.element.elements) {
      if (this.element.currentType === OBJECT) {
        return {};
      }
      return _.map(this.element.elements, (element) => {
        return element.currentValue;
      });
    }
    return this.element.currentValue;
  }

  /**
   * Handles a change in the type.
   *
   * @param {Event} evt - The event.
   */
  handleTypeChange(evt) {
    const newType = evt.target.innerText;
    if (newType === OBJECT) {
      this.element.edit('{');
      this.element.next();
    } else {
      this.element.edit(TypeChecker.cast(this.castableValue(), newType));
    }
  }

  /**
   * Are high precision values available?
   *
   * @returns {boolean} if high precision values are available.
   */
  isHighPrecision() {
    return this._version >= HP_VERSION;
  }

  /**
   * Is the type changeable?
   *
   * @returns {Boolean} If the type is changeable.
   */
  isTypeChangeable() {
    return this.element.isValueEditable() || this.element.isAdded();
  }

  /**
   * Render the type list dropdown.
   *
   * @returns {Component} The react component.
   */
  renderDropdown() {
    return (
      <div className={this.getClassName()}>
        <button
          className="btn-crud"
          type="button"
          tabIndex="-1"
          id="types-dropdown"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false">
          {this.element.currentType}
          <span className="caret"></span>
        </button>
        <ul className="dropdown-menu" aria-labelledby="types-dropdown">
          {this.renderTypes()}
        </ul>
      </div>
    );
  }

  /**
   * Render the type list label.
   *
   * @returns {Component} The react component.
   */
  renderLabel() {
    return (
      <div className="editable-element-types">
        <span className="editable-element-types-label">{this.element.currentType}</span>
      </div>
    );
  }

  /**
   * Render the types
   *
   * @returns {Component} The react component.
   */
  renderTypes() {
    return _.map(TypeChecker.castableTypes(this.castableValue(), this.isHighPrecision()), (type) => {
      return (
        <li key={type}>
          <span onClick={this.handleTypeChange.bind(this)}>{type}</span>
        </li>
      );
    });
  }

  /**
   * Render a type list.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return this.isTypeChangeable() ? this.renderDropdown() : this.renderLabel();
  }
}

Types.displayName = 'Types';

Types.propTypes = {
  element: React.PropTypes.object.isRequired
};

module.exports = Types;
