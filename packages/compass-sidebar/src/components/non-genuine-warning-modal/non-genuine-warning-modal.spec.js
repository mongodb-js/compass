import React from 'react';
import { mount } from 'enzyme';
import NonGenuineWarningModal, {
  MODAL_TITLE,
  LEARN_MORE_URL
} from './non-genuine-warning-modal.jsx';
import styles from './non-genuine-warning-modal.less';

describe('NonGenuineWarningModal [Component]', () => {
  let component;
  let toggleIsVisibleSpy;
  let openLinkSpy;
  context('when the modal is visible', () => {
    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();
      openLinkSpy = sinon.spy();

      component = mount(
        <NonGenuineWarningModal
          isVisible
          toggleIsVisible={toggleIsVisibleSpy}
          openLink={openLinkSpy}
        />
      );
    });

    afterEach(() => {
      toggleIsVisibleSpy = null;
      openLinkSpy = null;
      component = null;
    });

    it('displays the modal', () => {
      expect(component.find('.modal')).to.be.present();
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['non-genuine-warning-modal']}`)).to.be.present();
    });

    it('renders the header text', () => {
      expect(component.find('.modal-title')).to.have.text(MODAL_TITLE);
    });

    it('renders the continue button', () => {
      expect(component.find('[data-test-id="continue-button"]').hostNodes()).to.have.text('CONTINUE');
    });

    it('opens the learn more link', () => {
      component.find('[data-test-id="non-genuine-warning-modal-learn-more-link"]').simulate('click');
      expect(openLinkSpy.calledWith(LEARN_MORE_URL)).to.equal(true);
    });

    it('closes on continue', () => {
      component.find('[data-test-id="continue-button"]').simulate('click');
      expect(toggleIsVisibleSpy.calledOnce).to.equal(true);
    });
  });

  context('when the modal is not visible', () => {
    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();
      openLinkSpy = sinon.spy();

      component = mount(
        <NonGenuineWarningModal
          isVisible={false}
          toggleIsVisible={toggleIsVisibleSpy}
          openLink={openLinkSpy}
        />
      );
    });

    afterEach(() => {
      toggleIsVisibleSpy = null;
      openLinkSpy = null;
      component = null;
    });

    it('does not display the modal', () => {
      expect(component.find('.modal')).to.not.be.present();
    });
  });
});
