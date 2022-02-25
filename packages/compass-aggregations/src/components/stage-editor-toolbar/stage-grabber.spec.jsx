import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import StageGrabber from './stage-grabber';
import styles from './stage-grabber.module.less';

describe('StageGrabber [Component]', function() {
  let component;

  beforeEach(function() {
    component = mount(<StageGrabber />);
  });

  afterEach(function() {
    component = null;
  });

  it('renders the wrapper div', function() {
    expect(component.find(`.${styles['stage-grabber']}`)).to.be.present();
  });

  it('renders the icon', function() {
    expect(component.find('.fa-bars')).to.be.present();
  });
});
