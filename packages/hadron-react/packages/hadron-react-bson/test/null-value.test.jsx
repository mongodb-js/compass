const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const { Value } = require('../');

describe('<Value /> (rendering null)', () => {
  const component = shallow(<Value type="Null" value={null} />);

  it('sets the base class', () => {
    expect(component.hasClass('element-value')).to.equal(true);
  });

  it('sets the type class', () => {
    expect(component.hasClass('element-value-is-null')).to.equal(true);
  });

  it('sets the title', () => {
    expect(component.props().title).to.equal('null');
  });

  it('sets the value', () => {
    expect(component.text()).to.equal('null');
  });
});
