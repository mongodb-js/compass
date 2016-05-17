'use strict';

const _ = require('lodash');
const React = require('react');
const TypeChecker = require('./type-checker');

/**
 * The mappings of object types to element components. This is a mapping to
 * the path to require them in order to avoid a circular dependency between
 * the modules at load time.
 */
const MAPPINGS = {
  'Array': './array-element',
  'Date': './date-element',
  'Object': './object-element',
  'String': './string-element'
};

/**
 * The factory for creating collections of element components.
 */
class Factory {

  /**
   * Get an array of elements for the provided object.
   *
   * @param {Object} object - The object to get the elements from.
   *
   * @returns {Array} An array of element React components.
   */
  elements(object) {
    return _.map(object, (value, field) => {
      var type = TypeChecker.type(value);
      var elementProps = { field: field, value: value, type: type, key: `${object._id}_${field}` };
      return React.createElement(this._elementComponent(type), elementProps);
    });
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
