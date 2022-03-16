import React from 'react';
import { mount } from 'enzyme';
import { Modal, Button, H3 } from '@mongodb-js/compass-components';
import NonGenuineWarningModal from './non-genuine-warning-modal.jsx';

describe('NonGenuineWarningModal [Component]', () => {
  let component;
  let toggleIsVisibleSpy;
  context('when the modal is visible', () => {
    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();

      component = mount(
        <NonGenuineWarningModal
          isVisible
          toggleIsVisible={toggleIsVisibleSpy}
        />
      );
    });

    afterEach(async() => {
      toggleIsVisibleSpy = null;
      component = null;
    });

    it('displays the modal', () => {
      expect(component.find(Modal)).to.be.present();
    });

    it('renders the header text', () => {
      expect(component.find(H3)).to.have.text('Non-Genuine MongoDB Detected');
    });

    it('renders the continue button', () => {
      expect(component.find('[data-test-id="continue-button"]').hostNodes()).to.have.text('Continue');
    });

    it('opens the learn more link', () => {
      expect(component.find('[data-test-id="non-genuine-warning-modal-learn-more-link"]').hostNodes().props().href).to.equal(
        'https://docs.mongodb.com/compass/master/faq/#how-does-compass-determine-a-connection-is-not-genuine'
      );
    });

    it('closes on continue', () => {
      component.find('[data-test-id="continue-button"]').hostNodes().simulate('click');
      expect(toggleIsVisibleSpy.calledOnce).to.equal(true);
    });
  });

  context('when the modal is not visible', () => {
    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();

      component = mount(
        <div>
          <NonGenuineWarningModal
            isVisible={false}
            toggleIsVisible={toggleIsVisibleSpy}
          />
        </div>
      );
    });

    afterEach(() => {
      toggleIsVisibleSpy = null;
      component = null;
    });

    it('does not display the modal', () => {
      expect(component.find(Button)).to.not.be.present();
    });
  });
});
