import React from 'react';
import { render, screen, cleanup } from '@mongodb-js/testing-library-compass';
import { ObjectId } from 'bson';
import { expect } from 'chai';
import userEvent from '@testing-library/user-event';

import {
  getNode,
  getApi,
  getActions,
  getContext,
  notCalledExcept,
} from '../../../test/aggrid-helper';
import FullWidthCellRenderer from './full-width-cell-renderer';

describe('<FullWidthCellRenderer />', function () {
  afterEach(cleanup);

  describe('#render', function () {
    it('renders footer with cancel and update buttons in editing mode (unmodified)', function () {
      const api = getApi();
      const actions = getActions();
      const context = getContext([]);
      const rowNode = getNode({ field1: { subfield1: 'value' } });
      rowNode.data.state = 'editing';
      const data = rowNode.data;

      render(
        <FullWidthCellRenderer
          api={api}
          node={rowNode}
          replaceDoc={actions.replaceDoc}
          cleanCols={actions.cleanCols}
          updateDocument={actions.updateDocument}
          removeDocument={actions.removeDocument}
          replaceDocument={actions.replaceDocument}
          data={data}
          context={context}
        />
      );

      expect(screen.getByTestId('document-footer')).to.exist;
      expect(screen.getByTestId('cancel-button')).to.exist;
      expect(screen.getByTestId('update-button')).to.exist;
    });

    it('renders footer with Modified status when document is modified', function () {
      const api = getApi();
      const actions = getActions();
      const context = getContext([]);
      const rowNode = getNode({});
      rowNode.data.hadronDocument.insertEnd('field1', 'value');
      rowNode.data.state = 'editing';
      const data = rowNode.data;

      render(
        <FullWidthCellRenderer
          api={api as any}
          node={rowNode}
          replaceDoc={actions.replaceDoc}
          cleanCols={actions.cleanCols}
          updateDocument={actions.updateDocument}
          removeDocument={actions.removeDocument}
          replaceDocument={actions.replaceDocument}
          data={data}
          context={context}
        />
      );

      const footer = screen.getByTestId('document-footer');
      expect(footer).to.exist;
      expect(footer.getAttribute('data-status')).to.equal('Modified');
      expect(screen.getByTestId('cancel-button')).to.exist;
      expect(screen.getByTestId('update-button')).to.exist;
    });

    it('renders footer with Deleting status and delete button in deleting mode', function () {
      const api = getApi();
      const actions = getActions();
      const context = getContext([]);
      const rowNode = getNode({ field1: { subfield1: 'value' } });
      rowNode.data.state = 'deleting';
      const data = rowNode.data;

      render(
        <FullWidthCellRenderer
          api={api as any}
          node={rowNode}
          replaceDoc={actions.replaceDoc}
          cleanCols={actions.cleanCols}
          updateDocument={actions.updateDocument}
          removeDocument={actions.removeDocument}
          replaceDocument={actions.replaceDocument}
          data={data}
          context={context}
        />
      );

      const footer = screen.getByTestId('document-footer');
      expect(footer).to.exist;
      expect(footer.getAttribute('data-status')).to.equal('Deleting');
      expect(screen.getByTestId('cancel-button')).to.exist;
      expect(screen.getByTestId('delete-button')).to.exist;
    });
  });

  describe('#actions', function () {
    describe('cancel update with valid element', function () {
      it('cancels document changes and removes footer', function () {
        const api = getApi();
        const actions = getActions();
        const context = getContext([]);
        const rowNode = getNode({ toAdd: '1', toTypeChange: '2' });
        rowNode.data.state = 'editing';
        const data = rowNode.data;

        data.hadronDocument.get('toAdd').remove();
        data.hadronDocument.insertEnd('toRemove', '3');
        data.hadronDocument.get('toTypeChange').edit(false);

        render(
          <FullWidthCellRenderer
            api={api as any}
            node={rowNode}
            replaceDoc={actions.replaceDoc}
            cleanCols={actions.cleanCols}
            updateDocument={actions.updateDocument}
            removeDocument={actions.removeDocument}
            replaceDocument={actions.replaceDocument}
            data={data}
            context={context}
          />
        );

        const cancelButton = screen.getByTestId('cancel-button');
        expect(cancelButton).to.exist;
        userEvent.click(cancelButton);

        expect(api.stopEditing.callCount).to.equal(1);
        expect(actions.replaceDoc.callCount).to.equal(1);
        expect(
          actions.replaceDoc.calledWithExactly('1', '1', {
            toAdd: '1',
            toTypeChange: '2',
            _id: '1',
          })
        ).to.be.true;
        expect(actions.cleanCols.callCount).to.equal(1);
        notCalledExcept(actions, ['replaceDoc', 'cleanCols']);
        expect(data.hadronDocument.generateObject()).to.deep.equal({
          _id: '1',
          toAdd: '1',
          toTypeChange: '2',
        });
        expect(context.removeFooter.callCount).to.equal(1);
        expect(context.removeFooter.calledWithExactly(rowNode)).to.be.true;
        notCalledExcept(context, ['removeFooter']);
      });
    });

    describe('cancel update with uneditable row', function () {
      it('does not call replaceDoc or cleanCols but removes footer', function () {
        const api = getApi();
        const actions = getActions();
        const context = getContext(['field does not exist']);
        const rowNode = getNode({ toAdd: '1', toTypeChange: '2' });
        rowNode.data.state = 'editing';
        const data = rowNode.data;

        data.hadronDocument.get('toAdd').remove();
        data.hadronDocument.insertEnd('toRemove', 3);
        data.hadronDocument.get('toTypeChange').edit('2');

        render(
          <FullWidthCellRenderer
            api={api as any}
            node={rowNode}
            replaceDoc={actions.replaceDoc}
            cleanCols={actions.cleanCols}
            updateDocument={actions.updateDocument}
            removeDocument={actions.removeDocument}
            data={data}
            context={context}
            replaceDocument={() => {}}
          />
        );

        const cancelButton = screen.getByTestId('cancel-button');
        expect(cancelButton).to.exist;
        userEvent.click(cancelButton);

        expect(api.stopEditing.callCount).to.equal(1);
        expect(actions.replaceDoc.callCount).to.equal(0);
        expect(actions.cleanCols.callCount).to.equal(0);
        notCalledExcept(actions, []);
        expect(data.hadronDocument.generateObject()).to.deep.equal({
          _id: '1',
          toAdd: '1',
          toTypeChange: '2',
        });
        expect(context.removeFooter.callCount).to.equal(1);
        expect(context.removeFooter.calledWithExactly(rowNode)).to.be.true;
        notCalledExcept(context, ['removeFooter']);
      });
    });

    describe('cancel delete', function () {
      it('calls stopEditing and removes footer', function () {
        const api = getApi();
        const actions = getActions();
        const context = getContext([]);
        const rowNode = getNode({ field1: 'value' });
        rowNode.data.state = 'deleting';
        const data = rowNode.data;

        render(
          <FullWidthCellRenderer
            api={api as any}
            node={rowNode}
            replaceDoc={actions.replaceDoc}
            cleanCols={actions.cleanCols}
            updateDocument={actions.updateDocument}
            removeDocument={actions.removeDocument}
            replaceDocument={actions.replaceDocument}
            data={data}
            context={context}
          />
        );

        const cancelButton = screen.getByTestId('cancel-button');
        expect(cancelButton).to.exist;
        userEvent.click(cancelButton);

        expect(api.stopEditing.callCount).to.equal(1);
        expect(context.removeFooter.callCount).to.equal(1);
        expect(context.removeFooter.calledWithExactly(rowNode)).to.be.true;
        notCalledExcept(context, ['removeFooter']);
      });
    });

    describe('confirm update', function () {
      it('calls stopEditing and updateDocument', function () {
        const api = getApi();
        const actions = getActions();
        const context = getContext([]);
        const oid = new ObjectId();
        const rowNode = getNode({ toRemove: 1 }, oid);
        rowNode.data.state = 'editing';
        const data = rowNode.data;
        data.hadronDocument.insertEnd('newfield', 'value');
        data.hadronDocument.get('toRemove').remove();

        render(
          <FullWidthCellRenderer
            api={api as any}
            node={rowNode}
            replaceDoc={actions.replaceDoc}
            cleanCols={actions.cleanCols}
            updateDocument={actions.updateDocument}
            removeDocument={actions.removeDocument}
            replaceDocument={actions.replaceDocument}
            data={data}
            context={context}
          />
        );

        const footer = screen.getByTestId('document-footer');
        expect(footer.getAttribute('data-status')).to.equal('Modified');

        const updateButton = screen.getByTestId('update-button');
        expect(updateButton).to.exist;
        userEvent.click(updateButton);

        expect(api.stopEditing.callCount).to.equal(1);
        expect(actions.updateDocument.callCount).to.equal(1);
      });
    });

    describe('confirm delete', function () {
      it('calls stopEditing and removeDocument', function () {
        const api = getApi();
        const actions = getActions();
        const context = getContext([]);
        const oid = new ObjectId();
        const rowNode = getNode({ field: 'value' }, oid);
        rowNode.data.state = 'deleting';
        const data = rowNode.data;

        render(
          <FullWidthCellRenderer
            api={api as any}
            node={rowNode}
            replaceDoc={actions.replaceDoc}
            cleanCols={actions.cleanCols}
            updateDocument={actions.updateDocument}
            removeDocument={actions.removeDocument}
            replaceDocument={actions.replaceDocument}
            data={data}
            context={context}
          />
        );

        const footer = screen.getByTestId('document-footer');
        expect(footer.getAttribute('data-status')).to.equal('Deleting');

        const deleteButton = screen.getByTestId('delete-button');
        expect(deleteButton).to.exist;
        userEvent.click(deleteButton);

        expect(api.stopEditing.callCount).to.equal(1);
        expect(actions.removeDocument.callCount).to.equal(1);
      });
    });
  });
});
