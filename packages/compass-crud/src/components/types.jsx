const _ = require('lodash');
const React = require('react');
const PropTypes = require('prop-types');
const TypeChecker = require('hadron-type-checker');
const { DateEditor } = require('./editor');

require('bootstrap/js/dropdown');

/**
 * Object constant.
 */
const OBJECT = 'Object';

/**
 * Array constant.
 */
const ARRAY = 'Array';

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
    this.state = { isOpen: false };
    this.element = props.element;
    this._version = global.hadronApp.instance.build.version;
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
    return this.state.isOpen ? `${className}` : `${className} closed`;
  }

  /**
   * Get the castable value for this value.
   *
   * @returns {Object} The cast value.
   */
  castableValue() {
    return this.element.generateObject();
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
    } else if (newType === ARRAY) {
      this.element.edit('[');
      this.element.next();
    } else {
      try {
        if (newType === 'Date') {
          const editor = new DateEditor(this.element);
          editor.edit(this.castableValue());
          editor.complete();
        } else {
          const value = TypeChecker.cast(this.castableValue(), newType);
          this.element.edit(value);
        }
      } catch (e) {
        this.element.setInvalid(this.element.currentValue, newType, e.message);
      }
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

  removeOpenClass() {
    this.setState({ isOpen: !this.state.isOpen });
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
          tabIndex="0"
          id="types-dropdown"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
          onBlur={this.removeOpenClass.bind(this)}
          >
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
   * Render the types
   *
   * @returns {Component} The react component.
   */
  renderTypes() {
    return _.map(TypeChecker.castableTypes(this.isHighPrecision()), (type) => {
      return (
        <li key={type}>
          <span onMouseDown={this.handleTypeChange.bind(this)}>{type}</span>
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
    return this.renderDropdown();
  }
}

Types.displayName = 'Types';

Types.propTypes = {
  element: PropTypes.object.isRequired
};

module.exports = Types;
