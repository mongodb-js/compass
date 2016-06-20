'use strict';

const React = require('react');
const Element = require('hadron-document').Element;
const TypeChecker = require('hadron-type-checker');

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
    this.state = { type: this.element.currentType };
  }

  /**
   * Render a type list.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <div className='dropdown types'>
        <button
          className='btn btn-default dropdown-toggle'
          type='button'
          id='types-dropdown'
          data-toggle='dropdown'
          aria-haspopup='true'
          aria-expanded='false'>
          {this.element.currentType}
          <span className='caret'></span>
        </button>
        <ul className='dropdown-menu' aria-labelledby='types-dropdown'>
          {this.castableTypes()}
        </ul>
      </div>
    );
  }

  castableTypes() {
    return _.map(TypeChecker.castableTypes(this.castableValue()), (type) => {
      return (
        <li key={type}>
          <span onClick={this.handleTypeChange.bind(this)}>{type}</span>
        </li>
      );
    });
  }

  castableValue() {
    if (this.element.elements) {
      if (this.element.currentType === 'Object') {
        return {};
      }
      return _.map(this.element.elements, (element) => {
        return element.currentValue;
      });
    }
    return this.element.currentValue;
  }

  handleTypeChange(evt) {
    this.element.edit(TypeChecker.cast(this.castableValue(), evt.target.innerText));
    this.setState({ type: this.element.currentType });
  }
}

Types.displayName = 'Types';

module.exports = Types;
