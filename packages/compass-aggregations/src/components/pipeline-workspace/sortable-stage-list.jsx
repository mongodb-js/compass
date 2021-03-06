import React, { Component } from 'react';
import { DndProvider } from 'react-dnd';
import createHTML5Backend from 'react-dnd-html5-backend';
import PropTypes from 'prop-types';
import CustomDragLayer from './custom-drag-layer';
import SortableStageContainer from './sortable-stage-container';

// A replacement for default react-dnd global context selection strategy that
// makes sure that we prioritize `window` as a global context instead of
// `global` specifically to make sure that jsdom environments are working
function getGlobalContext() {
  if (typeof window !== 'undefined') {
    return window;
  } else if (typeof global !== 'undefined') {
    return global;
  }
  return null;
}

function createBackend(manager) {
  return createHTML5Backend(manager, getGlobalContext());
}

class SortableStageList extends Component {
  static propTypes = {
    items: PropTypes.array.isRequired,
    onMove: PropTypes.func.isRequired,
    renderItem: PropTypes.func.isRequired
  };

  render() {
    const {
      items,
      onMove,
      renderItem
    } = this.props;

    return (
      <DndProvider backend={createBackend}>
        <CustomDragLayer />
        {items.map((item, i) => (
          <SortableStageContainer
            key={i}
            index={i}
            stageOperator={item.stageOperator}
            onMove={onMove}
            renderItem={renderItem}
            item={item}
          />
        ))}
      </DndProvider>
    );
  }
}

export default SortableStageList;
