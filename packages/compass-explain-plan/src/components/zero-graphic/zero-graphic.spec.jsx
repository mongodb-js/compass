import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import ZeroGraphic from '../zero-graphic';
import styles from './zero-graphic.module.less';

describe('ZeroGraphic [Component]', function() {
  let component;

  beforeEach(function() {
    component = shallow(<ZeroGraphic />);
  });

  afterEach(function() {
    component = null;
  });

  it('renders the wrapper div', function() {
    expect(component.find(`.${styles['zero-graphic']}`)).to.be.present();
  });
});
