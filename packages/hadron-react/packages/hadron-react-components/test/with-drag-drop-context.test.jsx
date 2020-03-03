import React from 'react';
import { expect } from 'chai';
import { WithDragDropContext } from '../';

class Component extends React.Component {
  render() {
    return(<div>test</div>);
  }
}

Component.displayName = 'Component';

describe('#WithDragDropContext', () => {
  it('wraps the component in the context', () => {
    expect(WithDragDropContext(Component).displayName).to.equal('DragDropContext(Component)');
  });
});
