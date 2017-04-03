const React = require('react');
const chaiEnzyme = require('chai-enzyme');
const chai = require('chai');
const expect = chai.expect;
const { mount } = require('enzyme');
const { StoreConnector } = require('../');

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
