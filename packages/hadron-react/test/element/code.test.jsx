const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const { Code } = require('bson');
const { ElementCodeValue } = require('../../');

describe('<ElementCodeValue />', () => {
  const code = new Code('this.a > i', { i: 1 });
  const component = shallow(<ElementCodeValue type="Code" value={code} />);
  const value = 'Code(\'this.a > i\', {"i":1})'

  it('sets the base class', () => {
    expect(component.hasClass('element-value')).to.equal(true);
  });

  it('sets the type class', () => {
    expect(component.hasClass('element-value-is-code')).to.equal(true);
  });

  it('sets the title', () => {
    expect(component.props().title).to.equal(value);
  });

  it('sets the value', () => {
    expect(component.text()).to.equal(value);
  });
});
