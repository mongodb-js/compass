const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const { Timestamp } = require('bson');
const { TimestampValue } = require('../');

describe('<Value /> (rendering timestamp)', () => {
  const value = new Timestamp({ t: 12345, i: 10 });
  const component = shallow(<TimestampValue type="Timestamp" value={value} />);

  it('sets the base class', () => {
    expect(component.hasClass('element-value')).to.equal(true);
  });

  it('sets the type class', () => {
    expect(component.hasClass('element-value-is-timestamp')).to.equal(true);
  });

  it('sets the title', () => {
    expect(component.props().title).to.equal('Timestamp({ t: 12345, i: 10 })');
  });

  it('sets the value', () => {
    expect(component.text()).to.equal('Timestamp({ t: 12345, i: 10 })');
  });
});
