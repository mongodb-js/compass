import React from 'react';
import { mount } from 'enzyme';

import CnameInput from './cname-input';
import styles from '../../../connect.less';

describe('<CnameInput />', () => {
  describe('#render', () => {
    context('when the connection is not canonicalizing the host name', () => {
      const component = mount(<CnameInput canonicalize_hostname={false} />);

      it('renders the wrapper div', () => {
        expect(component.find(`.${styles['form-item']}`)).to.be.present();
      });

      it('renders the label', () => {
        expect(component.find('label')).to.have.text('Canonicalize Host Name');
      });

      it('renders the switch', () => {
        expect(component.find(`.${styles['form-control-switch']}`)).to.be.present();
      });
    });

    context('when the connection is canonicalizing the host name', () => {
      const component = mount(<CnameInput canonicalize_hostname />);

      it('renders the wrapper div', () => {
        expect(component.find(`.${styles['form-item']}`)).to.be.present();
      });

      it('renders the label', () => {
        expect(component.find('label')).to.have.text('Canonicalize Host Name');
      });

      it('enables the switch', () => {
        expect(component.find('input')).to.have.prop('checked', true);
      });
    });
  });
});
