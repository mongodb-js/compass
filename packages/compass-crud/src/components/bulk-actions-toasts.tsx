import React from 'react';
import { openToast, ToastBody } from '@mongodb-js/compass-components';

type BulkDeleteSuccessToastProps = {
  affectedDocuments: number;
  onRefresh: () => void;
};

export function openBulkDeleteSuccessToast({
  affectedDocuments,
  onRefresh,
}: BulkDeleteSuccessToastProps): void {
  const text =
    affectedDocuments === 1
      ? `${affectedDocuments} document has been deleted.`
      : `${affectedDocuments} documents have been deleted.`;

  openToast('bulk-delete-toast', {
    title: '',
    variant: 'success',
    dismissible: true,
    timeout: 6_000,
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
  affectedDocuments: number;
};

export function openBulkDeleteProgressToast({
  affectedDocuments,
}: BulkDeleteInProgressToastProps): void {
  const text =
    affectedDocuments === 1
      ? `${affectedDocuments} document is being deleted.`
      : `${affectedDocuments} documents are being deleted.`;

  openToast('bulk-delete-toast', {
    title: '',
    variant: 'progress',
    dismissible: true,
    description: <ToastBody statusMessage={text} />,
  });
}

type BulkDeleteFailureToastProps = {
  affectedDocuments: number;
};

export function openBulkDeleteFailureToast({
  affectedDocuments,
}: BulkDeleteFailureToastProps): void {
  const text =
    affectedDocuments === 1
      ? `${affectedDocuments} document could not be deleted.`
      : `${affectedDocuments} documents could not be deleted.`;

  openToast('bulk-delete-toast', {
    title: '',
    variant: 'warning',
    dismissible: true,
    timeout: 6_000,
    description: <ToastBody statusMessage={text} />,
  });
}

type BulkUpdateSuccessToastProps = {
  affectedDocuments: number;
  onRefresh: () => void;
};

export function openBulkUpdateSuccessToast({
  affectedDocuments,
  onRefresh,
}: BulkUpdateSuccessToastProps): void {
  const text =
    affectedDocuments === 1
      ? `${affectedDocuments} document has been updated.`
      : `${affectedDocuments} documents have been updated.`;

  openToast('bulk-update-toast', {
    title: '',
    variant: 'success',
    dismissible: true,
    timeout: 6_000,
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
  affectedDocuments: number;
};

export function openBulkUpdateProgressToast({
  affectedDocuments,
}: BulkUpdateInProgressToastProps): void {
  const text =
    affectedDocuments === 1
      ? `${affectedDocuments} document is being updated.`
      : `${affectedDocuments} documents are being updated.`;

  openToast('bulk-update-toast', {
    title: '',
    variant: 'progress',
    dismissible: true,
    description: <ToastBody statusMessage={text} />,
  });
}

type BulkUpdateFailureToastProps = {
  affectedDocuments: number;
};

export function openBulkUpdateFailureToast({
  affectedDocuments,
}: BulkUpdateFailureToastProps): void {
  const text =
    affectedDocuments === 1
      ? `${affectedDocuments} document could not be updated.`
      : `${affectedDocuments} documents could not be updated.`;

  openToast('bulk-update-toast', {
    title: '',
    variant: 'warning',
    dismissible: true,
    timeout: 6_000,
    description: <ToastBody statusMessage={text} />,
  });
}
