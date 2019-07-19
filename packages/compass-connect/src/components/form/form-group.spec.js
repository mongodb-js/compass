import React from 'react';
import { mount } from 'enzyme';
import FormGroup from './form-group';

import styles from '../connect.less';

describe('FormGroup [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(
      <FormGroup id="testing" separator><div id="child" /></FormGroup>
    );
  });

  afterEach(() => {
    component = null;
  });

  it('sets the id', () => {
    expect(component.find('#testing')).to.be.present();
  });

  it('adds the separator class name', () => {
    expect(component.find(`.${styles['form-group-separator']}`)).to.be.present();
  });

  it('renders the children', () => {
    expect(component.find('#child')).to.be.present();
  });
});
