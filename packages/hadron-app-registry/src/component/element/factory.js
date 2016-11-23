'use strict';

const _ = require('lodash');
const React = require('react');
const TypeChecker = require('hadron-type-checker');

/**
 * The mappings of object types to element components. This is a mapping to
 * the path to require them in order to avoid a circular dependency between
 * the modules at load time.
 */
const MAPPINGS = {
  'Array': './array-element',
  'Binary': './binary-element',
  'Date': './date-element',
  'Decimal128': './decimal128-element',
  'Double': './double-element',
  'Int32': './int32-element',
  'Object': './object-element',
  'String': './string-element',
  'MinKey': './min-key-element',
  'MaxKey': './max-key-element',
  'Code': './code-element'
};

/**
 * The factory for creating collections of element components.
 */
class Factory {

  /**
   * Get an array of elements for the provided object.
   *
   * @param {Object} object - The object to get the elements from.
   * @param {Boolean} preExpanded - If the document is rendered expanded.
   *
   * @returns {Array} An array of element React components.
   */
  elements(object, preExpanded = false) {
    const elements = [];
    _.forOwn(object, (value, field) => {
      const type = TypeChecker.type(value);
      const elementProps = {
        field: field,
        value: value,
        type: type,
        key: field,
        preExpanded: preExpanded
      };
      elements.push(React.createElement(this._elementComponent(type), elementProps));
    });
    return elements;
  }

  /**
   * Get the element component for the type.
   *
   * @param {String} type - The type of the value.
   *
   * @returns {React.Component} The component for the type.
   */
  _elementComponent(type) {
    return require(MAPPINGS[type] || '../element');
  }
}

module.exports = new Factory();
