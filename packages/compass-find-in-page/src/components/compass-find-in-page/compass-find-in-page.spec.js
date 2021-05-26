import React from 'react';
import { mount } from 'enzyme';

import CompassFindInPage from '../compass-find-in-page';
import FindInPageInput from '../find-in-page-input';

import { toggleStatus } from '../../modules';
import store from '../../stores';

describe('CompassFindInPage [Component]', () => {
  context('when the component is rendered and status is enabled', () => {
    let component;

    beforeEach(() => {
      store.dispatch(toggleStatus());
      component = mount(
        <CompassFindInPage store={store}/>
      );
    });

    afterEach(() => {
      store.dispatch(toggleStatus());
      component = null;
    });

    it('should contain FindInPageInput', () => {
      expect(component.find('[data-test-id="find-in-page"]')).to.be.present();
    });

    it('should contain FindInPageInput', () => {
      expect(component.find('[data-test-id="find-in-page"]')).to.have.descendants(FindInPageInput);
    });
  });
});
