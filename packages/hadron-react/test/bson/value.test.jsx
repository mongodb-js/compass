const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const { BsonValue } = require('../../');

describe('<BsonValue />', () => {
  const component = shallow(<BsonValue type="String" value="testing" />);

  it('sets the base class', () => {
    expect(component.hasClass('element-value')).to.equal(true);
  });

  it('sets the type class', () => {
    expect(component.hasClass('element-value-is-string')).to.equal(true);
  });

  it('sets the title', () => {
    expect(component.props().title).to.equal('testing');
  });

  it('sets the value', () => {
    expect(component.text()).to.equal('testing');
  });
});
