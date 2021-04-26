import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { TextButton } from '../';

describe('<TextButton />', () => {
  const click = () => {
    return true;
  };

  context('when the button is enabled', () => {
    const component = shallow(
      <TextButton
        title="title"
        text="button text"
        id="testing"
        clickHandler={click}
        className="class-name"
        style={{ color: 'green' }}
        dataTestId="text-button-test"
      />
    );

    it('sets the base class', () => {
      expect(component.hasClass('class-name')).to.equal(true);
    });

    it('sets the text', () => {
      expect(component.text()).to.equal('button text');
    });

    it('sets the data-test-id', () => {
      expect(component.props()['data-test-id']).to.equal('text-button-test');
    });

    it('sets the title', () => {
      expect(component.props()['title']).to.equal('title');
    });

    it('sets the id', () => {
      expect(component.props()['id']).to.equal('testing');
    });

    it('sets the style', () => {
      expect(component.props()['style']).to.deep.equal({ color: 'green' });
    });
  });

  context('when the button is disabled', () => {
    const component = shallow(
      <TextButton
        text="button text"
        clickHandler={click}
        className="class-name"
        disabled={true}
        dataTestId="text-button-test"
      />
    );

    it('sets the disabled attribute', () => {
      expect(component.props()['disabled']).to.equal(true);
    });
  });
});
