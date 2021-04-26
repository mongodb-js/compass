import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { AnimatedIconTextButton } from '../';

describe('<AnimatedIconTextButton />', () => {
  const click = () => { return true; };
  const stop = () => { return true; };
  const component = shallow(
    <AnimatedIconTextButton
      text="text"
      clickHandler={click}
      stopAnimationListenable={stop}
      className="class-name"
      iconClassName="icon-class-name"
      animatingIconClassName="animating-icon-class-name"
      dataTestId="icon-button-test" />
  , { disableLifecycleMethods: true });

  it('sets the base class', () => {
    expect(component.hasClass('class-name')).to.equal(true);
  });

  it('sets the data-test-id', () => {
    expect(component.props()['data-test-id']).to.equal('icon-button-test');
  });
});
