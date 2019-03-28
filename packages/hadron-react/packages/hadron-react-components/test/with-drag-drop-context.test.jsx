const React = require('react');
const { expect } = require('chai');
const chai = require('chai');
const { WithDragDropContext } = require('../');

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
