import React from 'react';
import { mount } from 'enzyme';

import Connecting from './connecting';

const delay = (amt) => new Promise((resolve) => setTimeout(resolve, amt));

describe('Connecting [Component]', () => {
  let component;

  before(() => {
    window.requestAnimationFrame = () => {};
  });

  beforeEach(() => {
    component = mount(<Connecting
      connectingStatusText="connecting..."
      currentConnectionAttempt={undefined}
    />);
  });

  afterEach(() => {
    component = null;
  });

  it('has show modal false by default', () => {
    expect(component.state('showModal')).to.equal(false);
  });

  it('sets show modal true after 250ms', async() => {
    component.setProps({
      currentConnectionAttempt: { truthyObject: true }
    });

    await delay(5);

    expect(component.state('showModal')).to.equal(false);

    await delay(300);

    expect(component.state('showModal')).to.equal(true);
  });

  it('does not set show modal true if currentConnectionAttempt is set to false', async() => {
    component.setProps({
      currentConnectionAttempt: { truthyObject: true }
    });

    await delay(5);

    expect(component.state('showModal')).to.equal(false);

    component.setProps({
      currentConnectionAttempt: undefined
    });

    await delay(300);

    expect(component.state('showModal')).to.equal(false);
  });
});
