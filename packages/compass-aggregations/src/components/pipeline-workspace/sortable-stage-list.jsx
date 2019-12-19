import React, { Component } from 'react';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import PropTypes from 'prop-types';
import SortableStageContainer from './sortable-stage-container';

class SortableStageList extends Component {
  static propTypes = {
    items: PropTypes.array.isRequired,
    onMove: PropTypes.func.isRequired,
    renderItem: PropTypes.func.isRequired
  };

  render() {
    const items = this.props.items;

    return (
      <DndProvider backend={HTML5Backend}>
        {items.map((item, i) => {
          return (<SortableStageContainer
            key={i}
            index={i}
            onMove={this.props.onMove}>
            {this.props.renderItem(item, i)}
          </SortableStageContainer>);
        })}
      </DndProvider>
    );
  }
}

export default SortableStageList;
