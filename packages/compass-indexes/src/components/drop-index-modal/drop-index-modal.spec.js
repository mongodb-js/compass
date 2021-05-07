import React from 'react';
import { mount } from 'enzyme';
import { DropIndexModal } from 'components/drop-index-modal';
import styles from './drop-index-modal.less';

describe('DropIndexModal [Component]', () => {
  let component;
  let toggleIsVisibleSpy;
  let toggleInProgressSpy;
  let changeConfirmNameSpy;
  let resetFormSpy;
  let dropIndexSpy;
  context('when the modal is visible and names do not match', () => {
    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();
      toggleInProgressSpy = sinon.spy();
      changeConfirmNameSpy = sinon.spy();
      resetFormSpy = sinon.spy();
      dropIndexSpy = sinon.spy();
      component = mount(
        <DropIndexModal
          isVisible
          inProgress={false}
          name="test name"
          confirmName=""
          toggleIsVisible={toggleIsVisibleSpy}
          toggleInProgress={toggleInProgressSpy}
          changeConfirmName={changeConfirmNameSpy}
          resetForm={resetFormSpy}
          dropIndex={dropIndexSpy}
        />
      );
    });

    afterEach(() => {
      toggleIsVisibleSpy = null;
      toggleInProgressSpy = null;
      changeConfirmNameSpy = null;
      resetFormSpy = null;
      dropIndexSpy = null;
      component = null;
    });

    it('displays the modal', () => {
      expect(component.find('.modal')).to.be.present();
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['drop-index-modal']}`)).to.be.present();
    });

    it('renders the header text', () => {
      expect(component.find('.modal-title')).to.have.text('Drop Index');
    });

    it('renders the cancel button', () => {
      expect(component.find('[data-test-id="cancel-drop-index-button"]').hostNodes()).to.have.text('Cancel');
    });

    it('renders the drop button', () => {
      expect(component.find('[data-test-id="drop-index-button"]').hostNodes()).to.have.text('Drop');
    });

    it('renders the modal form', () => {
      expect(component.find('[data-test-id="confirm-drop-index-name"]')).to.be.present();
    });

    context('when changing the confirm index name', () => {
      it('calls the change confirm index name function', () => {
        component.find('[data-test-id="confirm-drop-index-name"]').hostNodes().simulate('change', {target: {value: 'iName'}});
        expect(changeConfirmNameSpy.calledWith('iName')).to.equal(true);
      });
    });
    context('when clicking cancel', () => {
      it('closes the modal', () => {
        component.find('[data-test-id="cancel-drop-index-button"]').hostNodes().simulate('click');
        expect(toggleIsVisibleSpy.calledOnce).to.equal(true);
        expect(resetFormSpy.called).to.equal(true);
      });
    });
    context('when clicking drop', () => {
      it('does not drop the index', () => {
        component.find('[data-test-id="drop-index-button"]').hostNodes().simulate('click');
        expect(dropIndexSpy.called).to.equal(false);
      });
    });
  });

  context('when the modal is visible and names match', () => {
    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();
      toggleInProgressSpy = sinon.spy();
      changeConfirmNameSpy = sinon.spy();
      resetFormSpy = sinon.spy();
      dropIndexSpy = sinon.spy();
      component = mount(
        <DropIndexModal
          isVisible
          inProgress={false}
          name="test name"
          confirmName="test name"
          toggleIsVisible={toggleIsVisibleSpy}
          toggleInProgress={toggleInProgressSpy}
          changeConfirmName={changeConfirmNameSpy}
          resetForm={resetFormSpy}
          dropIndex={dropIndexSpy}
        />
      );
    });

    afterEach(() => {
      toggleIsVisibleSpy = null;
      toggleInProgressSpy = null;
      changeConfirmNameSpy = null;
      resetFormSpy = null;
      dropIndexSpy = null;
      component = null;
    });

    context('when clicking drop', () => {
      it('drops the index', () => {
        component.find('[data-test-id="drop-index-button"]').hostNodes().simulate('click');
        expect(dropIndexSpy.called).to.equal(true);
        // expect(dropIndexSpy.args[0][0]).to.equal('test name');
      });
    });
  });

  context('when the modal is visible and in progress', () => {
    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();
      toggleInProgressSpy = sinon.spy();
      changeConfirmNameSpy = sinon.spy();
      resetFormSpy = sinon.spy();
      dropIndexSpy = sinon.spy();
      component = mount(
        <DropIndexModal
          isVisible
          inProgress
          name="test name"
          confirmName=""
          toggleIsVisible={toggleIsVisibleSpy}
          toggleInProgress={toggleInProgressSpy}
          changeConfirmName={changeConfirmNameSpy}
          resetForm={resetFormSpy}
          dropIndex={dropIndexSpy}
        />
      );
    });

    afterEach(() => {
      toggleIsVisibleSpy = null;
      toggleInProgressSpy = null;
      changeConfirmNameSpy = null;
      resetFormSpy = null;
      dropIndexSpy = null;
      component = null;
    });

    it('displays in progress message', () => {
      expect(
        component.find('[data-test-id="modal-message"]').text()
      ).to.equal('Drop in Progress');
    });
  });
  context('when the modal is visible and error', () => {
    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();
      toggleInProgressSpy = sinon.spy();
      changeConfirmNameSpy = sinon.spy();
      resetFormSpy = sinon.spy();
      dropIndexSpy = sinon.spy();
      component = mount(
        <DropIndexModal
          isVisible
          inProgress={false}
          error="test error"
          name="test name"
          confirmName=""
          toggleIsVisible={toggleIsVisibleSpy}
          toggleInProgress={toggleInProgressSpy}
          changeConfirmName={changeConfirmNameSpy}
          resetForm={resetFormSpy}
          dropIndex={dropIndexSpy}
        />
      );
    });

    afterEach(() => {
      toggleIsVisibleSpy = null;
      toggleInProgressSpy = null;
      changeConfirmNameSpy = null;
      resetFormSpy = null;
      dropIndexSpy = null;
      component = null;
    });

    it('displays the error message', () => {
      expect(component.find('[data-test-id="modal-message"]').text()).to.equal('test error');
    });
  });
  context('when the modal is not visible', () => {
    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();
      toggleInProgressSpy = sinon.spy();
      changeConfirmNameSpy = sinon.spy();
      resetFormSpy = sinon.spy();
      dropIndexSpy = sinon.spy();
      component = mount(
        <DropIndexModal
          isVisible={false}
          inProgress={false}
          name="test name"
          confirmName=""
          toggleIsVisible={toggleIsVisibleSpy}
          toggleInProgress={toggleInProgressSpy}
          changeConfirmName={changeConfirmNameSpy}
          resetForm={resetFormSpy}
          dropIndex={dropIndexSpy}
        />
      );
    });

    afterEach(() => {
      toggleIsVisibleSpy = null;
      toggleInProgressSpy = null;
      changeConfirmNameSpy = null;
      resetFormSpy = null;
      dropIndexSpy = null;
      component = null;
    });

    it('displays the error message', () => {
      expect(component.find('.modal')).to.not.be.present();
    });
  });
});
