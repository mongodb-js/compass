import React from 'react';
import { mount } from 'enzyme';

import License from 'components/license';
import { LicenseText } from 'models';
import styles from './license.less';

describe('License [Component]', () => {
  context('when the license is visible', () => {
    let component;

    beforeEach(() => {
      component = mount(<License isVisible />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the visible modal', () => {
      expect(component.find(`.${styles['modal-is-visible']}`)).to.be.present();
    });

    it('renders the content', () => {
      expect(component.find(`.${styles['license-content']}`)).to.be.present();
    });

    it('renders the header', () => {
      expect(component.find(`.${styles['license-header']}`)).to.be.present();
    });

    it('renders the header title', () => {
      expect(component.find(`.${styles['license-header-title']}`)).
        to.have.text(LicenseText.title);
    });

    it('renders the license body', () => {
      expect(component.find(`.${styles['license-body']} p`)).
        to.have.text(LicenseText.intro);
    });

    it('renders the license footer', () => {
      expect(component.find(`.${styles['license-footer']}`)).to.be.present();
    });

    it('renders the legal link', () => {
      expect(component.find(`.${styles['license-footer']} a`)).to.have.text('legal@mongodb.com');
    });

    it('renders the agree button', () => {
      expect(component.find('.btn-primary')).to.have.text('Agree');
    });

    it('renders the disagree button', () => {
      expect(component.find('.btn-secondary')).to.have.text('Disagree');
    });
  });

  context('when the license is not visible', () => {
    let component;

    beforeEach(() => {
      component = mount(<License isVisible={false} />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the modal as hidden', () => {
      expect(component.find(`.${styles['modal-is-visible']}`)).to.not.be.present();
    });

    it('renders the default modal class', () => {
      expect(component.find(`.${styles.modal}`)).to.be.present();
    });
  });
});
