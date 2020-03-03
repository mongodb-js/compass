import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

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

export default WithDragDropContext;
