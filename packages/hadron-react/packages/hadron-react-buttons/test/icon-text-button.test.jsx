const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const { IconTextButton } = require('../');

describe('<IconTextButton />', () => {
  const click = () => { return true; };
  const component = shallow((
    <IconTextButton
      text="text"
      clickHandler={click}
      className="class-name"
      iconClassName="icon-class-name"
      dataTestId="icon-button-test" />
  ));

  it('sets the base class', () => {
    expect(component.hasClass('class-name')).to.equal(true);
  });

  it('sets the data-test-id', () => {
    expect(component.props()['data-test-id']).to.equal('icon-button-test');
  });
});
