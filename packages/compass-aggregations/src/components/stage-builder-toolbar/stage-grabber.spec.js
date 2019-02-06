import React from 'react';
import { mount } from 'enzyme';

import StageGrabber from './stage-grabber';
import styles from './stage-grabber.less';

describe('StageGrabber [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<StageGrabber />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['stage-grabber']}`)).to.be.present();
  });

  it('renders the icon', () => {
    expect(component.find('.fa-bars')).to.be.present();
  });
});
