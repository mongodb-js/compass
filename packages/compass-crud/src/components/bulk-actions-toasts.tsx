import React from 'react';
import {
  openToast,
  closeToast,
  ToastBody,
  showErrorDetails,
} from '@mongodb-js/compass-components';
import type { MongoServerError } from 'mongodb';

type BulkDeleteSuccessToastProps = {
  affectedDocuments?: number;
  onRefresh: () => void;
};

export function openBulkDeleteSuccessToast({
  affectedDocuments,
  onRefresh,
}: BulkDeleteSuccessToastProps): void {
  let text;
  switch (affectedDocuments) {
    case undefined:
      text = 'The delete operation finished successfully.';
      break;
    case 1:
      text = `${affectedDocuments} document has been deleted.`;
      break;
    default:
      text = `${affectedDocuments} documents have been deleted.`;
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
        actionText="refresh"
      />
    ),
  });
}

type BulkDeleteInProgressToastProps = {
  affectedDocuments?: number;
};

export function openBulkDeleteProgressToast({
  affectedDocuments,
}: BulkDeleteInProgressToastProps): void {
  let text;
  switch (affectedDocuments) {
    case undefined:
      text = 'The delete operation is in progress.';
      break;
    case 1:
      text = `${affectedDocuments} document is being deleted.`;
      break;
    default:
      text = `${affectedDocuments} documents are being deleted.`;
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
  error: Error;
  type: 'delete' | 'update';
};

const isNetworkError = (error: Error) => error.name === 'MongoNetworkError';

export function openBulkOperationFailureToast({
  affectedDocuments,
  error,
  type,
}: BulkOperationFailureToastProps): void {
  let title: string;
  if (isNetworkError(error)) {
    title = `${
      type === 'delete' ? 'Delete' : 'Update'
    } operation - network error occurred.`;
  } else if (affectedDocuments === undefined || type === 'update') {
    title = `The ${type} operation failed.`;
  } else {
    title = `${affectedDocuments} document${
      affectedDocuments === 1 ? '' : 's'
    } could not be deleted.`;
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
          actionText: 'View details',
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
  onRefresh: () => void;
};

export function openBulkUpdateSuccessToast({
  affectedDocuments,
  onRefresh,
}: BulkUpdateSuccessToastProps): void {
  let text;
  switch (affectedDocuments) {
    case undefined:
      text = 'The update operation finished successfully.';
      break;
    case 1:
      text = `${affectedDocuments} document has been updated.`;
      break;
    default:
      text = `${affectedDocuments} documents have been updated.`;
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
        actionText="refresh"
      />
    ),
  });
}

type BulkUpdateInProgressToastProps = {
  affectedDocuments?: number;
};

export function openBulkUpdateProgressToast({
  affectedDocuments,
}: BulkUpdateInProgressToastProps): void {
  let text;
  switch (affectedDocuments) {
    case undefined:
      text = 'The update operation is in progress.';
      break;
    case 1:
      text = `${affectedDocuments} document is being updated.`;
      break;
    default:
      text = `${affectedDocuments} documents are being updated.`;
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
