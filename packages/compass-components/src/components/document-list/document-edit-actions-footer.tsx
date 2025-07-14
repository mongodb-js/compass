import React, { useCallback, useEffect, useRef, useState } from 'react';
import type HadronDocument from 'hadron-document';
import { DocumentEvents, ElementEvents } from 'hadron-document';
import type { Element } from 'hadron-document';
import { Button } from '../leafygreen';
import { css } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import { useDarkMode } from '../../hooks/use-theme';
import { showErrorDetails } from '../../hooks/use-error-details';

type Status =
  | 'Initial'
  | 'Editing'
  | 'Modified'
  | 'ContainsErrors'
  | 'UpdateStart'
  | 'UpdateBlocked'
  | 'UpdateSuccess'
  | 'UpdateError'
  | 'Deleting'
  | 'DeleteStart'
  | 'DeleteSuccess'
  | 'DeleteError';

function isDeleting(status: Status): boolean {
  return ['Deleting', 'DeleteStart', 'DeleteSuccess', 'DeleteError'].includes(
    status
  );
}

function isSuccess(status: Status): boolean {
  return ['DeleteSuccess', 'UpdateSuccess'].includes(status);
}

function isPrimaryActionDisabled(status: Status): boolean {
  return [
    'Editing',
    'ContainsErrors',
    'UpdateStart',
    'UpdateSuccess',
    'DeleteStart',
    'DeleteSuccess',
  ].includes(status);
}

function isCancelDisabled(status: Status): boolean {
  return [
    'UpdateStart',
    'UpdateSuccess',
    'DeleteStart',
    'DeleteSuccess',
  ].includes(status);
}

const StatusMessages: Record<Status, string> = {
  ['Initial']: '',
  ['Editing']: '',
  ['Deleting']: 'Document flagged for deletion.',
  ['Modified']: 'Document modified.',
  ['ContainsErrors']: 'Update not permitted while document contains errors.',
  ['UpdateStart']: 'Updating document…',
  ['UpdateError']: '',
  ['UpdateBlocked']:
    'Document was modified in the background or it no longer exists. Do you wish to continue and possibly overwrite new changes?',
  ['UpdateSuccess']: 'Document updated.',
  ['DeleteStart']: 'Removing document…',
  ['DeleteError']: '',
  ['DeleteSuccess']: 'Document deleted.',
};

function useHadronDocumentStatus(
  doc: HadronDocument,
  editing: boolean,
  deleting: boolean
) {
  const [status, setStatus] = useState<Status>(() => {
    return editing
      ? doc.isModified()
        ? 'Modified'
        : 'Editing'
      : deleting
      ? 'Deleting'
      : 'Initial';
  });
  const [error, setError] = useState<{
    message: string;
    details?: Record<string, unknown>;
  } | null>(null);
  const invalidElementsRef = useRef(new Set());

  const updateStatus = useCallback(
    (
      newStatus: Status,
      error: Error | null = null,
      errorDetails?: Record<string, unknown>
    ) => {
      setStatus(newStatus);
      setError(
        error
          ? {
              message: error?.message,
              details: errorDetails,
            }
          : null
      );
    },
    []
  );

  useEffect(() => {
    if (status !== 'Initial') {
      return;
    }

    if (editing) {
      updateStatus('Editing');
    } else if (deleting) {
      updateStatus('Deleting');
    }
  }, [status, updateStatus, editing, deleting]);

  useEffect(() => {
    const onUpdate = () => {
      updateStatus(
        invalidElementsRef.current.size === 0
          ? doc.isModified()
            ? 'Modified'
            : 'Editing'
          : 'ContainsErrors'
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
      updateStatus('UpdateStart');
    };
    const onUpdateBlocked = () => {
      updateStatus('UpdateBlocked');
    };
    const onUpdateSuccess = () => {
      updateStatus('UpdateSuccess');
    };
    const onUpdateError = (
      err: Error,
      errorDetails?: Record<string, unknown>
    ) => {
      updateStatus('UpdateError', err, errorDetails);
    };
    const onRemoveStart = () => {
      updateStatus('DeleteStart');
    };
    const onRemoveSuccess = () => {
      updateStatus('DeleteSuccess');
    };
    const onRemoveError = (
      err: Error,
      errorDetails?: Record<string, unknown>
    ) => {
      updateStatus('DeleteError', err, errorDetails);
    };

    const onEditingFinished = () => {
      updateStatus('Initial');
    };

    doc.on(ElementEvents.Added, onUpdate);
    doc.on(ElementEvents.Edited, onUpdate);
    doc.on(ElementEvents.Removed, onUpdate);
    doc.on(ElementEvents.Reverted, onUpdate);
    doc.on(ElementEvents.Invalid, onElementInvalid);
    doc.on(ElementEvents.Valid, onElementValid);
    doc.on(DocumentEvents.UpdateStarted, onUpdateStart);
    doc.on(DocumentEvents.UpdateBlocked, onUpdateBlocked);
    doc.on(DocumentEvents.UpdateSuccess, onUpdateSuccess);
    doc.on(DocumentEvents.UpdateError, onUpdateError);
    doc.on(DocumentEvents.RemoveStarted, onRemoveStart);
    doc.on(DocumentEvents.RemoveSuccess, onRemoveSuccess);
    doc.on(DocumentEvents.RemoveError, onRemoveError);
    doc.on(DocumentEvents.EditingFinished, onEditingFinished);

    return () => {
      doc.off(ElementEvents.Added, onUpdate);
      doc.off(ElementEvents.Edited, onUpdate);
      doc.off(ElementEvents.Removed, onUpdate);
      doc.off(ElementEvents.Reverted, onUpdate);
      doc.off(ElementEvents.Invalid, onElementInvalid);
      doc.off(ElementEvents.Valid, onElementValid);
      doc.off(DocumentEvents.UpdateStarted, onUpdateStart);
      doc.off(DocumentEvents.UpdateBlocked, onUpdateBlocked);
      doc.off(DocumentEvents.UpdateSuccess, onUpdateSuccess);
      doc.off(DocumentEvents.UpdateError, onUpdateError);
      doc.off(DocumentEvents.RemoveStarted, onRemoveStart);
      doc.off(DocumentEvents.RemoveSuccess, onRemoveSuccess);
      doc.off(DocumentEvents.RemoveError, onRemoveError);
      doc.off(DocumentEvents.EditingFinished, onEditingFinished);
    };
  }, [doc, updateStatus]);

  useEffect(() => {
    if (isSuccess(status)) {
      const timeoutId = setTimeout(() => {
        updateStatus('Initial');
      }, 2000);
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [status, updateStatus]);

  return { status, updateStatus, error };
}

const container = css({
  display: 'flex',
  paddingTop: spacing[200],
  paddingRight: spacing[200],
  paddingBottom: spacing[200],
  paddingLeft: spacing[400],
  alignItems: 'center',
  gap: spacing[200],
  borderBottomLeftRadius: 'inherit',
  borderBottomRightRadius: 'inherit',
});

const message = css({
  overflow: 'scroll',
});

const buttonGroup = css({
  display: 'flex',
  marginLeft: 'auto',
  gap: spacing[200],
  flexShrink: 0,
});

const button = css({
  flex: 'none',
});

function getColorStyles(
  status: Status,
  darkMode?: boolean
): React.CSSProperties {
  switch (status) {
    case 'Editing':
      return {
        backgroundColor: darkMode ? palette.black : palette.gray.light2,
      };
    case 'ContainsErrors':
    case 'UpdateError':
    case 'UpdateBlocked':
    case 'Deleting':
    case 'DeleteError':
    case 'DeleteStart':
      return {
        backgroundColor: darkMode ? palette.red.dark3 : palette.red.light2,
        color: darkMode ? palette.red.light2 : palette.red.dark3,
      };
    case 'UpdateStart':
      return {
        backgroundColor: palette.blue.light2,
        color: palette.blue.dark3,
      };
    case 'DeleteSuccess':
    case 'UpdateSuccess':
      return {
        backgroundColor: palette.green.light2,
        color: palette.green.dark3,
      };
    default:
      return {
        backgroundColor: palette.yellow.light2,
        color: palette.yellow.dark3,
      };
  }
}

const EditActionsFooter: React.FunctionComponent<{
  doc: HadronDocument;
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
    error,
  } = useHadronDocumentStatus(doc, editing, deleting);

  const darkMode = useDarkMode();

  // Allow props to override event based status of the document (helpful for
  // JSON editor where changing the document text doesn't really generate any
  // changes of the HadronDocument)
  const status = containsErrors
    ? 'ContainsErrors'
    : modified
    ? 'Modified'
    : _status;

  const statusMessage = StatusMessages[status];

  if (status === 'Initial') {
    return null;
  }

  return (
    <div
      className={container}
      style={getColorStyles(status, darkMode)}
      data-testid="document-footer"
      data-status={status}
    >
      <div className={message} data-testid="document-footer-message">
        {error?.message ?? statusMessage}
      </div>
      {!isSuccess(status) && (
        <div className={buttonGroup}>
          {error?.details && (
            <Button
              className={button}
              size="xsmall"
              onClick={() =>
                showErrorDetails({
                  details: error.details!,
                  closeAction: 'close',
                })
              }
              data-testid="edit-actions-footer-error-details-button"
            >
              VIEW ERROR DETAILS
            </Button>
          )}
          <Button
            type="button"
            size="xsmall"
            className={button}
            data-testid="cancel-button"
            onClick={() => {
              doc.cancel();
              onCancel?.();
              updateStatus('Initial');
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
                onUpdate(alwaysForceUpdate || status === 'UpdateBlocked');
              }
            }}
            disabled={isPrimaryActionDisabled(status)}
          >
            {isDeleting(status)
              ? 'Delete'
              : alwaysForceUpdate || status === 'UpdateBlocked'
              ? 'Replace'
              : 'Update'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EditActionsFooter;
