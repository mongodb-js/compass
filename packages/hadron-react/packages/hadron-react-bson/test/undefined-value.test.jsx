const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const { Value } = require('../');

describe('<Value /> (rendering undefined)', () => {
  const component = shallow(<Value type="Undefined" value={undefined} />);

  it('sets the base class', () => {
    expect(component.hasClass('element-value')).to.equal(true);
  });

  it('sets the type class', () => {
    expect(component.hasClass('element-value-is-undefined')).to.equal(true);
  });

  it('sets the title', () => {
    expect(component.props().title).to.equal('undefined');
  });

  it('sets the value', () => {
    expect(component.text()).to.equal('undefined');
  });
});
