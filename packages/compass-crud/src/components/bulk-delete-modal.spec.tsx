import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import AppRegistry from 'hadron-app-registry';
import {
  fireEvent,
  render,
  screen,
  cleanup,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BulkDeleteModal from './bulk-delete-modal';
import { Document } from 'hadron-document';

function renderBulkDeleteModal(
  props?: Partial<React.ComponentProps<typeof BulkDeleteModal>>
) {
  return render(
    <BulkDeleteModal
      open={true}
      documentCount={0}
      filterQuery="{ a: 1 }"
      namespace="mydb.mycoll"
      sampleDocuments={[]}
      onCancel={() => {}}
      onConfirmDeletion={() => {}}
      {...props}
    />
  );
}

describe.only('BulkDeleteModal Component', function () {
  afterEach(function () {
    cleanup();
  });

  it('does not render if closed', function () {
    renderBulkDeleteModal({ open: false });
    expect(screen.queryByText(/Preview documents to delete/)).to.not.exist;
  });

  it('does render if open', function () {
    renderBulkDeleteModal();
    expect(screen.queryByText(/Preview documents to delete/)).to.be.visible;
  });

  it('shows the number of documents that will be deleted', function () {
    renderBulkDeleteModal({ documentCount: 42 });
    expect(screen.queryByText('Preview documents to delete (42)')).to.be
      .visible;
  });

  it('shows the affected collection', function () {
    renderBulkDeleteModal({ namespace: 'mydb.mycoll' });
    expect(screen.queryByText('mydb.mycoll')).to.be.visible;
  });

  it('shows the provided query', function () {
    renderBulkDeleteModal({ filterQuery: '{ a: 1 }' });
    expect(screen.queryByDisplayValue('{ a: 1 }')).to.be.visible;
  });

  it('closes the modal when cancelled', function () {
    const onCloseSpy = sinon.spy();
    renderBulkDeleteModal({ onCancel: onCloseSpy });

    userEvent.click(screen.getByText('Close').closest('button')!);
    expect(onCloseSpy).to.have.been.calledOnce;
  });

  it('confirms deletion when clicked on the Delete documents button', function () {
    const onConfirmDeletionSpy = sinon.spy();
    renderBulkDeleteModal({
      documentCount: 10,
      onConfirmDeletion: onConfirmDeletionSpy,
    });

    userEvent.click(
      screen.getByText('Delete documents (10)').closest('button')!
    );
    expect(onConfirmDeletionSpy).to.have.been.calledOnce;
  });
});
