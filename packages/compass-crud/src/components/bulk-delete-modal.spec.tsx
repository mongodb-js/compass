import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BulkDeleteModal from './bulk-delete-modal';

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

describe('BulkDeleteModal Component', function () {
  afterEach(function () {
    cleanup();
  });

  it('does not render if closed', function () {
    renderBulkDeleteModal({ open: false });
    expect(screen.queryByText(/Delete/)).to.not.exist;
  });

  it('does render if open', function () {
    renderBulkDeleteModal();
    expect(screen.queryAllByText(/Delete/)).to.not.be.empty;
  });

  it('shows the number of documents that will be deleted', function () {
    renderBulkDeleteModal({ documentCount: 42 });
    expect(screen.queryAllByText('Delete 42 documents')[0]).to.be.visible;
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
      screen.getAllByText('Delete 10 documents')[1].closest('button')!
    );
    expect(onConfirmDeletionSpy).to.have.been.calledOnce;
  });
});
