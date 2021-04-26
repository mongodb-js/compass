import React from 'react';
import chaiEnzyme from 'chai-enzyme';
import chai, { expect } from 'chai';
import { mount } from 'enzyme';
import { StoreConnector } from '../';

chai.use(chaiEnzyme());

describe('<StoreConnector />', () => {
  class MyComponent extends React.Component {
    render() {
      return (<div className="test"></div>);
    }
  }
  const store = {
    getInitialState: () => {
      return {};
    },
    listen: () => {
    }
  };
  const component = mount(
    <StoreConnector store={store}>
      <MyComponent />
    </StoreConnector>
  );

  it('sets the child component', () => {
    expect(component.find('.test')).to.exist;
  });
});
