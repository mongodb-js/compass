import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { default as HadronDocumentType } from 'hadron-document';
import { Element } from 'hadron-document';
import { Button } from '../leafygreen';
import { css, spacing, uiColors } from '../..';

const enum Status {
  Initial = 'Initial',
  Editing = 'Editing',
  Modified = 'Modified',
  ContainsErrors = 'ContainsErrors',
  UpdateStart = 'UpdateStart',
  UpdateBlocked = 'UpdateBlocked',
  UpdateSuccess = 'UpdateSuccess',
  UpdateError = 'UpdateError',
  Deleting = 'Deleting',
  DeleteStart = 'DeleteStart',
  DeleteSuccess = 'DeleteSuccess',
  DeleteError = 'DeleteError',
}

function isDeleting(status: Status): boolean {
  return [
    Status.Deleting,
    Status.DeleteStart,
    Status.DeleteSuccess,
    Status.DeleteError,
  ].includes(status);
}

function isSuccess(status: Status): boolean {
  return [Status.DeleteSuccess, Status.UpdateSuccess].includes(status);
}

function isPrimaryActionDisabled(status: Status): boolean {
  return [
    Status.Editing,
    Status.ContainsErrors,
    Status.UpdateStart,
    Status.UpdateSuccess,
    Status.DeleteStart,
    Status.DeleteSuccess,
  ].includes(status);
}

function isCancelDisabled(status: Status): boolean {
  return [
    Status.UpdateStart,
    Status.UpdateSuccess,
    Status.DeleteStart,
    Status.DeleteSuccess,
  ].includes(status);
}

const StatusMessages: Record<Status, string> = {
  [Status.Initial]: '',
  [Status.Editing]: '',
  [Status.Deleting]: 'Document flagged for deletion.',
  [Status.Modified]: 'Document modified.',
  [Status.ContainsErrors]:
    'Update not permitted while document contains errors.',
  [Status.UpdateStart]: 'Updating document…',
  [Status.UpdateError]: '',
  [Status.UpdateBlocked]:
    'Document was modified in the background or it longer exists. Do you wish to continue and possibly overwrite new changes?',
  [Status.UpdateSuccess]: 'Document updated.',
  [Status.DeleteStart]: 'Removing document…',
  [Status.DeleteError]: '',
  [Status.DeleteSuccess]: 'Document deleted.',
};

function useHadronDocumentStatus(
  doc: HadronDocumentType,
  editing: boolean,
  deleting: boolean
) {
  const [status, setStatus] = useState(() => {
    return editing
      ? doc.isModified()
        ? Status.Modified
        : Status.Editing
      : deleting
      ? Status.Deleting
      : Status.Initial;
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const invalidElementsRef = useRef(new Set());

  const updateStatus = useCallback((newStatus: Status, errorMessage = null) => {
    setStatus(newStatus);
    setErrorMessage(errorMessage);
  }, []);

  useEffect(() => {
    if (status !== Status.Initial) {
      return;
    }

    if (editing) {
      updateStatus(Status.Editing);
    } else if (deleting) {
      updateStatus(Status.Deleting);
    }
  }, [status, updateStatus, editing, deleting]);

  useEffect(() => {
    const onUpdate = () => {
      updateStatus(
        invalidElementsRef.current.size === 0
          ? doc.isModified()
            ? Status.Modified
            : Status.Editing
          : Status.ContainsErrors
      );
    };
    const onElementValid = (el: Element) => {
      invalidElementsRef.current.delete(el);
      onUpdate();
    };
    const onElementInvalid = (el: Element) => {
      invalidElementsRef.current.add(el);
      onUpdate();
    };
    const onUpdateStart = () => {
      updateStatus(Status.UpdateStart);
    };
    const onUpdateBlocked = () => {
      updateStatus(Status.UpdateBlocked);
    };
    const onUpdateSuccess = () => {
      updateStatus(Status.UpdateSuccess);
    };
    const onUpdateError = (err: string) => {
      updateStatus(Status.UpdateError, err);
    };
    const onRemoveStart = () => {
      updateStatus(Status.DeleteStart);
    };
    const onRemoveSuccess = () => {
      updateStatus(Status.DeleteSuccess);
    };
    const onRemoveError = (err: string) => {
      updateStatus(Status.DeleteError, err);
    };

    doc.on(Element.Events.Added, onUpdate);
    doc.on(Element.Events.Edited, onUpdate);
    doc.on(Element.Events.Removed, onUpdate);
    doc.on(Element.Events.Reverted, onUpdate);
    doc.on(Element.Events.Invalid, onElementInvalid);
    doc.on(Element.Events.Valid, onElementValid);
    doc.on('update-start', onUpdateStart);
    doc.on('update-blocked', onUpdateBlocked);
    doc.on('update-success', onUpdateSuccess);
    doc.on('update-error', onUpdateError);
    doc.on('remove-start', onRemoveStart);
    doc.on('remove-success', onRemoveSuccess);
    doc.on('remove-error', onRemoveError);

    return () => {
      doc.on(Element.Events.Added, onUpdate);
      doc.off(Element.Events.Edited, onUpdate);
      doc.off(Element.Events.Removed, onUpdate);
      doc.off(Element.Events.Reverted, onUpdate);
      doc.off(Element.Events.Invalid, onElementInvalid);
      doc.off(Element.Events.Valid, onElementValid);
      doc.off('update-start', onUpdateStart);
      doc.off('update-blocked', onUpdateBlocked);
      doc.off('update-success', onUpdateSuccess);
      doc.off('update-error', onUpdateError);
      doc.off('remove-start', onRemoveStart);
      doc.off('remove-success', onRemoveSuccess);
      doc.off('remove-error', onRemoveError);
    };
  }, [doc, updateStatus]);

  useEffect(() => {
    if (isSuccess(status)) {
      const timeoutId = setTimeout(() => {
        updateStatus(Status.Initial);
      }, 2000);
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [status, updateStatus]);

  return { status, updateStatus, errorMessage };
}

const container = css({
  display: 'flex',
  paddingTop: spacing[2],
  paddingRight: spacing[2],
  paddingBottom: spacing[2],
  paddingLeft: spacing[3],
  alignItems: 'center',
  gap: spacing[2],
});

const message = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const buttonGroup = css({
  display: 'flex',
  marginLeft: 'auto',
  gap: spacing[2],
});

const button = css({
  flex: 'none',
});

function getColorStyles(status: Status): React.CSSProperties {
  switch (status) {
    case Status.Editing:
      return { backgroundColor: uiColors.gray.light2 };
    case Status.ContainsErrors:
    case Status.UpdateError:
    case Status.UpdateBlocked:
    case Status.Deleting:
    case Status.DeleteError:
    case Status.DeleteStart:
      return {
        backgroundColor: uiColors.red.light2,
        color: uiColors.red.dark3,
      };
    case Status.UpdateStart:
      return {
        backgroundColor: uiColors.blue.light2,
        color: uiColors.blue.dark3,
      };
    case Status.DeleteSuccess:
    case Status.UpdateSuccess:
      return {
        backgroundColor: uiColors.green.light2,
        color: uiColors.green.dark3,
      };
    default:
      return {
        backgroundColor: uiColors.yellow.light2,
        color: uiColors.yellow.dark3,
      };
  }
}

const EditActionsFooter: React.FunctionComponent<{
  doc: HadronDocumentType;
  editing: boolean;
  deleting: boolean;
  modified?: boolean;
  containsErrors?: boolean;
  alwaysForceUpdate?: boolean;
  onUpdate(force: boolean): void;
  onDelete(): void;
  onCancel?: () => void;
}> = ({
  doc,
  editing,
  deleting,
  modified = false,
  containsErrors = false,
  alwaysForceUpdate = false,
  onUpdate,
  onDelete,
  onCancel,
}) => {
  const {
    status: _status,
    updateStatus,
    errorMessage,
  } = useHadronDocumentStatus(doc, editing, deleting);

  // Allow props to override event based status of the document (helpful for
  // JSON editor where changing the document text doesn't really generate any
  // changes of the HadronDocument)
  const status = containsErrors
    ? Status.ContainsErrors
    : modified
    ? Status.Modified
    : _status;

  const statusMessage = StatusMessages[status];

  if (status === Status.Initial) {
    return null;
  }

  return (
    <div
      className={container}
      style={getColorStyles(status)}
      data-testid="document-footer"
      data-status={status}
    >
      <div className={message} data-testid="document-footer-message">
        {errorMessage ?? statusMessage}
      </div>
      {!isSuccess(status) && (
        <div className={buttonGroup}>
          <Button
            type="button"
            size="xsmall"
            className={button}
            data-testid="cancel-button"
            onClick={() => {
              doc.cancel();
              onCancel?.();
              updateStatus(Status.Initial);
            }}
            disabled={isCancelDisabled(status)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="xsmall"
            className={button}
            data-testid={isDeleting(status) ? 'delete-button' : 'update-button'}
            onClick={() => {
              if (isDeleting(status)) {
                onDelete();
              } else {
                onUpdate(alwaysForceUpdate || status === Status.UpdateBlocked);
              }
            }}
            disabled={isPrimaryActionDisabled(status)}
          >
            {isDeleting(status)
              ? 'Delete'
              : alwaysForceUpdate || status === Status.UpdateBlocked
              ? 'Replace'
              : 'Update'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EditActionsFooter;
