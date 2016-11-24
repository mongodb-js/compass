const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const { BsonDateValue } = require('../../');

describe('<BsonDate />', () => {
  const date = new Date('2016-01-01');
  const component = shallow(<BsonDateValue type="Date" value={date} />);

  it('sets the base class', () => {
    expect(component.hasClass('element-value')).to.equal(true);
  });

  it('sets the type class', () => {
    expect(component.hasClass('element-value-is-date')).to.equal(true);
  });

  it('sets the title', () => {
    expect(component.props().title).to.contain('2016-01-01');
  });

  it('sets the value', () => {
    expect(component.text()).to.contain('2016-01-01');
  });
});
