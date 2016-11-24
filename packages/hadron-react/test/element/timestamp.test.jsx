const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const { Timestamp } = require('bson');
const { ElementValue } = require('../../');

describe('<ElementValue /> (rendering timestamp)', () => {
  const value = Timestamp.ZERO
  const component = shallow(<ElementValue type="Timestamp" value={value} />);

  it('sets the base class', () => {
    expect(component.hasClass('element-value')).to.equal(true);
  });

  it('sets the type class', () => {
    expect(component.hasClass('element-value-is-timestamp')).to.equal(true);
  });

  it('sets the title', () => {
    expect(component.props().title).to.equal('0');
  });

  it('sets the value', () => {
    expect(component.text()).to.equal('0');
  });
});
