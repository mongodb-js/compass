'use strict';

var _require = require('react-dnd'),
    DragDropContext = _require.DragDropContext;

var HTML5Backend = require('react-dnd-html5-backend').default;

var context = void 0;

/**
 * Wrap a component in a singleton drag drop context.
 *
 * @param {React.Component} component - The component.
 *
 * @returns {React.Component} The wrapped component.
 */
var WithDragDropContext = function WithDragDropContext(component) {
  if (!context) {
    context = DragDropContext(HTML5Backend);
  }
  return context(component);
};

module.exports = WithDragDropContext;