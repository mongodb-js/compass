import React from 'react';
import { mount } from 'enzyme';

import CreateIndexButton from 'components/create-index-button';
import CreateIndexModal from 'components/create-index-modal';

describe('create-index-button [Component]', () => {
  let component;
  let toggleIsVisibleSpy;

  describe('not visible', () => {
    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();
      component = mount(<CreateIndexButton toggleIsVisible={toggleIsVisibleSpy}/>);
    });

    afterEach(() => {
      toggleIsVisibleSpy = null;
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find('.create-index-btn')).to.be.present();
    });

    it('renders a button', () => {
      expect(
        component.find('[data-test-id="open-create-index-modal-button"]')
      ).to.be.present();
    });
    it('renders a createIndexModal', () => {
      expect(component.find(CreateIndexModal)).to.be.present();
    });
    // it('calls toggleIsVisible on click', () => {
    //   component.find('[data-test-id="open-create-index-modal-button"]').simulate('click');
    //   expect(toggleIsVisibleSpy.calledOnce).to.equal(true);
    // });
  });
});
