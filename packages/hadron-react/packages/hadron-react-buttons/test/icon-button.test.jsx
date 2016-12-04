const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const { IconButton } = require('../');

describe('<IconButton />', () => {
  const click = () => { return true; };
  const component = shallow((
    <IconButton
      title="title"
      clickHandler={click}
      className="class-name"
      iconClassName="icon-class-name"
      dataTestId="icon-button-test" />
  ));

  it('sets the base class', () => {
    expect(component.hasClass('class-name')).to.equal(true);
  });

  it('sets the title', () => {
    expect(component.props().title).to.equal('title');
  });

  it('sets the data-test-id', () => {
    expect(component.props()['data-test-id']).to.equal('icon-button-test');
  });

  it('sets the child icon class name', () => {
    expect(component.children().props().className).to.equal('icon-class-name');
  });
});
