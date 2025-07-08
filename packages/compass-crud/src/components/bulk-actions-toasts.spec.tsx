import React from 'react';
import { ToastArea } from '@mongodb-js/compass-components';
import {
  render,
  screen,
  cleanup,
  waitFor,
  userEvent,
} from '@mongodb-js/testing-library-compass';
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
import { MongoNetworkError } from 'mongodb';

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
          error: new Error('Test error'),
          expected: ['The delete operation failed.', 'Test error'],
        },
        {
          modal: openBulkDeleteFailureToast,
          affected: 1,
          error: new Error('Another test error'),
          expected: ['1 document could not be deleted.', 'Another test error'],
        },
        {
          modal: openBulkDeleteFailureToast,
          affected: 2,
          error: new Error('Another failure'),
          expected: ['2 documents could not be deleted.', 'Another failure'],
        },
        {
          modal: openBulkDeleteFailureToast,
          affected: 2,
          error: new MongoNetworkError('Connection lost'),
          expected: [
            'Delete operation - network error occurred.',
            'Connection lost',
          ],
        },
      ];

      for (const useCase of USE_CASES) {
        it(`${useCase.modal.name} shows the text '${useCase.expected}' when affected document/s is/are '${useCase.affected}'`, async function () {
          useCase.modal({
            affectedDocuments: useCase.affected,
            error: useCase.error as Error,
            onRefresh: () => {},
          });

          await waitFor(async function () {
            if (!Array.isArray(useCase.expected)) {
              expect(await screen.findByText(useCase.expected)).to.exist;
            } else {
              for (const expectedText of useCase.expected) {
                expect(await screen.findByText(expectedText)).to.exist;
              }
            }
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

        await waitFor(function () {
          const node = screen.queryByText('42 documents have been deleted.');
          expect(node).to.not.exist;
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
          error: new Error('Test error'),
          expected: ['The update operation failed.', 'Test error'],
        },
        {
          modal: openBulkUpdateFailureToast,
          affected: 1,
          error: new Error('Could not update'),
          expected: ['1 document could not be updated.', 'Could not update'],
        },
        {
          modal: openBulkUpdateFailureToast,
          affected: 2,
          error: new Error('Update failed'),
          expected: ['2 documents could not be updated.', 'Update failed'],
        },

        {
          modal: openBulkUpdateFailureToast,
          affected: 2,
          error: new MongoNetworkError('Connection lost'),
          expected: [
            'Update operation - network error occurred.',
            'Connection lost',
          ],
        },
      ];

      for (const useCase of USE_CASES) {
        it(`${useCase.modal.name} shows the text '${useCase.expected}' when ${useCase.affected} document/s affected`, async function () {
          useCase.modal({
            affectedDocuments: useCase.affected,
            error: useCase.error,
            onRefresh: () => {},
          });

          await waitFor(async function () {
            if (!Array.isArray(useCase.expected)) {
              expect(await screen.findByText(useCase.expected)).to.exist;
            } else {
              for (const expectedText of useCase.expected) {
                expect(await screen.findByText(expectedText)).to.exist;
              }
            }
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

        await waitFor(function () {
          const node = screen.queryByText('42 documents have been updated.');
          expect(node).to.not.exist;
        });

        expect(onRefreshSpy).to.have.been.called;
      });
    });
  });
});
