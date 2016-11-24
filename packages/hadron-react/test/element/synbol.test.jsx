const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const { Symbol } = require('bson');
const { ElementValue } = require('../../');

describe('<ElementValue /> (rendering string)', () => {
  const value = new Symbol('testing');
  const component = shallow(<ElementValue type="Symbol" value={value} />);

  it('sets the base class', () => {
    expect(component.hasClass('element-value')).to.equal(true);
  });

  it('sets the type class', () => {
    expect(component.hasClass('element-value-is-symbol')).to.equal(true);
  });

  it('sets the title', () => {
    expect(component.props().title).to.equal('testing');
  });

  it('sets the value', () => {
    expect(component.text()).to.equal('testing');
  });
});
