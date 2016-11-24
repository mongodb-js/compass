const React = require('react');
const { Int32 } = require('bson');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const { Int32Value } = require('../');

describe('<Int32Value />', () => {
  const value = new Int32(123);
  const component = shallow(<Int32Value type="Int32" value={value} />);

  it('sets the base class', () => {
    expect(component.hasClass('element-value')).to.equal(true);
  });

  it('sets the type class', () => {
    expect(component.hasClass('element-value-is-int32')).to.equal(true);
  });

  it('sets the title', () => {
    expect(component.props().title).to.equal('123');
  });

  it('sets the value', () => {
    expect(component.text()).to.equal('123');
  });
});
