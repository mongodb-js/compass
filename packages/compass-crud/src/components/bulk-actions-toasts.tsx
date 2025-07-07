import React from 'react';
import {
  openToast,
  closeToast,
  ToastBody,
} from '@mongodb-js/compass-components';
import { MongoNetworkError } from 'mongodb';

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

type BulkDeleteFailureToastProps = {
  affectedDocuments?: number;
  error: any;
};

const isNetworkError = (error: any) => error instanceof MongoNetworkError;

export function openBulkDeleteFailureToast({
  affectedDocuments,
  error,
}: BulkDeleteFailureToastProps): void {
  let title: string;
  if (isNetworkError(error)) {
    title = 'Delete operation - network error occurred.';
  } else
    switch (affectedDocuments) {
      case undefined:
        title = 'The delete operation failed.';
        break;
      case 1:
        title = `${affectedDocuments} document could not been deleted.`;
        break;
      default:
        title = `${affectedDocuments} documents could not been deleted.`;
    }

  openToast('bulk-delete-toast', {
    title,
    variant: 'warning',
    dismissible: true,
    description: <ToastBody statusMessage={error.message} />,
  });
}

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

type BulkUpdateFailureToastProps = {
  affectedDocuments?: number;
  error: any;
};

export function openBulkUpdateFailureToast({
  affectedDocuments,
  error,
}: BulkUpdateFailureToastProps): void {
  let title: string;
  if (isNetworkError(error)) {
    title = 'Update operation - network error occurred.';
  } else
    switch (affectedDocuments) {
      case undefined:
        title = 'The update operation failed.';
        break;
      case 1:
        title = `${affectedDocuments} document could not been updated.`;
        break;
      default:
        title = `${affectedDocuments} documents could not been updated.`;
    }

  openToast('bulk-update-toast', {
    title,
    variant: 'warning',
    dismissible: true,
    description: <ToastBody statusMessage={error.message} />,
  });
}
