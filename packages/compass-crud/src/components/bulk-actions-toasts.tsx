import React from 'react';
import { openToast, ToastBody } from '@mongodb-js/compass-components';

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

  openToast('bulk-delete-toast', {
    title: '',
    variant: 'success',
    dismissible: true,
    description: (
      <ToastBody
        statusMessage={text}
        actionHandler={onRefresh}
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
};

export function openBulkDeleteFailureToast({
  affectedDocuments,
}: BulkDeleteFailureToastProps): void {
  let text;
  switch (affectedDocuments) {
    case undefined:
      text = 'The delete operation failed.';
      break;
    case 1:
      text = `${affectedDocuments} document could not been deleted.`;
      break;
    default:
      text = `${affectedDocuments} documents could not been deleted.`;
  }

  openToast('bulk-delete-toast', {
    title: '',
    variant: 'warning',
    dismissible: true,
    timeout: 6_000,
    description: <ToastBody statusMessage={text} />,
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

  openToast('bulk-update-toast', {
    title: '',
    variant: 'success',
    dismissible: true,
    description: (
      <ToastBody
        statusMessage={text}
        actionHandler={onRefresh}
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
};

export function openBulkUpdateFailureToast({
  affectedDocuments,
}: BulkUpdateFailureToastProps): void {
  let text;
  switch (affectedDocuments) {
    case undefined:
      text = 'The update operation failed.';
      break;
    case 1:
      text = `${affectedDocuments} document could not been updated.`;
      break;
    default:
      text = `${affectedDocuments} documents could not been updated.`;
  }

  openToast('bulk-update-toast', {
    title: '',
    variant: 'warning',
    dismissible: true,
    timeout: 6_000,
    description: <ToastBody statusMessage={text} />,
  });
}
