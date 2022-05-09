import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import { CreateIndexModal } from '../create-index-modal';
import styles from './create-index-modal.module.less';

describe('CreateIndexModal [Component]', function () {
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
  let toggleIsColumnstoreSpy;
  let resetFormSpy;
  let createIndexSpy;
  let openLinkSpy;
  let changeTtlSpy;
  let changePartialFilterExpressionSpy;
  let changeCollationOptionSpy;
  let changeNameSpy;
  context('when the modal is visible', function () {
    beforeEach(function () {
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
          fields={[{ name: '', type: '' }]}
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

    afterEach(function () {
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
      // Note: We unmount the component here because of a
      // race condition with leafygreen modals.
      // They both attempt to maintain autofocus and cause a large noise
      // in the test logs.
      component.unmount();
      component = null;
    });

    it('displays the modal', function () {
      expect(component.find('.modal')).to.be.present();
    });

    it('renders the correct root classname', function () {
      expect(
        component.find(`.${styles['create-index-modal']}`)
      ).to.be.present();
    });

    it('renders the header text', function () {
      expect(component.find('.modal-title')).to.have.text('Create Index');
    });

    it('renders the cancel button', function () {
      expect(
        component
          .find('[data-test-id="cancel-create-index-button"]')
          .hostNodes()
      ).to.have.text('Cancel');
    });

    it('renders the create button', function () {
      expect(
        component.find('[data-test-id="create-index-button"]').hostNodes()
      ).to.have.text('Create Index');
    });

    it('renders the modal form', function () {
      expect(
        component.find('[name="create-index-modal-form"]')
      ).to.be.present();
    });

    context('when changing the index name', function () {
      it('calls the change index name function', function () {
        component
          .find('#create-index-name')
          .hostNodes()
          .simulate('change', { target: { value: 'iName' } });
        expect(changeNameSpy.calledWith('iName')).to.equal(true);
      });
    });

    context('when adding a field', function () {
      it('calls the addField function', function () {
        component.find('#add-field').hostNodes().simulate('click');
        expect(addFieldSpy.called).to.equal(true);
      });
    });

    context('when clicking cancel', function () {
      it('closes the modal', function () {
        component
          .find('[data-test-id="cancel-create-index-button"]')
          .hostNodes()
          .simulate('click');
        expect(toggleIsVisibleSpy.calledOnce).to.equal(true);
        expect(resetFormSpy.called).to.equal(true);
      });
    });

    context('when clicking create', function () {
      it('creates the index', function () {
        component
          .find('[data-test-id="create-index-button"]')
          .hostNodes()
          .simulate('click');
        expect(createIndexSpy.called).to.equal(true);
      });
    });

    context('when clicking show options', function () {
      it('shows options', function () {
        component
          .find(`.${styles['create-index-modal-toggle-bar']}`)
          .simulate('click');
        expect(toggleShowOptionsSpy.called).to.equal(true);
      });
    });
  });

  context('when the checkbox options are visible', function () {
    beforeEach(function () {
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
      toggleIsColumnstoreSpy = sinon.spy();
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
          fields={[{ name: '', type: '' }]}
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
          toggleIsColumnstore={toggleIsColumnstoreSpy}
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

    afterEach(function () {
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
      toggleIsColumnstoreSpy = null;
      resetFormSpy = null;
      createIndexSpy = null;
      openLinkSpy = null;
      changeTtlSpy = null;
      changePartialFilterExpressionSpy = null;
      changeCollationOptionSpy = null;
      changeNameSpy = null;
      component.unmount();
      component = null;
    });

    it('displays the options', function () {
      expect(
        component.find('[data-test-id="create-index-modal-options"]')
      ).to.be.present();
    });
    context('background', function () {
      it('calls the toggleIsBackground function', function () {
        component
          .find('[data-test-id="toggle-is-background"]')
          .find('[type="checkbox"]')
          .simulate('change', { target: { checked: true } });
        expect(toggleIsBackgroundSpy.called).to.equal(true);
      });
      it('calls the clickLink function', function () {
        component
          .find('[data-test-id="toggle-is-background"]')
          .find('.info-sprinkle')
          .simulate('click');
        expect(openLinkSpy.called).to.equal(true);
      });
      context('unique', function () {
        it('calls the toggleIsUnique function', function () {
          component
            .find('[data-test-id="toggle-is-unique"]')
            .find('[type="checkbox"]')
            .simulate('change', { target: { checked: true } });
          expect(toggleIsUniqueSpy.called).to.equal(true);
        });
        it('calls the clickLink function', function () {
          component
            .find('[data-test-id="toggle-is-unique"]')
            .find('.info-sprinkle')
            .simulate('click');
          expect(openLinkSpy.called).to.equal(true);
        });
      });
      context('ttl', function () {
        it('calls the toggleIsTtl function', function () {
          component
            .find('[data-test-id="toggle-is-ttl"]')
            .find('[type="checkbox"]')
            .simulate('change', { target: { checked: true } });
          expect(toggleIsTtlSpy.called).to.equal(true);
        });
        it('calls the clickLink function', function () {
          component
            .find('[data-test-id="toggle-is-ttl"]')
            .find('.info-sprinkle')
            .simulate('click');
          expect(openLinkSpy.called).to.equal(true);
        });
      });
      context('partialFilterExpression', function () {
        it('calls the toggleIsPartialFilterExpression function', function () {
          component
            .find('[data-test-id="toggle-is-pfe"]')
            .find('[type="checkbox"]')
            .simulate('change', { target: { checked: true } });
          expect(toggleIsPartialFilterExpressionSpy.called).to.equal(true);
        });
        it('calls the clickLink function', function () {
          component
            .find('[data-test-id="toggle-is-pfe"]')
            .find('.info-sprinkle')
            .simulate('click');
          expect(openLinkSpy.called).to.equal(true);
        });
      });
      context('customCollation', function () {
        it('calls the toggleIsCustomCollation function', function () {
          component
            .find('[data-test-id="toggle-is-custom-collation"]')
            .find('[type="checkbox"]')
            .simulate('change', { target: { checked: true } });
          expect(toggleIsCustomCollationSpy.called).to.equal(true);
        });
        it('calls the clickLink function', function () {
          component
            .find('[data-test-id="toggle-is-custom-collation"]')
            .find('.info-sprinkle')
            .simulate('click');
          expect(openLinkSpy.called).to.equal(true);
        });
      });
      context(
        'serverVersion gte 6.1.0 with env variable COMPASS_COLUMNSTORE_INDEXES = true',
        function () {
          let initialEnvVars;

          before(function () {
            initialEnvVars = Object.assign({}, process.env);

            process.env.COMPASS_COLUMNSTORE_INDEXES = 'true';
          });

          after(function () {
            process.env = initialEnvVars;
          });

          beforeEach(function () {
            component.setProps({
              serverVersion: '6.1.0',
            });
          });
          context('columnstoreIndexes', function () {
            it('calls the toggleIsColumnstore function', function () {
              component
                .find('[data-test-id="toggle-is-columnstore"]')
                .find('[type="checkbox"]')
                .simulate('change', { target: { checked: true } });
              expect(toggleIsColumnstoreSpy.called).to.equal(true);
            });
          });
        }
      );
    });
  });

  context('when the options are visible', function () {
    beforeEach(function () {
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
          fields={[{ name: '', type: '' }]}
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
          serverVersion="5.0.0"
        />
      );
    });

    afterEach(function () {
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
      component.unmount();
      component = null;
    });

    it('displays the options', function () {
      expect(
        component.find('[data-test-id="create-index-modal-options"]')
      ).to.be.present();
    });
    context('ttl', function () {
      it('calls the ttl function', function () {
        component
          .find('#ttl-value')
          .find('input')
          .simulate('change', { target: { value: '101' } });
        expect(changeTtlSpy.called).to.equal(true);
        expect(changeTtlSpy.args[0][0]).to.equal('101');
      });
    });
    context('partial filter expression', function () {
      it('calls the partialFilterExpresion function', function () {
        component
          .find('#partial-filter-expression-value')
          .find('input')
          .simulate('change', { target: { value: '{"x": 1}' } });
        expect(changePartialFilterExpressionSpy.called).to.equal(true);
        expect(changePartialFilterExpressionSpy.args[0][0]).to.equal(
          '{"x": 1}'
        );
      });
    });
    context('server version is lt 6.1.0', function () {
      it('does not display the columnstore index options', function () {
        expect(
          component.find('[data-test-id="toggle-is-columnstore"]')
        ).to.not.be.present();
      });
    });
    context(
      'server version is gte 6.1.0 with env variable COMPASS_COLUMNSTORE_INDEXES = true',
      function () {
        let initialEnvVars;

        before(function () {
          initialEnvVars = Object.assign({}, process.env);

          process.env.COMPASS_COLUMNSTORE_INDEXES = 'true';
        });

        after(function () {
          process.env = initialEnvVars;
        });

        beforeEach(function () {
          component.setProps({ serverVersion: '6.1.0' });
        });

        it('displays the columnstore index projection options', function () {
          expect(
            component.find('[data-test-id="toggle-is-columnstore"]')
          ).to.be.present();
        });
      }
    );
  });

  context('when the modal is not visible', function () {
    beforeEach(function () {
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
          fields={[{ name: '', type: '' }]}
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

    afterEach(function () {
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
      component.unmount();
      component = null;
    });

    it('does not display the modal', function () {
      expect(component.find('.modal')).to.not.be.present();
    });
  });
  context('when the modal is visible and in progress', function () {
    beforeEach(function () {
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
          fields={[{ name: '', type: '' }]}
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

    afterEach(function () {
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
      component.unmount();
      component = null;
    });

    it('displays in progress message', function () {
      expect(component.find('[data-test-id="modal-message"]').text()).to.equal(
        'Create in Progress'
      );
    });
  });
  context('when the modal is visible and error', function () {
    beforeEach(function () {
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
          fields={[{ name: '', type: '' }]}
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

    afterEach(function () {
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
      component.unmount();
      component = null;
    });

    it('displays the error message', function () {
      expect(component.find('[data-test-id="modal-message"]').text()).to.equal(
        'test error'
      );
    });
  });
});
