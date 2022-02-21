import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import InputBuilder from '../input-builder';
import styles from './input-builder.module.less';

describe('InputBuilder [Component]', function() {
  let component;

  beforeEach(function() {
    component = mount(<InputBuilder openLink={sinon.spy()} />);
  });

  afterEach(function() {
    component = null;
  });

  it('renders the wrapper div', function() {
    expect(component.find(`.${styles['input-builder']}`)).to.be.present();
  });
});
