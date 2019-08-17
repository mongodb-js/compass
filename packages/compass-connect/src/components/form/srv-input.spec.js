import React from 'react';
import { mount } from 'enzyme';
import SRVInput from './srv-input';

import styles from '../connect.less';

describe('SRVInput [Component]', () => {
  context('when the connection is not an srv record', () => {
    let component;

    beforeEach(() => {
      component = mount(<SRVInput isSrvRecord={false} />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the wrapper div', () => {
      expect(component.find(`.${styles['form-item']}`)).to.be.present();
    });

    it('renders the label', () => {
      expect(component.find(`.${styles['form-item']} label`)).to.have.text('SRV Record');
    });

    it('renders the switch', () => {
      expect(component.find(`.${styles['form-control-switch']}`)).to.be.present();
    });
  });

  context('when the connection is an srv record', () => {
    let component;

    beforeEach(() => {
      component = mount(<SRVInput isSrvRecord />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the wrapper div', () => {
      expect(component.find(`.${styles['form-item']}`)).to.be.present();
    });

    it('renders the label', () => {
      expect(component.find(`.${styles['form-item']} label`)).to.have.text('SRV Record');
    });

    it('enables the switch', () => {
      expect(component.find('input')).to.have.prop('checked', true);
    });
  });
});
