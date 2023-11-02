import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BulkUpdateDialog from './bulk-update-dialog';

function renderBulkUpdateDialog(
  props?: Partial<React.ComponentProps<typeof BulkUpdateDialog>>
) {
  return render(
    <BulkUpdateDialog
      isOpen={true}
      ns="mydb.mycoll"
      filter={{ a: 1 }}
      count={0}
      updateText="{ $set: {} }"
      preview={{
        changes: [
          {
            before: { foo: 1 },
            after: { foo: 1 },
          },
        ],
      }}
      closeBulkUpdateDialog={() => {}}
      updateBulkUpdatePreview={() => {}}
      runBulkUpdate={() => {}}
      {...props}
    />
  );
}

describe('BulkUpdateDialog Component', function () {
  afterEach(function () {
    cleanup();
  });

  it('does not render if closed', function () {
    renderBulkUpdateDialog({ isOpen: false });
    expect(screen.queryByText(/Update/)).to.not.exist;
  });

  it('renders if open', function () {
    renderBulkUpdateDialog({ count: 42 });

    // filter
    expect(
      screen.getByTestId('readonly-filter').getAttribute('value')
    ).to.equal('{\n a: 1\n}');

    // update
    expect(screen.getByTestId('bulk-update-update').textContent).to.match(
      /{ \$set: {} }/
    );

    // preview
    expect(
      screen.getAllByTestId('bulk-update-preview-document')
    ).to.have.lengthOf(1);

    // buttons
    expect(screen.getByRole('button', { name: 'Close' })).to.exist;
    expect(screen.getByRole('button', { name: 'Update documents' })).to.exist;
  });

  it('resets if the modal is re-opened', async function () {
    // initial open
    const { rerender } = renderBulkUpdateDialog({ isOpen: true });

    // close
    rerender(
      <BulkUpdateDialog
        isOpen={false}
        ns="mydb.mycoll"
        filter={{ a: 1 }}
        count={0}
        updateText="{ $set: {} }"
        preview={{
          changes: [
            {
              before: {},
              after: {},
            },
          ],
        }}
        closeBulkUpdateDialog={() => {}}
        updateBulkUpdatePreview={() => {}}
        runBulkUpdate={() => {}}
      />
    );

    // re-open
    rerender(
      <BulkUpdateDialog
        isOpen={true}
        ns="mydb.mycoll"
        filter={{ a: 1 }}
        count={0}
        updateText="foo"
        preview={{
          changes: [
            {
              before: {},
              after: {},
            },
          ],
        }}
        closeBulkUpdateDialog={() => {}}
        updateBulkUpdatePreview={() => {}}
        runBulkUpdate={() => {}}
      />
    );

    await waitFor(() => {
      expect(
        screen
          .getByTestId('bulk-update-update')
          .getElementsByClassName('cm-content')[0].textContent
      ).to.equal('foo');
    });
  });

  it('closes the modal when the close button is clicked', function () {
    const onCloseSpy = sinon.spy();
    renderBulkUpdateDialog({ closeBulkUpdateDialog: onCloseSpy });

    userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onCloseSpy).to.have.been.calledOnce;
  });

  it('runs the update when the update button is clicked', function () {
    const onUpdateSpy = sinon.spy();
    renderBulkUpdateDialog({ runBulkUpdate: onUpdateSpy });

    userEvent.click(screen.getByRole('button', { name: 'Update documents' }));
    expect(onUpdateSpy).to.have.been.calledOnce;
  });
});
