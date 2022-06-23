import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import CrossCircle from '../cross-circle';

import styles from './cross-circle.module.less';

describe('CrossCircle [Component]', function () {
  let component;

  beforeEach(function () {
    component = mount(<CrossCircle />);
  });

  afterEach(function () {
    component = null;
  });

  it('renders the wrapper div', function () {
    expect(component.find(`.${styles['cross-circle']}`)).to.be.present();
  });
});
