import React from 'react';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
import hadronApp from 'hadron-app';

import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import CreateIndexForm from '../create-index-form';

import sinon from 'sinon';

describe('CreateIndexForm Component', function () {
  let toggleIsVisibleSpy;
  let updateFieldNameSpy;
  let updateFiedTypeSpy;
  let addFieldSpy;
  let removeFieldSpy;
  let toggleIsUniqueSpy;
  let toggleIsTtlSpy;
  let toggleIsPartialFilterExpressionSpy;
  let toggleIsCustomCollationSpy;
  let toggleHasColumnstoreProjectionSpy;
  let toggleHasWildcardProjectionSpy;
  let resetFormSpy;
  let createIndexSpy;
  let openLinkSpy;
  let changeTtlSpy;
  let changePartialFilterExpressionSpy;
  let collationStringChangedSpy;
  let changeNameSpy;
  let columnstoreProjectionChangedSpy;
  let wildcardProjectionChangedSpy;
  let createNewIndexFieldSpy;
  let toggleHasIndexNameSpy;
  let clearErrorSpy;

  const spyComponentProps = () => {
    toggleIsVisibleSpy = sinon.spy();
    updateFiedTypeSpy = sinon.spy();
    updateFieldNameSpy = sinon.spy();
    addFieldSpy = sinon.spy();
    removeFieldSpy = sinon.spy();
    toggleIsUniqueSpy = sinon.spy();
    toggleIsTtlSpy = sinon.spy();
    toggleIsPartialFilterExpressionSpy = sinon.spy();
    toggleIsCustomCollationSpy = sinon.spy();
    toggleHasColumnstoreProjectionSpy = sinon.spy();
    toggleHasWildcardProjectionSpy = sinon.spy();
    resetFormSpy = sinon.spy();
    createIndexSpy = sinon.spy();
    openLinkSpy = sinon.spy();
    changeTtlSpy = sinon.spy();
    changePartialFilterExpressionSpy = sinon.spy();
    collationStringChangedSpy = sinon.spy();
    changeNameSpy = sinon.spy();
    columnstoreProjectionChangedSpy = sinon.spy();
    wildcardProjectionChangedSpy = sinon.spy();
    createNewIndexFieldSpy = sinon.spy();
    toggleHasIndexNameSpy = sinon.spy();
    clearErrorSpy = sinon.spy();
  };

  const resetSpyComponentProps = () => {
    toggleIsVisibleSpy = null;
    updateFiedTypeSpy = null;
    updateFieldNameSpy = null;
    addFieldSpy = null;
    removeFieldSpy = null;
    toggleIsUniqueSpy = null;
    toggleIsTtlSpy = null;
    toggleIsPartialFilterExpressionSpy = null;
    toggleIsCustomCollationSpy = null;
    toggleHasColumnstoreProjectionSpy = null;
    toggleHasWildcardProjectionSpy = null;
    resetFormSpy = null;
    createIndexSpy = null;
    openLinkSpy = null;
    changeTtlSpy = null;
    changePartialFilterExpressionSpy = null;
    collationStringChangedSpy = null;
    changeNameSpy = null;
    columnstoreProjectionChangedSpy = null;
    wildcardProjectionChangedSpy = null;
    createNewIndexFieldSpy = null;
    toggleHasIndexNameSpy = null;
    clearErrorSpy = null;
  };

  before(function () {
    const appRegistry = new AppRegistry();
    global.hadronApp = hadronApp;
    global.hadronApp.appRegistry = appRegistry;
  });

  describe('server version 5.0.0', function () {
    context('when initial state', function () {
      beforeEach(function () {
        spyComponentProps();
        render(
          <CreateIndexForm
            inProgress={false}
            schemaFields={[]}
            fields={[{ name: '', type: '' }]}
            isUnique={false}
            isTtl={false}
            ttl=""
            isPartialFilterExpression={false}
            partialFilterExpression=""
            isCustomCollation={false}
            name=""
            hasIndexName={false}
            namespace="db.coll"
            newIndexField=""
            isVisible
            toggleIsVisible={toggleIsVisibleSpy}
            updateFieldName={updateFieldNameSpy}
            updateFieldType={updateFiedTypeSpy}
            addField={addFieldSpy}
            removeField={removeFieldSpy}
            toggleIsUnique={toggleIsUniqueSpy}
            toggleIsTtl={toggleIsTtlSpy}
            toggleIsPartialFilterExpression={toggleIsPartialFilterExpressionSpy}
            toggleIsCustomCollation={toggleIsCustomCollationSpy}
            toggleHasWildcardProjection={toggleHasWildcardProjectionSpy}
            toggleHasColumnstoreProjection={toggleHasColumnstoreProjectionSpy}
            resetForm={resetFormSpy}
            createIndex={createIndexSpy}
            openLink={openLinkSpy}
            changeTtl={changeTtlSpy}
            changePartialFilterExpression={changePartialFilterExpressionSpy}
            collationStringChanged={collationStringChangedSpy}
            changeName={changeNameSpy}
            wildcardProjection=""
            hasWildcardProjection={false}
            columnstoreProjection=""
            hasColumnstoreProjection={false}
            serverVersion="4.0.0"
            columnstoreProjectionChanged={columnstoreProjectionChangedSpy}
            wildcardProjectionChanged={wildcardProjectionChangedSpy}
            createNewIndexField={createNewIndexFieldSpy}
            toggleHasIndexName={toggleHasIndexNameSpy}
            clearError={clearErrorSpy}
          />
        );
      });

      afterEach(function () {
        resetSpyComponentProps();
        cleanup();
      });

      it('renders create index form component', function () {
        const createIndexForm = screen.getByTestId('create-index-form');
        expect(createIndexForm).to.exist;
        const createIndexFields = screen.getByTestId('create-index-fields-line-0');
        expect(createIndexFields).to.exist;
        const createIndexOptions = screen.getByTestId(
          'create-index-modal-toggle-options'
        );
        expect(createIndexOptions).to.exist;
      });

      context('when the checkbox options are expanded', function () {
        beforeEach(function () {
          const createIndexOptions = screen.getByTestId(
            'create-index-modal-toggle-options'
          );
          fireEvent.click(createIndexOptions);
        });

        context('unique', function () {
          it('calls the toggleIsUnique function', function () {
            const checkbox = screen.getByTestId(
              'create-index-modal-is-unique-checkbox'
            );
            fireEvent.click(checkbox);
            expect(toggleIsUniqueSpy).to.have.been.calledWith(true);
          });
        });

        context('index name', function () {
          it('calls the toggleHasIndexName functions', function () {
            const checkbox = screen.getByTestId(
              'create-index-modal-has-index-name-checkbox'
            );
            fireEvent.click(checkbox);
            expect(toggleHasIndexNameSpy).to.have.been.calledWith(true);
          });
        });

        context('ttl', function () {
          it('calls the toggleIsTtl functions', function () {
            const checkbox = screen.getByTestId(
              'create-index-modal-is-ttl-checkbox'
            );
            fireEvent.click(checkbox);
            expect(toggleIsTtlSpy).to.have.been.calledWith(true);
          });
        });

        context('partial filter expression', function () {
          it('calls the toggleIsPartialFilterExpression functions', function () {
            const checkbox = screen.getByTestId(
              'create-index-modal-is-pfe-checkbox'
            );
            fireEvent.click(checkbox);
            expect(toggleIsPartialFilterExpressionSpy).to.have.been.calledWith(
              true
            );
          });
        });

        context('custom collation', function () {
          it('calls the toggleIsCustomCollation functions', function () {
            const checkbox = screen.getByTestId(
              'create-index-modal-is-custom-collation-checkbox'
            );
            fireEvent.click(checkbox);
            expect(toggleIsCustomCollationSpy).to.have.been.calledWith(true);
          });
        });

        context('wildcard projection', function () {
          it('calls the toggleHasWildcardProjection functions', function () {
            const checkbox = screen.getByTestId(
              'create-index-modal-has-wildcard-checkbox'
            );
            fireEvent.click(checkbox);
            expect(toggleHasWildcardProjectionSpy).to.have.been.calledWith(
              true
            );
          });
        });

        context('columnstore projection', function () {
          it('does not display columnstore projection checkbox', function () {
            const checkbox = screen.queryByTestId(
              'create-index-modal-has-columnstore-checkbox'
            );
            expect(checkbox).to.not.exist;
          });
        });
      });
    });

    context('with index name', function () {
      before(function () {
        spyComponentProps();
        render(
          <CreateIndexForm
            inProgress={false}
            schemaFields={[]}
            fields={[{ name: '', type: '' }]}
            isUnique={false}
            isTtl={false}
            ttl=""
            isPartialFilterExpression={false}
            partialFilterExpression=""
            isCustomCollation={false}
            name=""
            hasIndexName={true}
            namespace="db.coll"
            newIndexField=""
            isVisible
            toggleIsVisible={toggleIsVisibleSpy}
            updateFieldName={updateFieldNameSpy}
            updateFieldType={updateFiedTypeSpy}
            addField={addFieldSpy}
            removeField={removeFieldSpy}
            toggleIsUnique={toggleIsUniqueSpy}
            toggleIsTtl={toggleIsTtlSpy}
            toggleIsPartialFilterExpression={toggleIsPartialFilterExpressionSpy}
            toggleIsCustomCollation={toggleIsCustomCollationSpy}
            toggleHasWildcardProjection={toggleHasWildcardProjectionSpy}
            toggleHasColumnstoreProjection={toggleHasColumnstoreProjectionSpy}
            resetForm={resetFormSpy}
            createIndex={createIndexSpy}
            openLink={openLinkSpy}
            changeTtl={changeTtlSpy}
            changePartialFilterExpression={changePartialFilterExpressionSpy}
            collationStringChanged={collationStringChangedSpy}
            changeName={changeNameSpy}
            wildcardProjection=""
            hasWildcardProjection={false}
            columnstoreProjection=""
            hasColumnstoreProjection={false}
            serverVersion="4.0.0"
            columnstoreProjectionChanged={columnstoreProjectionChangedSpy}
            wildcardProjectionChanged={wildcardProjectionChangedSpy}
            createNewIndexField={createNewIndexFieldSpy}
            toggleHasIndexName={toggleHasIndexNameSpy}
            clearError={clearErrorSpy}
          />
        );
      });

      after(function () {
        resetSpyComponentProps();
        cleanup();
      });

      it('calls the changeName function', function () {
        const createIndexOptions = screen.getByTestId(
          'create-index-modal-toggle-options'
        );
        fireEvent.click(createIndexOptions);
        const input = screen.getByTestId(
          'create-index-modal-has-index-name-input'
        );
        fireEvent.change(input, { target: { value: 'Name' } });
        expect(changeNameSpy).to.have.been.calledWith('Name');
      });
    });

    context('with ttl', function () {
      before(function () {
        spyComponentProps();
        render(
          <CreateIndexForm
            inProgress={false}
            schemaFields={[]}
            fields={[{ name: '', type: '' }]}
            isUnique={false}
            isTtl={true}
            ttl=""
            isPartialFilterExpression={false}
            partialFilterExpression=""
            isCustomCollation={false}
            name=""
            hasIndexName={false}
            namespace="db.coll"
            newIndexField=""
            isVisible
            toggleIsVisible={toggleIsVisibleSpy}
            updateFieldName={updateFieldNameSpy}
            updateFieldType={updateFiedTypeSpy}
            addField={addFieldSpy}
            removeField={removeFieldSpy}
            toggleIsUnique={toggleIsUniqueSpy}
            toggleIsTtl={toggleIsTtlSpy}
            toggleIsPartialFilterExpression={toggleIsPartialFilterExpressionSpy}
            toggleIsCustomCollation={toggleIsCustomCollationSpy}
            toggleHasWildcardProjection={toggleHasWildcardProjectionSpy}
            toggleHasColumnstoreProjection={toggleHasColumnstoreProjectionSpy}
            resetForm={resetFormSpy}
            createIndex={createIndexSpy}
            openLink={openLinkSpy}
            changeTtl={changeTtlSpy}
            changePartialFilterExpression={changePartialFilterExpressionSpy}
            collationStringChanged={collationStringChangedSpy}
            changeName={changeNameSpy}
            wildcardProjection=""
            hasWildcardProjection={false}
            columnstoreProjection=""
            hasColumnstoreProjection={false}
            serverVersion="4.0.0"
            columnstoreProjectionChanged={columnstoreProjectionChangedSpy}
            wildcardProjectionChanged={wildcardProjectionChangedSpy}
            createNewIndexField={createNewIndexFieldSpy}
            toggleHasIndexName={toggleHasIndexNameSpy}
            clearError={clearErrorSpy}
          />
        );
      });

      after(function () {
        resetSpyComponentProps();
        cleanup();
      });

      it('calls the changeTtl function', function () {
        const createIndexOptions = screen.getByTestId(
          'create-index-modal-toggle-options'
        );
        fireEvent.click(createIndexOptions);
        const input = screen.getByTestId('create-index-modal-is-ttl-input');
        fireEvent.change(input, { target: { value: '33' } });
        expect(changeTtlSpy).to.have.been.calledWith('33');
      });
    });

    context('with partial filter expression', function () {
      before(function () {
        spyComponentProps();
        render(
          <CreateIndexForm
            inProgress={false}
            schemaFields={[]}
            fields={[{ name: '', type: '' }]}
            isUnique={false}
            isTtl={false}
            ttl=""
            isPartialFilterExpression={true}
            partialFilterExpression=""
            isCustomCollation={false}
            name=""
            hasIndexName={false}
            namespace="db.coll"
            newIndexField=""
            isVisible
            toggleIsVisible={toggleIsVisibleSpy}
            updateFieldName={updateFieldNameSpy}
            updateFieldType={updateFiedTypeSpy}
            addField={addFieldSpy}
            removeField={removeFieldSpy}
            toggleIsUnique={toggleIsUniqueSpy}
            toggleIsTtl={toggleIsTtlSpy}
            toggleIsPartialFilterExpression={toggleIsPartialFilterExpressionSpy}
            toggleIsCustomCollation={toggleIsCustomCollationSpy}
            toggleHasWildcardProjection={toggleHasWildcardProjectionSpy}
            toggleHasColumnstoreProjection={toggleHasColumnstoreProjectionSpy}
            resetForm={resetFormSpy}
            createIndex={createIndexSpy}
            openLink={openLinkSpy}
            changeTtl={changeTtlSpy}
            changePartialFilterExpression={changePartialFilterExpressionSpy}
            collationStringChanged={collationStringChangedSpy}
            changeName={changeNameSpy}
            wildcardProjection=""
            hasWildcardProjection={false}
            columnstoreProjection=""
            hasColumnstoreProjection={false}
            serverVersion="4.0.0"
            columnstoreProjectionChanged={columnstoreProjectionChangedSpy}
            wildcardProjectionChanged={wildcardProjectionChangedSpy}
            createNewIndexField={createNewIndexFieldSpy}
            toggleHasIndexName={toggleHasIndexNameSpy}
            clearError={clearErrorSpy}
          />
        );
      });

      after(function () {
        resetSpyComponentProps();
        cleanup();
      });

      it('calls the changePartialFilterExpression function', function () {
        const createIndexOptions = screen.getByTestId(
          'create-index-modal-toggle-options'
        );
        fireEvent.click(createIndexOptions);
        const input = screen.getByTestId('create-index-modal-is-pfe-input');
        fireEvent.change(input, { target: { value: '{}' } });
        expect(changePartialFilterExpressionSpy).to.have.been.calledWith('{}');
      });
    });

    // TODO: test editors on change event.
    context.skip('with custom collation', function () {});
    context.skip('with wildcard projection', function () {});
  });

  describe('server version 6.1.0', function () {
    context('when initial state', function () {
      beforeEach(function () {
        spyComponentProps();
        render(
          <CreateIndexForm
            inProgress={false}
            schemaFields={[]}
            fields={[{ name: '', type: '' }]}
            isUnique={false}
            isTtl={false}
            ttl=""
            isPartialFilterExpression={false}
            partialFilterExpression=""
            isCustomCollation={false}
            name=""
            hasIndexName={false}
            namespace="db.coll"
            newIndexField=""
            isVisible
            toggleIsVisible={toggleIsVisibleSpy}
            updateFieldName={updateFieldNameSpy}
            updateFieldType={updateFiedTypeSpy}
            addField={addFieldSpy}
            removeField={removeFieldSpy}
            toggleIsUnique={toggleIsUniqueSpy}
            toggleIsTtl={toggleIsTtlSpy}
            toggleIsPartialFilterExpression={toggleIsPartialFilterExpressionSpy}
            toggleIsCustomCollation={toggleIsCustomCollationSpy}
            toggleHasWildcardProjection={toggleHasWildcardProjectionSpy}
            toggleHasColumnstoreProjection={toggleHasColumnstoreProjectionSpy}
            resetForm={resetFormSpy}
            createIndex={createIndexSpy}
            openLink={openLinkSpy}
            changeTtl={changeTtlSpy}
            changePartialFilterExpression={changePartialFilterExpressionSpy}
            collationStringChanged={collationStringChangedSpy}
            changeName={changeNameSpy}
            wildcardProjection=""
            hasWildcardProjection={false}
            columnstoreProjection=""
            hasColumnstoreProjection={false}
            serverVersion="6.1.0"
            columnstoreProjectionChanged={columnstoreProjectionChangedSpy}
            wildcardProjectionChanged={wildcardProjectionChangedSpy}
            createNewIndexField={createNewIndexFieldSpy}
            toggleHasIndexName={toggleHasIndexNameSpy}
            clearError={clearErrorSpy}
          />
        );
      });

      afterEach(function () {
        resetSpyComponentProps();
        cleanup();
      });

      context('when the checkbox options are expanded', function () {
        beforeEach(function () {
          const createIndexOptions = screen.getByTestId(
            'create-index-modal-toggle-options'
          );
          fireEvent.click(createIndexOptions);
        });

        context('columnstore projection', function () {
          it('calls the toggleHasColumnstoreProjection functions', function () {
            const checkbox = screen.getByTestId(
              'create-index-modal-has-columnstore-checkbox'
            );
            fireEvent.click(checkbox);
            expect(toggleHasColumnstoreProjectionSpy).to.have.been.calledWith(
              true
            );
          });
        });
      });
    });

    context.skip('with columnstore projection', function () {});
  });
});
