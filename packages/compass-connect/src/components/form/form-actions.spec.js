import React from 'react';
import { mount } from 'enzyme';
import FormActions from './form-actions';

import styles from '../connect.less';

describe('FormActions [Component]', () => {
  const connection = { name: 'myconnection' };
  let component;

  beforeEach(() => {
    component = mount(<FormActions currentConnection={connection} />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['form-group']}`)).to.be.present();
  });

  it('renders the name', () => {
    expect(component.find('input[name="favoriteName"]')).to.have.value('myconnection');
  });
});
