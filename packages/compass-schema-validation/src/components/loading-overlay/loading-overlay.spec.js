import React from 'react';
import { mount } from 'enzyme';

import LoadingOverlay from 'components/loading-overlay';
import styles from './loading-overlay.less';

describe('LoadingOverlay [Component]', () => {
  context('when the component is rendered', () => {
    let component;

    beforeEach(() => {
      component = mount(<LoadingOverlay text="Loading..." />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['loading-overlay']}`)).to.be.present();
    });

    it('renders the icon', () => {
      expect(component.find('.fa.fa-circle-o-notch.fa-spin')).to.be.present();
    });

    it('renders the text', () => {
      expect(component.find(`.${styles['loading-overlay-box-text']}`)).
        to.have.text('Loading...');
    });
  });
});
