import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import CheckCircle from '../check-circle';

import styles from './check-circle.module.less';

describe('CheckCircle [Component]', function () {
  let component;

  beforeEach(function () {
    component = mount(<CheckCircle />);
  });

  afterEach(function () {
    component = null;
  });

  it('renders the wrapper div', function () {
    expect(component.find(`.${styles['check-circle']}`)).to.be.present();
  });
});
