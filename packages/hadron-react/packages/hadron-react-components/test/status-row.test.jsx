const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const { StatusRow } = require('../');

describe('<StatusRow />', () => {
  const component = shallow(
    <StatusRow style="error">
      <p>bad things</p>
    </StatusRow>
  );

  it('sets the base class', () => {
    expect(component.hasClass('status-row')).to.equal(true);
  });

  it('sets the state class', () => {
    expect(component.hasClass('status-row-has-error')).to.equal(true);
  });

  it('sets the child div', () => {
    expect(component.find('p')).to.have.length(1);
  });

  it('sets the child text', () => {
    expect(component.find('p').text()).to.equal('bad things');
  });
});
