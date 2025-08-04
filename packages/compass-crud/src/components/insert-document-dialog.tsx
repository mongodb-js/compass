import { without } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type Document from 'hadron-document';
import { Element } from 'hadron-document';
import {
  Banner,
  Button,
  css,
  FormModal,
  Icon,
  SegmentedControl,
  SegmentedControlOption,
  spacing,
  showErrorDetails,
} from '@mongodb-js/compass-components';

import type { InsertCSFLEWarningBannerProps } from './insert-csfle-warning-banner';
import InsertCSFLEWarningBanner from './insert-csfle-warning-banner';
import InsertJsonDocument from './insert-json-document';
import InsertDocument from './insert-document';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import { withLogger } from '@mongodb-js/compass-logging/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { WriteError } from '../stores/crud-store';

/**
 * The insert invalid message.
 */
const INSERT_INVALID_MESSAGE =
  'Insert not permitted while document contains errors.';

const documentViewId = 'insert-document-view';

const toolbarStyles = css({
  marginTop: spacing[200],
  display: 'flex',
  justifyContent: 'flex-end',
});

const documentViewContainer = css({
  marginTop: spacing[400],
});

const bannerStyles = css({
  marginTop: spacing[400],
});

const errorDetailsBtnStyles = css({
  float: 'right',
});

export type InsertDocumentDialogProps = InsertCSFLEWarningBannerProps & {
  closeInsertDocumentDialog: () => void;
  toggleInsertDocumentView: (view: 'JSON' | 'List') => void;
  toggleInsertDocument: (view: 'JSON' | 'List') => void;
  insertDocument: () => void;
  insertMany: () => void;
  isOpen: boolean;
  error: WriteError;
  mode: 'modifying' | 'error';
  version: string;
  updateJsonDoc: (value: string | null) => void;
  jsonDoc: string;
  jsonView: boolean;
  doc: Document;
  ns: string;
  isCommentNeeded: boolean;
  updateComment: (isCommentNeeded: boolean) => void;
  logger?: Logger;
  track?: TrackFunction;
};

const DocumentOrJsonView: React.FC<{
  jsonView: InsertDocumentDialogProps['jsonView'];
  doc: InsertDocumentDialogProps['doc'];
  hasManyDocuments: () => boolean;
  updateJsonDoc: InsertDocumentDialogProps['updateJsonDoc'];
  jsonDoc: InsertDocumentDialogProps['jsonDoc'];
  isCommentNeeded: InsertDocumentDialogProps['isCommentNeeded'];
  updateComment: InsertDocumentDialogProps['updateComment'];
}> = ({
  jsonView,
  doc,
  hasManyDocuments,
  updateJsonDoc,
  jsonDoc,
  isCommentNeeded,
  updateComment,
}) => {
  if (jsonView) {
    return (
      <InsertJsonDocument
        updateJsonDoc={updateJsonDoc}
        jsonDoc={jsonDoc}
        isCommentNeeded={isCommentNeeded}
        updateComment={updateComment}
      />
    );
  }

  if (hasManyDocuments()) {
    return (
      <Banner variant="warning">
        This view is not supported for multiple documents. To specify data types
        and use other functionality of this view, please insert documents one at
        a time.
      </Banner>
    );
  }

  if (!doc) {
    return null;
  }

  return <InsertDocument doc={doc} />;
};

/**
 * Component for the insert document dialog.
 */
const InsertDocumentDialog: React.FC<InsertDocumentDialogProps> = ({
  isOpen,
  jsonView,
  jsonDoc,
  doc,
  isCommentNeeded,
  error: _error,
  ns,
  csfleState,
  track,
  insertMany,
  insertDocument,
  toggleInsertDocument,
  toggleInsertDocumentView,
  updateJsonDoc,
  updateComment,
  closeInsertDocumentDialog,
}) => {
  const [invalidElements, setInvalidElements] = useState<Document['uuid'][]>(
    []
  );
  const [insertInProgress, setInsertInProgress] = useState(false);

  const hasManyDocuments = useCallback(() => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonDoc);
    } catch {
      return false;
    }
    return Array.isArray(parsed);
  }, [jsonDoc]);

  /**
   * Does the document have errors with the bson types?  Checks for
   * invalidElements in hadron doc if in HadronDocument view, or parsing error
   * in JsonView of the modal
   *
   * Checks for invalidElements in hadron doc if in HadronDocument view, or
   * parsing error in JsonView of the modal
   *
   * @returns {Boolean} If the document has errors.
   */
  const hasErrors = useCallback(() => {
    if (jsonView) {
      try {
        JSON.parse(jsonDoc);
        return false;
      } catch {
        return true;
      }
    }
    return invalidElements.length > 0;
  }, [invalidElements, jsonDoc, jsonView]);

  const handleInvalid = useCallback(
    (el: Element) => {
      if (!invalidElements.includes(el.uuid)) {
        setInvalidElements((elements) => [...elements, el.uuid]);
      }
    },
    [invalidElements]
  );

  const handleValid = useCallback(
    (el: Element) => {
      if (hasErrors()) {
        setInvalidElements((invalidElements) =>
          without(invalidElements, el.uuid)
        );
      } else {
        setInvalidElements([]);
      }
    },
    [hasErrors, setInvalidElements]
  );

  useEffect(() => {
    if (isOpen && track) {
      track('Screen', { name: 'insert_document_modal' }, undefined);
    }
  }, [isOpen, track]);

  const prevJsonView = useRef(jsonView);
  useEffect(() => {
    const viewHasChanged = prevJsonView.current !== jsonView;
    prevJsonView.current = jsonView;
    if (isOpen && !hasManyDocuments() && viewHasChanged) {
      if (!jsonView) {
        // When switching to Hadron Document View.
        // Reset the invalid elements list, which contains the
        // uuids of each element that has BSON type cast errors.
        setInvalidElements([]);
        // Subscribe to the validation errors for BSON types on the document.
        doc.on(Element.Events.Invalid, handleInvalid);
        doc.on(Element.Events.Valid, handleValid);
        doc.on(Element.Events.Removed, handleValid);
      } else {
        // When switching to JSON View.
        // Remove the listeners to the BSON type validation errors in order to clean up properly.
        doc.removeListener(Element.Events.Invalid, handleInvalid);
        doc.removeListener(Element.Events.Valid, handleValid);
        doc.removeListener(Element.Events.Removed, handleValid);
      }
    }
  }, [isOpen, jsonView, doc, handleValid, handleInvalid, hasManyDocuments]);

  useEffect(() => {
    if (insertInProgress) {
      setInsertInProgress(false);
    }
  }, [insertInProgress]);

  const docRef = useRef(doc);
  useEffect(() => {
    if (isOpen) {
      docRef.current = doc;
      return;
    }
    // When closing the modal.
    if (!hasManyDocuments() && docRef.current) {
      // Remove the listeners to the BSON type validation errors in order to clean up properly.
      docRef.current.removeListener(Element.Events.Invalid, handleInvalid);
      docRef.current.removeListener(Element.Events.Valid, handleValid);
      docRef.current.removeListener(Element.Events.Removed, handleValid);
    }
  }, [isOpen, doc, handleInvalid, handleValid, hasManyDocuments]);

  const handleInsert = useCallback(() => {
    setInsertInProgress(true);
    if (hasManyDocuments()) {
      insertMany();
    } else {
      insertDocument();
    }
  }, [setInsertInProgress, insertMany, insertDocument, hasManyDocuments]);

  /**
   * Switches between JSON and Hadron Document views.
   *
   * In case of multiple documents, only switches the this.props.insert.jsonView
   * In other cases, also modifies this.props.insert.doc/jsonDoc to keep data in place.
   *
   * @param {String} view - which view we are looking at: JSON or LIST.
   */
  const switchInsertDocumentView = useCallback(
    (view: string) => {
      if (!hasManyDocuments()) {
        toggleInsertDocument(view as 'JSON' | 'List');
      } else {
        toggleInsertDocumentView(view as 'JSON' | 'List');
      }
    },
    [hasManyDocuments, toggleInsertDocument, toggleInsertDocumentView]
  );

  const currentView = jsonView ? 'JSON' : 'List';
  const variant = insertInProgress ? 'info' : 'danger';

  const error = useMemo(() => {
    if (hasErrors()) {
      return { message: INSERT_INVALID_MESSAGE };
    }
    if (insertInProgress) {
      return { message: 'Inserting Document' };
    }
    return _error;
  }, [_error, hasErrors, insertInProgress]);

  return (
    <FormModal
      title="Insert Document"
      subtitle={`To collection ${ns}`}
      className="insert-document-dialog"
      open={isOpen}
      onSubmit={handleInsert.bind(this)}
      onCancel={closeInsertDocumentDialog}
      submitButtonText="Insert"
      submitDisabled={hasErrors()}
      data-testid="insert-document-modal"
      minBodyHeight={spacing[1600] * 2} // make sure there is enough space for the menu
    >
      <div className={toolbarStyles}>
        <SegmentedControl
          label="View"
          size="xsmall"
          value={currentView}
          aria-controls={documentViewId}
          onChange={switchInsertDocumentView.bind(this)}
        >
          <SegmentedControlOption
            disabled={hasErrors()}
            data-testid="insert-document-dialog-view-json"
            aria-label="E-JSON View"
            value="JSON"
            glyph={<Icon glyph="CurlyBraces" />}
            onClick={(evt) => {
              // We override the `onClick` functionality to prevent form submission.
              // The value changing occurs in the `onChange` in the `SegmentedControl`.
              evt.preventDefault();
            }}
          ></SegmentedControlOption>
          <SegmentedControlOption
            disabled={hasErrors()}
            data-testid="insert-document-dialog-view-list"
            aria-label="Document list"
            value="List"
            onClick={(evt) => {
              // We override the `onClick` functionality to prevent form submission.
              // The value changing occurs in the `onChange` in the `SegmentedControl`.
              evt.preventDefault();
            }}
            glyph={<Icon glyph="Menu" />}
          ></SegmentedControlOption>
        </SegmentedControl>
      </div>
      <div className={documentViewContainer} id={documentViewId}>
        <DocumentOrJsonView
          jsonView={jsonView}
          doc={doc}
          hasManyDocuments={hasManyDocuments}
          updateJsonDoc={updateJsonDoc}
          jsonDoc={jsonDoc}
          isCommentNeeded={isCommentNeeded}
          updateComment={updateComment}
        />
      </div>
      {error && (
        <Banner
          data-testid="insert-document-banner"
          data-variant={variant}
          variant={variant}
          className={bannerStyles}
        >
          {error?.message}
          {error?.info && (
            <Button
              size="xsmall"
              className={errorDetailsBtnStyles}
              onClick={() =>
                showErrorDetails({
                  details: error.info!,
                  closeAction: 'back',
                })
              }
              data-testid="insert-document-error-details-button"
            >
              VIEW ERROR DETAILS
            </Button>
          )}
        </Banner>
      )}
      <InsertCSFLEWarningBanner csfleState={csfleState} />
    </FormModal>
  );
};

export default withLogger(InsertDocumentDialog, 'COMPASS-CRUD-UI');
