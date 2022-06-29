import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import LoadingOverlay from '../loading-overlay';
import styles from './loading-overlay.module.less';

describe('LoadingOverlay [Component]', function () {
  context('when the component is rendered', function () {
    let component;

    beforeEach(function () {
      component = mount(<LoadingOverlay text="Loading..." />);
    });

    afterEach(function () {
      component = null;
    });

    it('renders the correct root classname', function () {
      expect(component.find(`.${styles['loading-overlay']}`)).to.be.present();
    });

    it('renders the icon', function () {
      expect(component.find('.fa.fa-circle-o-notch.fa-spin')).to.be.present();
    });

    it('renders the text', function () {
      expect(
        component.find(`.${styles['loading-overlay-box-text']}`)
      ).to.have.text('Loading...');
    });
  });
});
