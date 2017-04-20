const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const { TextButton } = require('../');

describe('<TextButton />', () => {
  const click = () => { return true; };

  context('when the button is enabled', () => {
    const component = shallow((
      <TextButton
        text="title"
        clickHandler={click}
        className="class-name"
        dataTestId="text-button-test" />
    ));

    it('sets the base class', () => {
      expect(component.hasClass('class-name')).to.equal(true);
    });

    it('sets the text', () => {
      expect(component.text()).to.equal('title');
    });

    it('sets the data-test-id', () => {
      expect(component.props()['data-test-id']).to.equal('text-button-test');
    });
  });

  context('when the button is disabled', () => {
    const component = shallow((
      <TextButton
        text="title"
        clickHandler={click}
        className="class-name"
        disabled={true}
        dataTestId="text-button-test" />
    ));

    it('sets the disabled attribute', () => {
      expect(component.props()['disabled']).to.equal(true);
    });
  });
});
