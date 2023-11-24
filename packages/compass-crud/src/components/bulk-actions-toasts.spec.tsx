import React from 'react';
import { ToastArea } from '@mongodb-js/compass-components';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  openBulkDeleteSuccessToast,
  openBulkDeleteProgressToast,
  openBulkDeleteFailureToast,
  openBulkUpdateSuccessToast,
  openBulkUpdateProgressToast,
  openBulkUpdateFailureToast,
} from './bulk-actions-toasts';
import { expect } from 'chai';
import sinon from 'sinon';

function renderToastPortal() {
  return render(<ToastArea></ToastArea>);
}

describe('Bulk Action Toasts', function () {
  beforeEach(function () {
    renderToastPortal();
  });

  afterEach(function () {
    cleanup();
  });

  describe('delete toasts', function () {
    describe('text for documents affected', function () {
      const USE_CASES = [
        {
          modal: openBulkDeleteSuccessToast,
          affected: undefined,
          expected: 'The delete operation finished successfully.',
        },
        {
          modal: openBulkDeleteSuccessToast,
          affected: 1,
          expected: '1 document has been deleted.',
        },
        {
          modal: openBulkDeleteSuccessToast,
          affected: 2,
          expected: '2 documents have been deleted.',
        },
        {
          modal: openBulkDeleteProgressToast,
          affected: undefined,
          expected: 'The delete operation is in progress.',
        },
        {
          modal: openBulkDeleteProgressToast,
          affected: 1,
          expected: '1 document is being deleted.',
        },
        {
          modal: openBulkDeleteProgressToast,
          affected: 2,
          expected: '2 documents are being deleted.',
        },
        {
          modal: openBulkDeleteFailureToast,
          affected: undefined,
          expected: 'The delete operation failed.',
        },
        {
          modal: openBulkDeleteFailureToast,
          affected: 1,
          expected: '1 document could not been deleted.',
        },
        {
          modal: openBulkDeleteFailureToast,
          affected: 2,
          expected: '2 documents could not been deleted.',
        },
      ];

      for (const useCase of USE_CASES) {
        it(`${useCase.modal.name} shows the text '${useCase.expected}' when affected document/s is/are '${useCase.affected}'`, async function () {
          useCase.modal({
            affectedDocuments: useCase.affected,
            onRefresh: () => {},
          });

          await waitFor(async function () {
            const node = await screen.findByText(useCase.expected);
            expect(node).to.exist;
          });
        });
      }
    });

    describe('action for successful toasts', function () {
      let onRefreshSpy: sinon.SinonSpy;

      beforeEach(function () {
        onRefreshSpy = sinon.spy();
      });

      it('calls the refresh action', async function () {
        openBulkDeleteSuccessToast({
          affectedDocuments: 42,
          onRefresh: onRefreshSpy,
        });

        await waitFor(async function () {
          const node = await screen.findByText(/REFRESH/i);
          userEvent.click(node);
        });

        expect(onRefreshSpy).to.have.been.called;
      });
    });
  });

  describe('update toasts', function () {
    describe('text for documents affected', function () {
      const USE_CASES = [
        {
          modal: openBulkUpdateSuccessToast,
          affected: undefined,
          expected: 'The update operation finished successfully.',
        },
        {
          modal: openBulkUpdateSuccessToast,
          affected: 1,
          expected: '1 document has been updated.',
        },
        {
          modal: openBulkUpdateSuccessToast,
          affected: 2,
          expected: '2 documents have been updated.',
        },
        {
          modal: openBulkUpdateProgressToast,
          affected: undefined,
          expected: 'The update operation is in progress.',
        },
        {
          modal: openBulkUpdateProgressToast,
          affected: 1,
          expected: '1 document is being updated.',
        },
        {
          modal: openBulkUpdateProgressToast,
          affected: 2,
          expected: '2 documents are being updated.',
        },
        {
          modal: openBulkUpdateFailureToast,
          affected: undefined,
          expected: 'The update operation failed.',
        },
        {
          modal: openBulkUpdateFailureToast,
          affected: 1,
          expected: '1 document could not been updated.',
        },
        {
          modal: openBulkUpdateFailureToast,
          affected: 2,
          expected: '2 documents could not been updated.',
        },
      ];

      for (const useCase of USE_CASES) {
        it(`${useCase.modal.name} shows the text '${useCase.expected}' when ${useCase.affected} document/s affected`, async function () {
          useCase.modal({
            affectedDocuments: useCase.affected,
            onRefresh: () => {},
          });

          await waitFor(async function () {
            const node = await screen.findByText(useCase.expected);
            expect(node).to.exist;
          });
        });
      }
    });

    describe('action for successful toasts', function () {
      let onRefreshSpy: sinon.SinonSpy;

      beforeEach(function () {
        onRefreshSpy = sinon.spy();
      });

      it('calls the refresh action', async function () {
        openBulkUpdateSuccessToast({
          affectedDocuments: 42,
          onRefresh: onRefreshSpy,
        });

        await waitFor(async function () {
          const node = await screen.findByText(/REFRESH/i);
          userEvent.click(node);
        });

        expect(onRefreshSpy).to.have.been.called;
      });
    });
  });
});
