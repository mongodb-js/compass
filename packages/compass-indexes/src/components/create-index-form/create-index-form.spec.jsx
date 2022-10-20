import React from 'react';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
import hadronApp from 'hadron-app';
import sinon from 'sinon';

import {
  render,
  screen,
  cleanup,
  fireEvent,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CreateIndexForm } from './create-index-form';

describe('CreateIndexForm Component', function () {
  let updateFieldNameSpy;
  let updateFiedTypeSpy;
  let addFieldSpy;
  let removeFieldSpy;
  let toggleIsUniqueSpy;
  let toggleUseTtlSpy;
  let toggleUsePartialFilterExpressionSpy;
  let toggleUseCustomCollationSpy;
  let toggleUseColumnstoreProjectionSpy;
  let toggleUseWildcardProjectionSpy;
  let openLinkSpy;
  let ttlChangedSpy;
  let partialFilterExpressionChangedSpy;
  let collationStringChangedSpy;
  let nameChangedSpy;
  let columnstoreProjectionChangedSpy;
  let wildcardProjectionChangedSpy;
  let createNewIndexFieldSpy;
  let toggleUseIndexNameSpy;
  let toggleIsSparseSpy;

  const spyComponentProps = () => {
    updateFiedTypeSpy = sinon.spy();
    updateFieldNameSpy = sinon.spy();
    addFieldSpy = sinon.spy();
    removeFieldSpy = sinon.spy();
    toggleIsUniqueSpy = sinon.spy();
    toggleUseTtlSpy = sinon.spy();
    toggleUsePartialFilterExpressionSpy = sinon.spy();
    toggleUseCustomCollationSpy = sinon.spy();
    toggleUseColumnstoreProjectionSpy = sinon.spy();
    toggleUseWildcardProjectionSpy = sinon.spy();
    openLinkSpy = sinon.spy();
    ttlChangedSpy = sinon.spy();
    partialFilterExpressionChangedSpy = sinon.spy();
    collationStringChangedSpy = sinon.spy();
    nameChangedSpy = sinon.spy();
    columnstoreProjectionChangedSpy = sinon.spy();
    wildcardProjectionChangedSpy = sinon.spy();
    createNewIndexFieldSpy = sinon.spy();
    toggleUseIndexNameSpy = sinon.spy();
    toggleIsSparseSpy = sinon.spy();
  };

  const resetSpyComponentProps = () => {
    updateFiedTypeSpy = null;
    updateFieldNameSpy = null;
    addFieldSpy = null;
    removeFieldSpy = null;
    toggleIsUniqueSpy = null;
    toggleUseTtlSpy = null;
    toggleUsePartialFilterExpressionSpy = null;
    toggleUseCustomCollationSpy = null;
    toggleUseColumnstoreProjectionSpy = null;
    toggleUseWildcardProjectionSpy = null;
    openLinkSpy = null;
    ttlChangedSpy = null;
    partialFilterExpressionChangedSpy = null;
    collationStringChangedSpy = null;
    nameChangedSpy = null;
    columnstoreProjectionChangedSpy = null;
    wildcardProjectionChangedSpy = null;
    createNewIndexFieldSpy = null;
    toggleUseIndexNameSpy = null;
    toggleIsSparseSpy = null;
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
            schemaFields={[]}
            fields={[{ name: '', type: '' }]}
            isUnique={false}
            isSparse={false}
            useTtl={false}
            ttl=""
            usePartialFilterExpression={false}
            partialFilterExpression=""
            useCustomCollation={false}
            name=""
            useIndexName={false}
            newIndexField=""
            updateFieldName={updateFieldNameSpy}
            updateFieldType={updateFiedTypeSpy}
            addField={addFieldSpy}
            removeField={removeFieldSpy}
            toggleIsUnique={toggleIsUniqueSpy}
            toggleUseTtl={toggleUseTtlSpy}
            toggleUsePartialFilterExpression={
              toggleUsePartialFilterExpressionSpy
            }
            toggleUseCustomCollation={toggleUseCustomCollationSpy}
            toggleUseWildcardProjection={toggleUseWildcardProjectionSpy}
            toggleUseColumnstoreProjection={toggleUseColumnstoreProjectionSpy}
            openLink={openLinkSpy}
            ttlChanged={ttlChangedSpy}
            partialFilterExpressionChanged={partialFilterExpressionChangedSpy}
            collationStringChanged={collationStringChangedSpy}
            nameChanged={nameChangedSpy}
            wildcardProjection=""
            useWildcardProjection={false}
            columnstoreProjection=""
            useColumnstoreProjection={false}
            serverVersion="4.0.0"
            columnstoreProjectionChanged={columnstoreProjectionChangedSpy}
            wildcardProjectionChanged={wildcardProjectionChangedSpy}
            createNewIndexField={createNewIndexFieldSpy}
            toggleUseIndexName={toggleUseIndexNameSpy}
            toggleIsSparse={toggleIsSparseSpy}
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
        const createIndexFields = screen.getByTestId(
          'create-index-fields-line-0'
        );
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

        context('sparse', function () {
          it('calls the toggleIsSparse function', function () {
            const checkbox = screen.getByTestId(
              'create-index-modal-is-sparse-checkbox'
            );
            expect(toggleIsSparseSpy.callCount).to.equal(0);
            fireEvent.click(checkbox);
            expect(toggleIsSparseSpy).to.have.been.calledWith(true);
          });
        });

        context('index name', function () {
          it('calls the toggleUseIndexName functions', function () {
            const checkbox = screen.getByTestId(
              'create-index-modal-use-index-name-checkbox'
            );
            fireEvent.click(checkbox);
            expect(toggleUseIndexNameSpy).to.have.been.calledWith(true);
          });
        });

        context('ttl', function () {
          it('calls the toggleUseTtl functions', function () {
            const checkbox = screen.getByTestId(
              'create-index-modal-use-ttl-checkbox'
            );
            fireEvent.click(checkbox);
            expect(toggleUseTtlSpy).to.have.been.calledWith(true);
          });
        });

        context('partial filter expression', function () {
          it('calls the toggleUsePartialFilterExpression functions', function () {
            const checkbox = screen.getByTestId(
              'create-index-modal-is-pfe-checkbox'
            );
            fireEvent.click(checkbox);
            expect(toggleUsePartialFilterExpressionSpy).to.have.been.calledWith(
              true
            );
          });
        });

        context('custom collation', function () {
          it('calls the toggleUseCustomCollation functions', function () {
            const checkbox = screen.getByTestId(
              'create-index-modal-use-custom-collation-checkbox'
            );
            fireEvent.click(checkbox);
            expect(toggleUseCustomCollationSpy).to.have.been.calledWith(true);
          });
        });

        context('wildcard projection', function () {
          it('calls the toggleUseWildcardProjection functions', function () {
            const checkbox = screen.getByTestId(
              'create-index-modal-use-wildcard-checkbox'
            );
            fireEvent.click(checkbox);
            expect(toggleUseWildcardProjectionSpy).to.have.been.calledWith(
              true
            );
          });
        });

        context('columnstore projection', function () {
          it('does not display columnstore projection checkbox', function () {
            const checkbox = screen.queryByTestId(
              'create-index-modal-use-columnstore-checkbox'
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
            schemaFields={[]}
            fields={[{ name: '', type: '' }]}
            isUnique={false}
            useTtl={false}
            ttl=""
            usePartialFilterExpression={false}
            partialFilterExpression=""
            useCustomCollation={false}
            name=""
            useIndexName={true}
            newIndexField=""
            updateFieldName={updateFieldNameSpy}
            updateFieldType={updateFiedTypeSpy}
            addField={addFieldSpy}
            removeField={removeFieldSpy}
            toggleIsUnique={toggleIsUniqueSpy}
            toggleUseTtl={toggleUseTtlSpy}
            toggleUsePartialFilterExpression={
              toggleUsePartialFilterExpressionSpy
            }
            toggleUseCustomCollation={toggleUseCustomCollationSpy}
            toggleUseWildcardProjection={toggleUseWildcardProjectionSpy}
            toggleUseColumnstoreProjection={toggleUseColumnstoreProjectionSpy}
            openLink={openLinkSpy}
            ttlChanged={ttlChangedSpy}
            partialFilterExpressionChanged={partialFilterExpressionChangedSpy}
            collationStringChanged={collationStringChangedSpy}
            nameChanged={nameChangedSpy}
            wildcardProjection=""
            useWildcardProjection={false}
            columnstoreProjection=""
            useColumnstoreProjection={false}
            serverVersion="4.0.0"
            columnstoreProjectionChanged={columnstoreProjectionChangedSpy}
            wildcardProjectionChanged={wildcardProjectionChangedSpy}
            createNewIndexField={createNewIndexFieldSpy}
            toggleUseIndexName={toggleUseIndexNameSpy}
          />
        );
      });

      after(function () {
        resetSpyComponentProps();
        cleanup();
      });

      it('calls the nameChanged function', function () {
        const createIndexOptions = screen.getByTestId(
          'create-index-modal-toggle-options'
        );
        fireEvent.click(createIndexOptions);
        const input = screen.getByTestId(
          'create-index-modal-use-index-name-input'
        );
        fireEvent.change(input, { target: { value: 'Name' } });
        expect(nameChangedSpy).to.have.been.calledWith('Name');
      });
    });

    context('with ttl', function () {
      before(function () {
        spyComponentProps();
        render(
          <CreateIndexForm
            schemaFields={[]}
            fields={[{ name: '', type: '' }]}
            isUnique={false}
            useTtl={true}
            ttl=""
            usePartialFilterExpression={false}
            partialFilterExpression=""
            useCustomCollation={false}
            name=""
            useIndexName={false}
            newIndexField=""
            updateFieldName={updateFieldNameSpy}
            updateFieldType={updateFiedTypeSpy}
            addField={addFieldSpy}
            removeField={removeFieldSpy}
            toggleIsUnique={toggleIsUniqueSpy}
            toggleUseTtl={toggleUseTtlSpy}
            toggleUsePartialFilterExpression={
              toggleUsePartialFilterExpressionSpy
            }
            toggleUseCustomCollation={toggleUseCustomCollationSpy}
            toggleUseWildcardProjection={toggleUseWildcardProjectionSpy}
            toggleUseColumnstoreProjection={toggleUseColumnstoreProjectionSpy}
            openLink={openLinkSpy}
            ttlChanged={ttlChangedSpy}
            partialFilterExpressionChanged={partialFilterExpressionChangedSpy}
            collationStringChanged={collationStringChangedSpy}
            nameChanged={nameChangedSpy}
            wildcardProjection=""
            useWildcardProjection={false}
            columnstoreProjection=""
            useColumnstoreProjection={false}
            serverVersion="4.0.0"
            columnstoreProjectionChanged={columnstoreProjectionChangedSpy}
            wildcardProjectionChanged={wildcardProjectionChangedSpy}
            createNewIndexField={createNewIndexFieldSpy}
            toggleUseIndexName={toggleUseIndexNameSpy}
          />
        );
      });

      after(function () {
        resetSpyComponentProps();
        cleanup();
      });

      it('calls the ttlChanged function', function () {
        const createIndexOptions = screen.getByTestId(
          'create-index-modal-toggle-options'
        );
        fireEvent.click(createIndexOptions);
        const input = screen.getByTestId('create-index-modal-use-ttl-input');
        fireEvent.change(input, { target: { value: '33' } });
        expect(ttlChangedSpy).to.have.been.calledWith('33');
      });
    });

    context('with custom collation', function () {
      before(function () {
        spyComponentProps();
        render(
          <CreateIndexForm
            schemaFields={[]}
            fields={[{ name: '', type: '' }]}
            isUnique={false}
            useTtl={false}
            ttl=""
            usePartialFilterExpression={false}
            partialFilterExpression=""
            useCustomCollation={true}
            name=""
            useIndexName={false}
            newIndexField=""
            updateFieldName={updateFieldNameSpy}
            updateFieldType={updateFiedTypeSpy}
            addField={addFieldSpy}
            removeField={removeFieldSpy}
            toggleIsUnique={toggleIsUniqueSpy}
            toggleUseTtl={toggleUseTtlSpy}
            toggleUsePartialFilterExpression={
              toggleUsePartialFilterExpressionSpy
            }
            toggleUseCustomCollation={toggleUseCustomCollationSpy}
            toggleUseWildcardProjection={toggleUseWildcardProjectionSpy}
            toggleUseColumnstoreProjection={toggleUseColumnstoreProjectionSpy}
            openLink={openLinkSpy}
            ttlChanged={ttlChangedSpy}
            partialFilterExpressionChanged={partialFilterExpressionChangedSpy}
            collationStringChanged={collationStringChangedSpy}
            nameChanged={nameChangedSpy}
            wildcardProjection=""
            useWildcardProjection={false}
            columnstoreProjection=""
            useColumnstoreProjection={false}
            serverVersion="4.0.0"
            columnstoreProjectionChanged={columnstoreProjectionChangedSpy}
            wildcardProjectionChanged={wildcardProjectionChangedSpy}
            createNewIndexField={createNewIndexFieldSpy}
            toggleUseIndexName={toggleUseIndexNameSpy}
          />
        );
      });

      after(function () {
        resetSpyComponentProps();
        cleanup();
      });

      it('calls the collationStringChanged function', function () {
        const createIndexOptions = screen.getByTestId(
          'create-index-modal-toggle-options'
        );
        fireEvent.click(createIndexOptions);
        const editorWrapper = screen.getByTestId(
          'create-index-modal-use-custom-collation-editor'
        );

        const editor = within(editorWrapper).getByRole('textbox');

        userEvent.paste(editor, '{}');

        expect(collationStringChangedSpy).to.have.been.calledWith('{}');
      });
    });

    context('with partial filter expression', function () {
      before(function () {
        spyComponentProps();
        render(
          <CreateIndexForm
            schemaFields={[]}
            fields={[{ name: '', type: '' }]}
            isUnique={false}
            useTtl={false}
            ttl=""
            usePartialFilterExpression={true}
            partialFilterExpression=""
            useCustomCollation={false}
            name=""
            useIndexName={false}
            newIndexField=""
            updateFieldName={updateFieldNameSpy}
            updateFieldType={updateFiedTypeSpy}
            addField={addFieldSpy}
            removeField={removeFieldSpy}
            toggleIsUnique={toggleIsUniqueSpy}
            toggleUseTtl={toggleUseTtlSpy}
            toggleUsePartialFilterExpression={
              toggleUsePartialFilterExpressionSpy
            }
            toggleUseCustomCollation={toggleUseCustomCollationSpy}
            toggleUseWildcardProjection={toggleUseWildcardProjectionSpy}
            toggleUseColumnstoreProjection={toggleUseColumnstoreProjectionSpy}
            openLink={openLinkSpy}
            ttlChanged={ttlChangedSpy}
            partialFilterExpressionChanged={partialFilterExpressionChangedSpy}
            collationStringChanged={collationStringChangedSpy}
            nameChanged={nameChangedSpy}
            wildcardProjection=""
            useWildcardProjection={false}
            columnstoreProjection=""
            useColumnstoreProjection={false}
            serverVersion="4.0.0"
            columnstoreProjectionChanged={columnstoreProjectionChangedSpy}
            wildcardProjectionChanged={wildcardProjectionChangedSpy}
            createNewIndexField={createNewIndexFieldSpy}
            toggleUseIndexName={toggleUseIndexNameSpy}
          />
        );
      });

      after(function () {
        resetSpyComponentProps();
        cleanup();
      });

      it('calls the partialFilterExpressionChanged function', function () {
        const createIndexOptions = screen.getByTestId(
          'create-index-modal-toggle-options'
        );
        fireEvent.click(createIndexOptions);
        const editorWrapper = screen.getByTestId(
          'create-index-modal-is-pfe-editor'
        );

        const editor = within(editorWrapper).getByRole('textbox');

        userEvent.paste(editor, '{}');

        expect(partialFilterExpressionChangedSpy).to.have.been.calledWith('{}');
      });
    });

    context('with wildcard projection', function () {
      before(function () {
        spyComponentProps();
        render(
          <CreateIndexForm
            schemaFields={[]}
            fields={[{ name: '', type: '' }]}
            isUnique={false}
            useTtl={false}
            ttl=""
            usePartialFilterExpression={false}
            partialFilterExpression=""
            useCustomCollation={false}
            name=""
            useIndexName={false}
            newIndexField=""
            updateFieldName={updateFieldNameSpy}
            updateFieldType={updateFiedTypeSpy}
            addField={addFieldSpy}
            removeField={removeFieldSpy}
            toggleIsUnique={toggleIsUniqueSpy}
            toggleUseTtl={toggleUseTtlSpy}
            toggleUsePartialFilterExpression={
              toggleUsePartialFilterExpressionSpy
            }
            toggleUseCustomCollation={toggleUseCustomCollationSpy}
            toggleUseWildcardProjection={toggleUseWildcardProjectionSpy}
            toggleUseColumnstoreProjection={toggleUseColumnstoreProjectionSpy}
            openLink={openLinkSpy}
            ttlChanged={ttlChangedSpy}
            partialFilterExpressionChanged={partialFilterExpressionChangedSpy}
            collationStringChanged={collationStringChangedSpy}
            nameChanged={nameChangedSpy}
            wildcardProjection=""
            useWildcardProjection={true}
            columnstoreProjection=""
            useColumnstoreProjection={false}
            serverVersion="4.0.0"
            columnstoreProjectionChanged={columnstoreProjectionChangedSpy}
            wildcardProjectionChanged={wildcardProjectionChangedSpy}
            createNewIndexField={createNewIndexFieldSpy}
            toggleUseIndexName={toggleUseIndexNameSpy}
          />
        );
      });

      after(function () {
        resetSpyComponentProps();
        cleanup();
      });

      it('calls the wildcardProjectionChanged function', function () {
        const createIndexOptions = screen.getByTestId(
          'create-index-modal-toggle-options'
        );
        fireEvent.click(createIndexOptions);
        const editorWrapper = screen.getByTestId(
          'create-index-modal-use-wildcard-editor'
        );

        const editor = within(editorWrapper).getByRole('textbox');

        userEvent.paste(editor, '{}');

        expect(wildcardProjectionChangedSpy).to.have.been.calledWith('{}');
      });
    });
  });

  describe('server version 7.0.0', function () {
    context('when initial state', function () {
      beforeEach(function () {
        spyComponentProps();
        render(
          <CreateIndexForm
            schemaFields={[]}
            fields={[{ name: '', type: '' }]}
            isUnique={false}
            useTtl={false}
            ttl=""
            usePartialFilterExpression={false}
            partialFilterExpression=""
            useCustomCollation={false}
            name=""
            useIndexName={false}
            newIndexField=""
            updateFieldName={updateFieldNameSpy}
            updateFieldType={updateFiedTypeSpy}
            addField={addFieldSpy}
            removeField={removeFieldSpy}
            toggleIsUnique={toggleIsUniqueSpy}
            toggleUseTtl={toggleUseTtlSpy}
            toggleUsePartialFilterExpression={
              toggleUsePartialFilterExpressionSpy
            }
            toggleUseCustomCollation={toggleUseCustomCollationSpy}
            toggleUseWildcardProjection={toggleUseWildcardProjectionSpy}
            toggleUseColumnstoreProjection={toggleUseColumnstoreProjectionSpy}
            openLink={openLinkSpy}
            ttlChanged={ttlChangedSpy}
            partialFilterExpressionChanged={partialFilterExpressionChangedSpy}
            collationStringChanged={collationStringChangedSpy}
            nameChanged={nameChangedSpy}
            wildcardProjection=""
            useWildcardProjection={false}
            columnstoreProjection=""
            useColumnstoreProjection={false}
            serverVersion="7.0.0"
            columnstoreProjectionChanged={columnstoreProjectionChangedSpy}
            wildcardProjectionChanged={wildcardProjectionChangedSpy}
            createNewIndexField={createNewIndexFieldSpy}
            toggleUseIndexName={toggleUseIndexNameSpy}
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
          it('calls the toggleUseColumnstoreProjection functions', function () {
            const checkbox = screen.getByTestId(
              'create-index-modal-use-columnstore-checkbox'
            );
            fireEvent.click(checkbox);
            expect(toggleUseColumnstoreProjectionSpy).to.have.been.calledWith(
              true
            );
          });
        });
      });
    });

    context('with columnstore projection', function () {
      before(function () {
        spyComponentProps();
        render(
          <CreateIndexForm
            schemaFields={[]}
            fields={[{ name: '', type: '' }]}
            isUnique={false}
            useTtl={false}
            ttl=""
            usePartialFilterExpression={false}
            partialFilterExpression=""
            useCustomCollation={false}
            name=""
            useIndexName={false}
            newIndexField=""
            updateFieldName={updateFieldNameSpy}
            updateFieldType={updateFiedTypeSpy}
            addField={addFieldSpy}
            removeField={removeFieldSpy}
            toggleIsUnique={toggleIsUniqueSpy}
            toggleUseTtl={toggleUseTtlSpy}
            toggleUsePartialFilterExpression={
              toggleUsePartialFilterExpressionSpy
            }
            toggleUseCustomCollation={toggleUseCustomCollationSpy}
            toggleUseWildcardProjection={toggleUseWildcardProjectionSpy}
            toggleUseColumnstoreProjection={toggleUseColumnstoreProjectionSpy}
            openLink={openLinkSpy}
            ttlChanged={ttlChangedSpy}
            partialFilterExpressionChanged={partialFilterExpressionChangedSpy}
            collationStringChanged={collationStringChangedSpy}
            nameChanged={nameChangedSpy}
            wildcardProjection=""
            useWildcardProjection={false}
            columnstoreProjection=""
            useColumnstoreProjection={true}
            serverVersion="7.0.0"
            columnstoreProjectionChanged={columnstoreProjectionChangedSpy}
            wildcardProjectionChanged={wildcardProjectionChangedSpy}
            createNewIndexField={createNewIndexFieldSpy}
            toggleUseIndexName={toggleUseIndexNameSpy}
          />
        );
      });

      after(function () {
        resetSpyComponentProps();
        cleanup();
      });

      it('calls the columnstoreProjectionChanged function', function () {
        const createIndexOptions = screen.getByTestId(
          'create-index-modal-toggle-options'
        );
        fireEvent.click(createIndexOptions);
        const editorWrapper = screen.getByTestId(
          'create-index-modal-use-columnstore-editor'
        );

        const editor = within(editorWrapper).getByRole('textbox');

        userEvent.paste(editor, '{}');

        expect(columnstoreProjectionChangedSpy).to.have.been.calledWith('{}');
      });
    });
  });
});
