import React from 'react';
import { mount } from 'enzyme';
import { CreateIndexModal } from 'components/create-index-modal';
import styles from './create-index-modal.less';

describe('CreateIndexModal [Component]', () => {
  let component;
  let toggleIsVisibleSpy;
  let updateFieldNameSpy;
  let updateFiedTypeSpy;
  let addFieldSpy;
  let removeFieldSpy;
  let toggleIsUniqueSpy;
  let toggleShowOptionsSpy;
  let toggleIsBackgroundSpy;
  let toggleIsTtlSpy;
  let toggleIsPartialFilterExpressionSpy;
  let toggleIsCustomCollationSpy;
  let resetFormSpy;
  let createIndexSpy;
  let openLinkSpy;
  let changeTtlSpy;
  let changePartialFilterExpressionSpy;
  let changeCollationOptionSpy;
  let changeNameSpy;
  context('when the modal is visible', () => {
    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();
      updateFiedTypeSpy = sinon.spy();
      updateFieldNameSpy = sinon.spy();
      addFieldSpy = sinon.spy();
      removeFieldSpy = sinon.spy();
      toggleIsUniqueSpy = sinon.spy();
      toggleShowOptionsSpy = sinon.spy();
      toggleIsBackgroundSpy = sinon.spy();
      toggleIsTtlSpy = sinon.spy();
      toggleIsPartialFilterExpressionSpy = sinon.spy();
      toggleIsCustomCollationSpy = sinon.spy();
      resetFormSpy = sinon.spy();
      createIndexSpy = sinon.spy();
      openLinkSpy = sinon.spy();
      changeTtlSpy = sinon.spy();
      changePartialFilterExpressionSpy = sinon.spy();
      changeCollationOptionSpy = sinon.spy();
      changeNameSpy = sinon.spy();

      component = mount(
        <CreateIndexModal
          showOptions={false}
          inProgress={false}
          schemaFields={[]}
          fields={[{name: '', type: ''}]}
          dataService={{}}
          isBackground={false}
          isUnique={false}
          isTtl={false}
          ttl=""
          isPartialFilterExpression={false}
          partialFilterExpression=""
          isCustomCollation={false}
          collation={{}}
          name=""
          isVisible
          toggleIsVisible={toggleIsVisibleSpy}
          updateFieldName={updateFieldNameSpy}
          updateFieldType={updateFiedTypeSpy}
          addField={addFieldSpy}
          removeField={removeFieldSpy}
          toggleIsUnique={toggleIsUniqueSpy}
          toggleShowOptions={toggleShowOptionsSpy}
          toggleIsBackground={toggleIsBackgroundSpy}
          toggleIsTtl={toggleIsTtlSpy}
          toggleIsPartialFilterExpression={toggleIsPartialFilterExpressionSpy}
          toggleIsCustomCollation={toggleIsCustomCollationSpy}
          resetForm={resetFormSpy}
          createIndex={createIndexSpy}
          openLink={openLinkSpy}
          changeTtl={changeTtlSpy}
          changePartialFilterExpression={changePartialFilterExpressionSpy}
          changeCollationOption={changeCollationOptionSpy}
          changeName={changeNameSpy}
        />
      );
    });

    afterEach(() => {
      toggleIsVisibleSpy = null;
      updateFiedTypeSpy = null;
      updateFieldNameSpy = null;
      addFieldSpy = null;
      removeFieldSpy = null;
      toggleIsUniqueSpy = null;
      toggleShowOptionsSpy = null;
      toggleIsBackgroundSpy = null;
      toggleIsTtlSpy = null;
      toggleIsPartialFilterExpressionSpy = null;
      toggleIsCustomCollationSpy = null;
      resetFormSpy = null;
      createIndexSpy = null;
      openLinkSpy = null;
      changeTtlSpy = null;
      changePartialFilterExpressionSpy = null;
      changeCollationOptionSpy = null;
      changeNameSpy = null;
      component = null;
    });

    it('displays the modal', () => {
      expect(component.find('.modal')).to.be.present();
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['create-index-modal']}`)).to.be.present();
    });

    it('renders the header text', () => {
      expect(component.find('.modal-title')).to.have.text('Create Index');
    });

    it('renders the cancel button', () => {
      expect(component.find('[data-test-id="cancel-create-index-button"]').hostNodes()).to.have.text('Cancel');
    });

    it('renders the create button', () => {
      expect(component.find('[data-test-id="create-index-button"]').hostNodes()).to.have.text('Create Index');
    });

    it('renders the modal form', () => {
      expect(component.find('[name="create-index-modal-form"]')).to.be.present();
    });

    context('when changing the index name', () => {
      it('calls the change index name function', () => {
        component.find('#create-index-name').hostNodes().simulate('change', {target: {value: 'iName'}});
        expect(changeNameSpy.calledWith('iName')).to.equal(true);
      });
    });

    context('when adding a field', () => {
      it('calls the addField function', () => {
        component.find('#add-field').hostNodes().simulate('click');
        expect(addFieldSpy.called).to.equal(true);
      });
    });

    context('when clicking cancel', () => {
      it('closes the modal', () => {
        component.find('[data-test-id="cancel-create-index-button"]').hostNodes().simulate('click');
        expect(toggleIsVisibleSpy.calledOnce).to.equal(true);
        expect(resetFormSpy.called).to.equal(true);
      });
    });

    context('when clicking create', () => {
      it('creates the index', () => {
        component.find('[data-test-id="create-index-button"]').hostNodes().simulate('click');
        expect(createIndexSpy.called).to.equal(true);
      });
    });

    context('when clicking show options', () => {
      it('shows options', () => {
        component.find(`.${styles['create-index-modal-toggle-bar']}`).simulate('click');
        expect(toggleShowOptionsSpy.called).to.equal(true);
      });
    });
  });

  context('when the checkbox options are visible', () => {
    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();
      updateFiedTypeSpy = sinon.spy();
      updateFieldNameSpy = sinon.spy();
      addFieldSpy = sinon.spy();
      removeFieldSpy = sinon.spy();
      toggleIsUniqueSpy = sinon.spy();
      toggleShowOptionsSpy = sinon.spy();
      toggleIsBackgroundSpy = sinon.spy();
      toggleIsTtlSpy = sinon.spy();
      toggleIsPartialFilterExpressionSpy = sinon.spy();
      toggleIsCustomCollationSpy = sinon.spy();
      resetFormSpy = sinon.spy();
      createIndexSpy = sinon.spy();
      openLinkSpy = sinon.spy();
      changeTtlSpy = sinon.spy();
      changePartialFilterExpressionSpy = sinon.spy();
      changeCollationOptionSpy = sinon.spy();
      changeNameSpy = sinon.spy();

      component = mount(
        <CreateIndexModal
          showOptions
          inProgress={false}
          schemaFields={[]}
          fields={[{name: '', type: ''}]}
          dataService={{}}
          isBackground={false}
          isUnique={false}
          isTtl={false}
          ttl=""
          isPartialFilterExpression={false}
          partialFilterExpression=""
          isCustomCollation={false}
          collation={{}}
          name=""
          isVisible
          toggleIsVisible={toggleIsVisibleSpy}
          updateFieldName={updateFieldNameSpy}
          updateFieldType={updateFiedTypeSpy}
          addField={addFieldSpy}
          removeField={removeFieldSpy}
          toggleIsUnique={toggleIsUniqueSpy}
          toggleShowOptions={toggleShowOptionsSpy}
          toggleIsBackground={toggleIsBackgroundSpy}
          toggleIsTtl={toggleIsTtlSpy}
          toggleIsPartialFilterExpression={toggleIsPartialFilterExpressionSpy}
          toggleIsCustomCollation={toggleIsCustomCollationSpy}
          resetForm={resetFormSpy}
          createIndex={createIndexSpy}
          openLink={openLinkSpy}
          changeTtl={changeTtlSpy}
          changePartialFilterExpression={changePartialFilterExpressionSpy}
          changeCollationOption={changeCollationOptionSpy}
          changeName={changeNameSpy}
        />
      );
    });

    afterEach(() => {
      toggleIsVisibleSpy = null;
      updateFiedTypeSpy = null;
      updateFieldNameSpy = null;
      addFieldSpy = null;
      removeFieldSpy = null;
      toggleIsUniqueSpy = null;
      toggleShowOptionsSpy = null;
      toggleIsBackgroundSpy = null;
      toggleIsTtlSpy = null;
      toggleIsPartialFilterExpressionSpy = null;
      toggleIsCustomCollationSpy = null;
      resetFormSpy = null;
      createIndexSpy = null;
      openLinkSpy = null;
      changeTtlSpy = null;
      changePartialFilterExpressionSpy = null;
      changeCollationOptionSpy = null;
      changeNameSpy = null;
      component = null;
    });

    it('displays the options', () => {
      expect(
        component.find('[data-test-id="create-index-modal-options"]')
      ).to.be.present();
    });
    context('background', () => {
      it('calls the toggleIsBackground function', () => {
        component.find('[data-test-id="toggle-is-background"]').find('[type="checkbox"]').simulate('change', { target: { checked: true } });
        expect(toggleIsBackgroundSpy.called).to.equal(true);
      });
      it('calls the clickLink function', () => {
        component.find('[data-test-id="toggle-is-background"]').find('.info-sprinkle').simulate('click');
        expect(openLinkSpy.called).to.equal(true);
      });
      context('unique', () => {
        it('calls the toggleIsUnique function', () => {
          component.find('[data-test-id="toggle-is-unique"]').find('[type="checkbox"]').simulate('change', { target: { checked: true } });
          expect(toggleIsUniqueSpy.called).to.equal(true);
        });
        it('calls the clickLink function', () => {
          component.find('[data-test-id="toggle-is-unique"]').find('.info-sprinkle').simulate('click');
          expect(openLinkSpy.called).to.equal(true);
        });
      });
      context('ttl', () => {
        it('calls the toggleIsTtl function', () => {
          component.find('[data-test-id="toggle-is-ttl"]').find('[type="checkbox"]').simulate('change', { target: { checked: true } });
          expect(toggleIsTtlSpy.called).to.equal(true);
        });
        it('calls the clickLink function', () => {
          component.find('[data-test-id="toggle-is-ttl"]').find('.info-sprinkle').simulate('click');
          expect(openLinkSpy.called).to.equal(true);
        });
      });
      context('partialFilterExpression', () => {
        it('calls the toggleIsPartialFilterExpression function', () => {
          component.find('[data-test-id="toggle-is-pfe"]').find('[type="checkbox"]').simulate('change', { target: { checked: true } });
          expect(toggleIsPartialFilterExpressionSpy.called).to.equal(true);
        });
        it('calls the clickLink function', () => {
          component.find('[data-test-id="toggle-is-pfe"]').find('.info-sprinkle').simulate('click');
          expect(openLinkSpy.called).to.equal(true);
        });
      });
      context('customCollation', () => {
        it('calls the toggleIsCustomCollation function', () => {
          component.find('[data-test-id="toggle-is-custom-collation"]').find('[type="checkbox"]').simulate('change', { target: { checked: true } });
          expect(toggleIsCustomCollationSpy.called).to.equal(true);
        });
        it('calls the clickLink function', () => {
          component.find('[data-test-id="toggle-is-custom-collation"]').find('.info-sprinkle').simulate('click');
          expect(openLinkSpy.called).to.equal(true);
        });
      });
    });
  });

  context('when the options are visible', () => {
    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();
      updateFiedTypeSpy = sinon.spy();
      updateFieldNameSpy = sinon.spy();
      addFieldSpy = sinon.spy();
      removeFieldSpy = sinon.spy();
      toggleIsUniqueSpy = sinon.spy();
      toggleShowOptionsSpy = sinon.spy();
      toggleIsBackgroundSpy = sinon.spy();
      toggleIsTtlSpy = sinon.spy();
      toggleIsPartialFilterExpressionSpy = sinon.spy();
      toggleIsCustomCollationSpy = sinon.spy();
      resetFormSpy = sinon.spy();
      createIndexSpy = sinon.spy();
      openLinkSpy = sinon.spy();
      changeTtlSpy = sinon.spy();
      changePartialFilterExpressionSpy = sinon.spy();
      changeCollationOptionSpy = sinon.spy();
      changeNameSpy = sinon.spy();

      component = mount(
        <CreateIndexModal
          showOptions
          inProgress={false}
          schemaFields={[]}
          fields={[{name: '', type: ''}]}
          dataService={{}}
          isBackground
          isUnique
          isTtl
          ttl=""
          isPartialFilterExpression
          partialFilterExpression=""
          isCustomCollation={false}
          collation={{}}
          name=""
          isVisible
          toggleIsVisible={toggleIsVisibleSpy}
          updateFieldName={updateFieldNameSpy}
          updateFieldType={updateFiedTypeSpy}
          addField={addFieldSpy}
          removeField={removeFieldSpy}
          toggleIsUnique={toggleIsUniqueSpy}
          toggleShowOptions={toggleShowOptionsSpy}
          toggleIsBackground={toggleIsBackgroundSpy}
          toggleIsTtl={toggleIsTtlSpy}
          toggleIsPartialFilterExpression={toggleIsPartialFilterExpressionSpy}
          toggleIsCustomCollation={toggleIsCustomCollationSpy}
          resetForm={resetFormSpy}
          createIndex={createIndexSpy}
          openLink={openLinkSpy}
          changeTtl={changeTtlSpy}
          changePartialFilterExpression={changePartialFilterExpressionSpy}
          changeCollationOption={changeCollationOptionSpy}
          changeName={changeNameSpy}
        />
      );
    });

    afterEach(() => {
      toggleIsVisibleSpy = null;
      updateFiedTypeSpy = null;
      updateFieldNameSpy = null;
      addFieldSpy = null;
      removeFieldSpy = null;
      toggleIsUniqueSpy = null;
      toggleShowOptionsSpy = null;
      toggleIsBackgroundSpy = null;
      toggleIsTtlSpy = null;
      toggleIsPartialFilterExpressionSpy = null;
      toggleIsCustomCollationSpy = null;
      resetFormSpy = null;
      createIndexSpy = null;
      openLinkSpy = null;
      changeTtlSpy = null;
      changePartialFilterExpressionSpy = null;
      changeCollationOptionSpy = null;
      changeNameSpy = null;
      component = null;
    });

    it('displays the options', () => {
      expect(
        component.find('[data-test-id="create-index-modal-options"]')
      ).to.be.present();
    });
    context('ttl', () => {
      it('calls the ttl function', () => {
        component.find('#ttl-value').find('input').simulate('change', { target: { value: '101' } });
        expect(changeTtlSpy.called).to.equal(true);
        expect(changeTtlSpy.args[0][0]).to.equal('101');
      });
    });
    context('partial filter expression', () => {
      it('calls the partialFilterExpresion function', () => {
        component.find('#partial-filter-expression-value').find('input').simulate('change', { target: { value: '{"x": 1}' } });
        expect(changePartialFilterExpressionSpy.called).to.equal(true);
        expect(changePartialFilterExpressionSpy.args[0][0]).to.equal('{"x": 1}');
      });
    });
  });

  context('when the modal is not visible', () => {
    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();
      updateFiedTypeSpy = sinon.spy();
      updateFieldNameSpy = sinon.spy();
      addFieldSpy = sinon.spy();
      removeFieldSpy = sinon.spy();
      toggleIsUniqueSpy = sinon.spy();
      toggleShowOptionsSpy = sinon.spy();
      toggleIsBackgroundSpy = sinon.spy();
      toggleIsTtlSpy = sinon.spy();
      toggleIsPartialFilterExpressionSpy = sinon.spy();
      toggleIsCustomCollationSpy = sinon.spy();
      resetFormSpy = sinon.spy();
      createIndexSpy = sinon.spy();
      openLinkSpy = sinon.spy();
      changeTtlSpy = sinon.spy();
      changePartialFilterExpressionSpy = sinon.spy();
      changeCollationOptionSpy = sinon.spy();
      changeNameSpy = sinon.spy();

      component = mount(
        <CreateIndexModal
          showOptions={false}
          inProgress={false}
          schemaFields={[]}
          fields={[{name: '', type: ''}]}
          dataService={{}}
          isBackground={false}
          isUnique={false}
          isTtl={false}
          ttl=""
          isPartialFilterExpression={false}
          partialFilterExpression=""
          isCustomCollation={false}
          collation={{}}
          name=""
          isVisible={false}
          toggleIsVisible={toggleIsVisibleSpy}
          updateFieldName={updateFieldNameSpy}
          updateFieldType={updateFiedTypeSpy}
          addField={addFieldSpy}
          removeField={removeFieldSpy}
          toggleIsUnique={toggleIsUniqueSpy}
          toggleShowOptions={toggleShowOptionsSpy}
          toggleIsBackground={toggleIsBackgroundSpy}
          toggleIsTtl={toggleIsTtlSpy}
          toggleIsPartialFilterExpression={toggleIsPartialFilterExpressionSpy}
          toggleIsCustomCollation={toggleIsCustomCollationSpy}
          resetForm={resetFormSpy}
          createIndex={createIndexSpy}
          openLink={openLinkSpy}
          changeTtl={changeTtlSpy}
          changePartialFilterExpression={changePartialFilterExpressionSpy}
          changeCollationOption={changeCollationOptionSpy}
          changeName={changeNameSpy}
        />
      );
    });

    afterEach(() => {
      toggleIsVisibleSpy = null;
      updateFiedTypeSpy = null;
      updateFieldNameSpy = null;
      addFieldSpy = null;
      removeFieldSpy = null;
      toggleIsUniqueSpy = null;
      toggleShowOptionsSpy = null;
      toggleIsBackgroundSpy = null;
      toggleIsTtlSpy = null;
      toggleIsPartialFilterExpressionSpy = null;
      toggleIsCustomCollationSpy = null;
      resetFormSpy = null;
      createIndexSpy = null;
      openLinkSpy = null;
      changeTtlSpy = null;
      changePartialFilterExpressionSpy = null;
      changeCollationOptionSpy = null;
      changeNameSpy = null;
      component = null;
    });

    it('does not display the modal', () => {
      expect(component.find('.modal')).to.not.be.present();
    });
  });
  context('when the modal is visible and in progress', () => {
    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();
      updateFiedTypeSpy = sinon.spy();
      updateFieldNameSpy = sinon.spy();
      addFieldSpy = sinon.spy();
      removeFieldSpy = sinon.spy();
      toggleIsUniqueSpy = sinon.spy();
      toggleShowOptionsSpy = sinon.spy();
      toggleIsBackgroundSpy = sinon.spy();
      toggleIsTtlSpy = sinon.spy();
      toggleIsPartialFilterExpressionSpy = sinon.spy();
      toggleIsCustomCollationSpy = sinon.spy();
      resetFormSpy = sinon.spy();
      createIndexSpy = sinon.spy();
      openLinkSpy = sinon.spy();
      changeTtlSpy = sinon.spy();
      changePartialFilterExpressionSpy = sinon.spy();
      changeCollationOptionSpy = sinon.spy();
      changeNameSpy = sinon.spy();
      component = mount(
        <CreateIndexModal
          showOptions={false}
          inProgress
          schemaFields={[]}
          fields={[{name: '', type: ''}]}
          dataService={{}}
          isBackground={false}
          isUnique={false}
          isTtl={false}
          ttl=""
          isPartialFilterExpression={false}
          partialFilterExpression=""
          isCustomCollation={false}
          collation={{}}
          name=""
          isVisible
          toggleIsVisible={toggleIsVisibleSpy}
          updateFieldName={updateFieldNameSpy}
          updateFieldType={updateFiedTypeSpy}
          addField={addFieldSpy}
          removeField={removeFieldSpy}
          toggleIsUnique={toggleIsUniqueSpy}
          toggleShowOptions={toggleShowOptionsSpy}
          toggleIsBackground={toggleIsBackgroundSpy}
          toggleIsTtl={toggleIsTtlSpy}
          toggleIsPartialFilterExpression={toggleIsPartialFilterExpressionSpy}
          toggleIsCustomCollation={toggleIsCustomCollationSpy}
          resetForm={resetFormSpy}
          createIndex={createIndexSpy}
          openLink={openLinkSpy}
          changeTtl={changeTtlSpy}
          changePartialFilterExpression={changePartialFilterExpressionSpy}
          changeCollationOption={changeCollationOptionSpy}
          changeName={changeNameSpy}
        />
      );
    });

    afterEach(() => {
      toggleIsVisibleSpy = null;
      updateFiedTypeSpy = null;
      updateFieldNameSpy = null;
      addFieldSpy = null;
      removeFieldSpy = null;
      toggleIsUniqueSpy = null;
      toggleShowOptionsSpy = null;
      toggleIsBackgroundSpy = null;
      toggleIsTtlSpy = null;
      toggleIsPartialFilterExpressionSpy = null;
      toggleIsCustomCollationSpy = null;
      resetFormSpy = null;
      createIndexSpy = null;
      openLinkSpy = null;
      changeTtlSpy = null;
      changePartialFilterExpressionSpy = null;
      changeCollationOptionSpy = null;
      changeNameSpy = null;
      component = null;
    });

    it('displays in progress message', () => {
      expect(
        component.find('[data-test-id="modal-message"]').text()
      ).to.equal('Create in Progress');
    });
  });
  context('when the modal is visible and error', () => {
    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();
      updateFiedTypeSpy = sinon.spy();
      updateFieldNameSpy = sinon.spy();
      addFieldSpy = sinon.spy();
      removeFieldSpy = sinon.spy();
      toggleIsUniqueSpy = sinon.spy();
      toggleShowOptionsSpy = sinon.spy();
      toggleIsBackgroundSpy = sinon.spy();
      toggleIsTtlSpy = sinon.spy();
      toggleIsPartialFilterExpressionSpy = sinon.spy();
      toggleIsCustomCollationSpy = sinon.spy();
      resetFormSpy = sinon.spy();
      createIndexSpy = sinon.spy();
      openLinkSpy = sinon.spy();
      changeTtlSpy = sinon.spy();
      changePartialFilterExpressionSpy = sinon.spy();
      changeCollationOptionSpy = sinon.spy();
      changeNameSpy = sinon.spy();
      component = mount(
        <CreateIndexModal
          showOptions={false}
          inProgress={false}
          schemaFields={[]}
          fields={[{name: '', type: ''}]}
          dataService={{}}
          isBackground={false}
          isUnique={false}
          isTtl={false}
          ttl=""
          isPartialFilterExpression={false}
          partialFilterExpression=""
          isCustomCollation={false}
          collation={{}}
          name=""
          isVisible
          error="test error"
          toggleIsVisible={toggleIsVisibleSpy}
          updateFieldName={updateFieldNameSpy}
          updateFieldType={updateFiedTypeSpy}
          addField={addFieldSpy}
          removeField={removeFieldSpy}
          toggleIsUnique={toggleIsUniqueSpy}
          toggleShowOptions={toggleShowOptionsSpy}
          toggleIsBackground={toggleIsBackgroundSpy}
          toggleIsTtl={toggleIsTtlSpy}
          toggleIsPartialFilterExpression={toggleIsPartialFilterExpressionSpy}
          toggleIsCustomCollation={toggleIsCustomCollationSpy}
          resetForm={resetFormSpy}
          createIndex={createIndexSpy}
          openLink={openLinkSpy}
          changeTtl={changeTtlSpy}
          changePartialFilterExpression={changePartialFilterExpressionSpy}
          changeCollationOption={changeCollationOptionSpy}
          changeName={changeNameSpy}
        />
      );
    });

    afterEach(() => {
      toggleIsVisibleSpy = null;
      updateFiedTypeSpy = null;
      updateFieldNameSpy = null;
      addFieldSpy = null;
      removeFieldSpy = null;
      toggleIsUniqueSpy = null;
      toggleShowOptionsSpy = null;
      toggleIsBackgroundSpy = null;
      toggleIsTtlSpy = null;
      toggleIsPartialFilterExpressionSpy = null;
      toggleIsCustomCollationSpy = null;
      resetFormSpy = null;
      createIndexSpy = null;
      openLinkSpy = null;
      changeTtlSpy = null;
      changePartialFilterExpressionSpy = null;
      changeCollationOptionSpy = null;
      changeNameSpy = null;
      component = null;
    });

    it('displays the error message', () => {
      expect(component.find('[data-test-id="modal-message"]').text()).to.equal('test error');
    });
  });
});
