import React from 'react';
import {
  openToast,
  closeToast,
  ToastBody,
  showErrorDetails,
  translate,
} from '@mongodb-js/compass-components';
import { MongoNetworkError } from 'mongodb';
import type { MongoServerError } from 'mongodb';

const bulkTranslator =
  (language: string | undefined) =>
  (key: string, english: string, vars?: Record<string, string | number>) =>
    translate(language ?? 'en', key, english, vars);

type BulkDeleteSuccessToastProps = {
  affectedDocuments?: number;
  language?: string;
  onRefresh: () => void;
};

export function openBulkDeleteSuccessToast({
  affectedDocuments,
  language,
  onRefresh,
}: BulkDeleteSuccessToastProps): void {
  const t = bulkTranslator(language);
  let text;
  switch (affectedDocuments) {
    case undefined:
      text = t(
        'crud.bulkToast.deleteFinished',
        'The delete operation finished successfully.'
      );
      break;
    case 1:
      text = t(
        'crud.bulkToast.deletedOne',
        '{count} document has been deleted.',
        { count: affectedDocuments }
      );
      break;
    default:
      text = t(
        'crud.bulkToast.deletedMany',
        '{count} documents have been deleted.',
        { count: affectedDocuments }
      );
  }

  const closeAndThenRefresh = () => {
    closeToast('bulk-delete-toast');
    onRefresh();
  };

  openToast('bulk-delete-toast', {
    title: '',
    variant: 'success',
    dismissible: true,
    description: (
      <ToastBody
        statusMessage={text}
        actionHandler={closeAndThenRefresh}
        actionText={t('crud.bulkToast.refresh', 'refresh')}
      />
    ),
  });
}

type BulkDeleteInProgressToastProps = {
  affectedDocuments?: number;
  language?: string;
};

export function openBulkDeleteProgressToast({
  affectedDocuments,
  language,
}: BulkDeleteInProgressToastProps): void {
  const t = bulkTranslator(language);
  let text;
  switch (affectedDocuments) {
    case undefined:
      text = t(
        'crud.bulkToast.deleteInProgress',
        'The delete operation is in progress.'
      );
      break;
    case 1:
      text = t(
        'crud.bulkToast.deletingOne',
        '{count} document is being deleted.',
        { count: affectedDocuments }
      );
      break;
    default:
      text = t(
        'crud.bulkToast.deletingMany',
        '{count} documents are being deleted.',
        { count: affectedDocuments }
      );
  }

  openToast('bulk-delete-toast', {
    title: '',
    variant: 'progress',
    dismissible: true,
    description: <ToastBody statusMessage={text} />,
  });
}

type BulkOperationFailureToastProps = {
  affectedDocuments?: number;
  language?: string;
  error: Error;
  type: 'delete' | 'update';
};

const isNetworkError = (error: Error) => error instanceof MongoNetworkError;

export function openBulkOperationFailureToast({
  affectedDocuments,
  error,
  type,
  language,
}: BulkOperationFailureToastProps): void {
  const t = bulkTranslator(language);
  let title: string;
  if (isNetworkError(error)) {
    title =
      type === 'delete'
        ? t(
            'crud.bulkToast.deleteNetworkError',
            'Delete operation - network error occurred.'
          )
        : t(
            'crud.bulkToast.updateNetworkError',
            'Update operation - network error occurred.'
          );
  } else if (affectedDocuments === undefined || type === 'update') {
    title =
      type === 'delete'
        ? t('crud.bulkToast.deleteFailed', 'The delete operation failed.')
        : t('crud.bulkToast.updateFailed', 'The update operation failed.');
  } else if (affectedDocuments === 1) {
    title = t(
      'crud.bulkToast.notDeletedOne',
      '{count} document could not be deleted.',
      { count: affectedDocuments }
    );
  } else {
    title = t(
      'crud.bulkToast.notDeletedMany',
      '{count} documents could not be deleted.',
      { count: affectedDocuments }
    );
  }

  const toastId = `bulk-${type}-toast`;
  const errInfo = (error as MongoServerError).errInfo;

  openToast(toastId, {
    title,
    variant: 'warning',
    dismissible: true,
    description: (
      <ToastBody
        statusMessage={error.message}
        {...(errInfo && {
          actionText: t('crud.bulkToast.viewDetails', 'View details'),
          actionHandler: () => {
            closeToast(toastId);
            void showErrorDetails({ details: errInfo, closeAction: 'close' });
          },
        })}
      />
    ),
  });
}

export const openBulkDeleteFailureToast = (
  props: Omit<BulkOperationFailureToastProps, 'type'>
): void => openBulkOperationFailureToast({ ...props, type: 'delete' });

type BulkUpdateSuccessToastProps = {
  affectedDocuments?: number;
  language?: string;
  onRefresh: () => void;
};

export function openBulkUpdateSuccessToast({
  affectedDocuments,
  language,
  onRefresh,
}: BulkUpdateSuccessToastProps): void {
  const t = bulkTranslator(language);
  let text;
  switch (affectedDocuments) {
    case undefined:
      text = t(
        'crud.bulkToast.updateFinished',
        'The update operation finished successfully.'
      );
      break;
    case 1:
      text = t(
        'crud.bulkToast.updatedOne',
        '{count} document has been updated.',
        { count: affectedDocuments }
      );
      break;
    default:
      text = t(
        'crud.bulkToast.updatedMany',
        '{count} documents have been updated.',
        { count: affectedDocuments }
      );
  }

  const closeAndThenRefresh = () => {
    closeToast('bulk-update-toast');
    onRefresh();
  };

  openToast('bulk-update-toast', {
    title: '',
    variant: 'success',
    dismissible: true,
    description: (
      <ToastBody
        statusMessage={text}
        actionHandler={closeAndThenRefresh}
        actionText={t('crud.bulkToast.refresh', 'refresh')}
      />
    ),
  });
}

type BulkUpdateInProgressToastProps = {
  affectedDocuments?: number;
  language?: string;
};

export function openBulkUpdateProgressToast({
  affectedDocuments,
  language,
}: BulkUpdateInProgressToastProps): void {
  const t = bulkTranslator(language);
  let text;
  switch (affectedDocuments) {
    case undefined:
      text = t(
        'crud.bulkToast.updateInProgress',
        'The update operation is in progress.'
      );
      break;
    case 1:
      text = t(
        'crud.bulkToast.updatingOne',
        '{count} document is being updated.',
        { count: affectedDocuments }
      );
      break;
    default:
      text = t(
        'crud.bulkToast.updatingMany',
        '{count} documents are being updated.',
        { count: affectedDocuments }
      );
  }

  openToast('bulk-update-toast', {
    title: '',
    variant: 'progress',
    dismissible: true,
    description: <ToastBody statusMessage={text} />,
  });
}

export const openBulkUpdateFailureToast = (
  props: Omit<BulkOperationFailureToastProps, 'type'>
): void => openBulkOperationFailureToast({ ...props, type: 'update' });
