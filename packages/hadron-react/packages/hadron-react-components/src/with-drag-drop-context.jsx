const { DragDropContext } = require('react-dnd');
const HTML5Backend = require('react-dnd-html5-backend').default;

let context;

/**
 * Wrap a component in a singleton drag drop context.
 *
 * @param {React.Component} component - The component.
 *
 * @returns {React.Component} The wrapped component.
 */
const WithDragDropContext = (component) => {
  if (!context) {
    context = DragDropContext(HTML5Backend);
  }
  return context(component);
};

module.exports = WithDragDropContext;
