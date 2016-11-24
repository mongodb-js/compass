const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const { BSONRegExp } = require('bson');
const { ElementRegexValue } = require('../../');

describe('<ElementRegexValue />', () => {
  const value = new BSONRegExp('test', 'i');
  const component = shallow(<ElementRegexValue type="BSONRegExp" value={value} />);

  it('sets the base class', () => {
    expect(component.hasClass('element-value')).to.equal(true);
  });

  it('sets the type class', () => {
    expect(component.hasClass('element-value-is-bsonregexp')).to.equal(true);
  });

  it('sets the title', () => {
    expect(component.props().title).to.equal('/test/i');
  });

  it('sets the value', () => {
    expect(component.text()).to.equal('/test/i');
  });
});
