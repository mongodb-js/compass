import React from 'react';
import {
  render,
  screen,
  cleanup,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  getNode,
  getContext,
  notCalledExcept,
} from '../../../test/aggrid-helper';
import RowActionsRenderer from './row-actions-renderer';

describe('<RowActionsRenderer />', function () {
  afterEach(cleanup);

  describe('#render', function () {
    it('renders all action buttons at top-level', function () {
      const rowNode = getNode({ field1: 'value' });
      const value = rowNode.data.hadronDocument.get('field1');

      render(
        <RowActionsRenderer
          value={value}
          node={rowNode}
          context={undefined}
          data={undefined}
          nested={false}
          copyToClipboard={sinon.spy()}
          isEditable
        />
      );

      expect(screen.getByTitle('Edit Document')).to.exist;
      expect(screen.getByTitle('Copy Document')).to.exist;
      expect(screen.getByTitle('Clone Document')).to.exist;
      expect(screen.getByTitle('Delete Document')).to.exist;
    });

    it('renders only edit button when nested', function () {
      const rowNode = getNode({ field1: 'value' });
      const value = rowNode.data.hadronDocument.get('field1');

      render(
        <RowActionsRenderer
          value={value}
          node={rowNode}
          context={undefined}
          data={undefined}
          nested={true}
          copyToClipboard={sinon.spy()}
          isEditable
        />
      );

      expect(screen.getByTitle('Edit Document')).to.exist;
      expect(screen.queryByTitle('Copy Document')).to.not.exist;
      expect(screen.queryByTitle('Clone Document')).to.not.exist;
      expect(screen.queryByTitle('Delete Document')).to.not.exist;
    });

    it('does not render buttons when not editable', function () {
      const rowNode = getNode({ field1: 'value' });
      const value = rowNode.data.hadronDocument.get('field1');

      render(
        <RowActionsRenderer
          value={value}
          node={rowNode}
          context={undefined}
          data={undefined}
          nested={true}
          copyToClipboard={sinon.spy()}
          isEditable={false}
        />
      );

      expect(screen.queryByTitle('Edit Document')).to.not.exist;
      expect(screen.queryByTitle('Copy Document')).to.not.exist;
      expect(screen.queryByTitle('Clone Document')).to.not.exist;
      expect(screen.queryByTitle('Delete Document')).to.not.exist;
    });
  });

  describe('#actions', function () {
    it('clicking edit button calls context.addFooter with editing', function () {
      const rowNode = getNode({ field1: 'value' });
      const data = rowNode.data;
      const value = rowNode.data.hadronDocument.get('field1');
      const context = getContext();

      render(
        <RowActionsRenderer
          value={value}
          node={rowNode}
          context={context}
          data={data}
          nested={false}
          copyToClipboard={sinon.spy()}
          isEditable
        />
      );

      userEvent.click(screen.getByTitle('Edit Document'));

      expect(context.addFooter.callCount).to.equal(1);
      expect(
        context.addFooter.calledWithExactly(rowNode, rowNode.data, 'editing')
      ).to.be.true;
      notCalledExcept(context, ['addFooter']);
    });

    it('clicking clone button calls context.handleClone', function () {
      const rowNode = getNode({ field1: 'value' });
      const data = rowNode.data;
      const value = rowNode.data.hadronDocument.get('field1');
      const context = getContext();

      render(
        <RowActionsRenderer
          value={value}
          node={rowNode}
          context={context}
          data={data}
          nested={false}
          copyToClipboard={sinon.spy()}
          isEditable
        />
      );

      userEvent.click(screen.getByTitle('Clone Document'));

      expect(context.handleClone.callCount).to.equal(1);
      expect(context.handleClone.calledWithExactly(data)).to.be.true;
      notCalledExcept(context, ['handleClone']);
    });

    it('clicking delete button calls context.addFooter with deleting', function () {
      const rowNode = getNode({ field1: 'value' });
      const data = rowNode.data;
      const value = rowNode.data.hadronDocument.get('field1');
      const context = getContext();

      render(
        <RowActionsRenderer
          value={value}
          node={rowNode}
          context={context}
          data={data}
          nested={false}
          copyToClipboard={sinon.spy()}
          isEditable
        />
      );

      userEvent.click(screen.getByTitle('Delete Document'));

      expect(context.addFooter.callCount).to.equal(1);
      expect(
        context.addFooter.calledWithExactly(rowNode, rowNode.data, 'deleting')
      ).to.be.true;
      notCalledExcept(context, ['addFooter']);
    });

    it('clicking edit button when nested calls context.addFooter with editing', function () {
      const rowNode = getNode({ field1: 'value' });
      const data = rowNode.data;
      const value = rowNode.data.hadronDocument.get('field1');
      const context = getContext();

      render(
        <RowActionsRenderer
          value={value}
          node={rowNode}
          context={context}
          data={data}
          nested={true}
          copyToClipboard={sinon.spy()}
          isEditable
        />
      );

      userEvent.click(screen.getByTitle('Edit Document'));

      expect(context.addFooter.callCount).to.equal(1);
      expect(
        context.addFooter.calledWithExactly(rowNode, rowNode.data, 'editing')
      ).to.be.true;
      notCalledExcept(context, ['addFooter']);
    });
  });
});
