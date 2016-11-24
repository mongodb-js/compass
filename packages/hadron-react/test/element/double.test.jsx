const React = require('react');
const { Double } = require('bson');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const { ElementDoubleValue } = require('../../');

describe('<ElementDoubleValue />', () => {
  const value = new Double(123.45);
  const component = shallow(<ElementDoubleValue type="Double" value={value} />);

  it('sets the base class', () => {
    expect(component.hasClass('element-value')).to.equal(true);
  });

  it('sets the type class', () => {
    expect(component.hasClass('element-value-is-double')).to.equal(true);
  });

  it('sets the title', () => {
    expect(component.props().title).to.equal('123.45');
  });

  it('sets the value', () => {
    expect(component.text()).to.equal('123.45');
  });
});
