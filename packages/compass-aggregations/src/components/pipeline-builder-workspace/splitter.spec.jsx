import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import Splitter from './splitter';
import styles from './splitter.module.less';

describe('Splitter [Component]', function() {
  let component;

  afterEach(function() {
    component = null;
  });

  it('renders the wrapper div', function() {
    component = mount(<Splitter />);
    expect(component.find(`.${styles.splitter}`)).to.be.present();
  });
});
