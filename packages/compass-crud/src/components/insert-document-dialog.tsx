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
  css,
  DocumentList,
  FormModal,
  Icon,
  SegmentedControl,
  SegmentedControlOption,
  spacing,
  useSyncStateOnPropChange,
  InfoSprinkle,
  Code,
  Tooltip,
} from '@mongodb-js/compass-components';

import type { InsertCSFLEWarningBannerProps } from './insert-csfle-warning-banner';
import InsertCSFLEWarningBanner from './insert-csfle-warning-banner';
import InsertDocumentEditor, {
  INSERT_EDITOR_MIN_HEIGHT,
} from './insert-document-editor';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import { withLogger } from '@mongodb-js/compass-logging/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { InsertDocumentView, WriteError } from '../stores/crud-store';
import {
  parseInsertDocumentText,
  toInsertHadronDocument,
} from '../stores/crud-store';
import { useSafeIntegerLinter } from '@mongodb-js/compass-editor';
import type { Extension, EditorRef } from '@mongodb-js/compass-editor';
import { InsertDocumentDialogBanner } from './insert-document-dialog-banner';
import InsertEJSONConversionBanner from './insert-ejson-conversion-banner';
import { convertEJSONToShellSyntax } from '../utils/ejson-conversion';
import { useConnectionInfoRef } from '@mongodb-js/compass-connections/provider';

/**
 * The insert invalid message.
 */
const INSERT_INVALID_MESSAGE =
  'Insert not permitted while document contains errors.';

const documentViewId = 'insert-document-view';

const toolbarStyles = css({
  marginTop: spacing[200],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: spacing[200],
});

const modalBodyStyles = css({
  display: 'flex',
  flexDirection: 'column',
  paddingBottom: 0,
});

const documentViewContainer = css({
  marginTop: spacing[400],
  flex: '1 1 auto',
  // Keeps the views the same height when switching between them with little content.
  minHeight: INSERT_EDITOR_MIN_HEIGHT,
  overflow: 'auto',
});

const insertDocumentStyles = css({
  // We give it a good amount of spacing for dropdown menus.
  // TODO(COMPASS-6271): We'll use portals in the document editing Menu
  // so we don't need special padding here.
  paddingBottom: spacing[1800] + spacing[400],
});

const insertViewOptions = [
  {
    value: 'shell',
    label: 'Shell syntax',
    testId: 'insert-document-dialog-view-shell',
    glyph: 'Shell',
  },
  {
    value: 'list',
    label: 'Visual editor',
    testId: 'insert-document-dialog-view-list',
    glyph: 'Menu',
  },
  {
    value: 'json',
    label: 'EJSON',
    testId: 'insert-document-dialog-view-json',
    glyph: 'CurlyBraces',
  },
] as const;

export type InsertDocumentDialogProps = InsertCSFLEWarningBannerProps & {
  closeInsertDocumentDialog: () => void;
  toggleInsertDocumentView: (view: InsertDocumentView) => void;
  insertDocument: () => void;
  insertMany: () => void;
  isOpen: boolean;
  error: WriteError;
  mode: 'modifying' | 'error';
  version: string;
  updateInsertDocText: (value: string | null) => void;
  editorText: string;
  insertView: InsertDocumentView;
  doc: Document | null;
  ns: string;
  isCommentNeeded: boolean;
  updateComment: (isCommentNeeded: boolean) => void;
  logger?: Logger;
  track?: TrackFunction;
};

const DocumentOrJsonView: React.FC<{
  insertView: InsertDocumentView;
  doc: InsertDocumentDialogProps['doc'];
  isManyDocuments: boolean;
  updateInsertDocText: InsertDocumentDialogProps['updateInsertDocText'];
  editorText: InsertDocumentDialogProps['editorText'];
  safeIntegerLinter: Extension;
  editorRef: React.RefObject<EditorRef>;
  namespace: string;
}> = ({
  insertView,
  doc,
  isManyDocuments,
  updateInsertDocText,
  editorText,
  safeIntegerLinter,
  editorRef,
  namespace,
}) => {
  if (insertView !== 'list') {
    return (
      <InsertDocumentEditor
        updateInsertDocText={updateInsertDocText}
        editorText={editorText}
        safeIntegerLinter={safeIntegerLinter}
        editorRef={editorRef}
        shellSyntax={insertView === 'shell'}
        namespace={namespace}
      />
    );
  }

  if (isManyDocuments) {
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

  return (
    <div className={insertDocumentStyles} data-testid="insert-document-modal">
      <DocumentList.Document value={doc} editable editing />
    </div>
  );
};

/**
 * Component for the insert document dialog.
 */
const InsertDocumentDialog: React.FC<InsertDocumentDialogProps> = ({
  isOpen,
  insertView,
  editorText,
  doc,
  error: documentWriteError,
  ns,
  csfleState,
  track,
  logger,
  insertMany,
  insertDocument,
  toggleInsertDocumentView,
  updateInsertDocText,
  closeInsertDocumentDialog,
}) => {
  const editorRef = useRef<EditorRef>(null);
  const connectionInfoRef = useConnectionInfoRef();
  const [invalidElements, setInvalidElements] = useState<Document['uuid'][]>(
    []
  );
  const [insertInProgress, setInsertInProgress] = useState(false);

  // Parsing is not free for large documents and several things below need
  // either the parsed value or the error, so the text is only parsed once per
  // change here. In the list view the editor text is not the source of truth,
  // so there is nothing to parse.
  const parseResult = useMemo((): {
    value: unknown;
    error: Error | null;
  } => {
    if (insertView === 'list') {
      return { value: null, error: null };
    }
    try {
      const value = parseInsertDocumentText(insertView, editorText);
      // Not everything that parses can be inserted as a document, and that is
      // part of what makes the text invalid.
      toInsertHadronDocument(value);
      return { value, error: null };
    } catch (e) {
      return { value: null, error: e as Error };
    }
  }, [editorText, insertView]);

  // The visual editor can only represent a single document, so disable it when
  // the editor holds an array.
  const isManyDocuments = Array.isArray(parseResult.value);

  /**
   * Does the document have errors with the bson types? Checks for
   * invalidElements in hadron doc if in HadronDocument view, or parsing error
   * in the JSON and shell views of the modal.
   */
  const documentValidationError = useMemo(() => {
    if (insertView !== 'list') {
      return parseResult.error;
    }
    return invalidElements.length > 0
      ? new Error(INSERT_INVALID_MESSAGE)
      : null;
  }, [insertView, parseResult, invalidElements]);

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
      if (documentValidationError) {
        setInvalidElements((invalidElements) =>
          without(invalidElements, el.uuid)
        );
      } else {
        setInvalidElements([]);
      }
    },
    [documentValidationError, setInvalidElements]
  );

  useEffect(() => {
    if (isOpen && track) {
      track('Screen', { name: 'insert_document_modal' }, undefined);
    }
  }, [isOpen, track]);

  useSyncStateOnPropChange(() => {
    if (insertView === 'list') {
      // When switching to Hadron Document View.
      // Reset the invalid elements list, which contains the
      // uuids of each element that has BSON type cast errors.
      setInvalidElements([]);
    }
  }, [insertView]);

  useEffect(() => {
    if (!doc) {
      return;
    }
    doc.addListener(Element.Events.Invalid, handleInvalid);
    doc.addListener(Element.Events.Valid, handleValid);
    doc.addListener(Element.Events.Removed, handleValid);
    return () => {
      doc.removeListener(Element.Events.Invalid, handleInvalid);
      doc.removeListener(Element.Events.Valid, handleValid);
      doc.removeListener(Element.Events.Removed, handleValid);
    };
  }, [doc, handleInvalid, handleValid]);

  const handleInsert = useCallback(() => {
    setInsertInProgress(true);
    // This is kinda silly: the banner shows up for just a blip and immediately
    // disappears. There's probably a better way to deal with that state
    setTimeout(() => {
      setInsertInProgress(false);
    }, 0);
    if (isManyDocuments) {
      insertMany();
    } else {
      insertDocument();
    }
  }, [setInsertInProgress, insertMany, insertDocument, isManyDocuments]);

  /**
   * Switches between the JSON, Shell, and Hadron Document views.
   *
   * @param {String} view - which view we are switching to: JSON, Shell or List.
   */
  const switchInsertDocumentView = useCallback(
    (view: string) => {
      toggleInsertDocumentView(view as InsertDocumentView);
    },
    [toggleInsertDocumentView]
  );

  const [failedConversion, setFailedConversion] = useState<{
    text: string;
    message: string;
  } | null>(null);

  // A failed conversion leaves the text as it was, so the error only applies
  // while the document is unchanged.
  const conversionError =
    failedConversion?.text === editorText ? failedConversion.message : null;

  const onFixEJSONToShellSyntax = useCallback(() => {
    let succeeded = false;
    try {
      updateInsertDocText(convertEJSONToShellSyntax(parseResult.value));
      succeeded = true;
    } catch (err) {
      setFailedConversion({
        text: editorText,
        message: (err as Error).message,
      });
      logger?.log.error(
        logger.mongoLogId(1_001_000_440),
        'Insert Document Dialog',
        'Failed to convert Extended JSON to shell syntax',
        err
      );
    }
    track?.(
      'Extended JSON Conversion Attempted',
      { success: succeeded },
      connectionInfoRef.current
    );
  }, [
    parseResult,
    editorText,
    updateInsertDocText,
    logger,
    track,
    connectionInfoRef,
  ]);

  const {
    onFixViolations: onFixSafeIntegerViolations,
    violations: safeIntegerViolations,
    safeIntegerLinter,
  } = useSafeIntegerLinter({
    editorRef,
    onFixViolation: (source: string) => {
      track?.('Safe Integer Fix Applied', {
        source:
          insertView === 'shell'
            ? 'insert-document-editor-shell'
            : 'insert-document-editor-json',
      });
      return insertView === 'shell'
        ? `Long("${source}")`
        : `{"$numberLong": "${source}"}`;
    },
  });

  const isTextView = insertView !== 'list';

  // Switching views re-parses and re-serializes the text, which would silently
  // round an unsafe number and clear the warning, so the violations have to be
  // fixed before the view can change.
  const hasSafeIntegerViolations = safeIntegerViolations.length > 0;

  // `SegmentedControl` overrides the `ref` on its options, so we can't anchor
  // the tooltip that way. Instead we capture the hovered option's element from
  // the mouse event and point a single tooltip at it. We keep the label after
  // unhovering so the text stays visible through the close animation.
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipLabel, setTooltipLabel] = useState('');
  const hoveredOptionRef = useRef<HTMLElement | null>(null);

  return (
    <FormModal
      title="Insert Document"
      subtitle={`To collection ${ns}`}
      open={isOpen}
      onSubmit={handleInsert}
      onCancel={closeInsertDocumentDialog}
      submitButtonText="Insert"
      submitDisabled={Boolean(
        documentValidationError || safeIntegerViolations.length > 0
      )}
      data-testid="insert-document-modal"
      minBodyHeight={spacing[1600] * 2} // make sure there is enough space for the menu
      bodyClassName={modalBodyStyles}
    >
      <div className={toolbarStyles}>
        {isTextView && (
          <InfoSprinkle>
            Paste a document, or an array to insert multiple. If an ObjectId is
            not specified, one is assigned automatically.
            <Code
              language="javascript"
              copyButtonAppearance="none"
            >{`[{ "title": "..." }, ...]`}</Code>
          </InfoSprinkle>
        )}
        <SegmentedControl
          label="View"
          size="xsmall"
          value={insertView}
          aria-controls={documentViewId}
          onChange={switchInsertDocumentView}
        >
          {insertViewOptions.map((option) => {
            const disabledForManyDocs =
              option.value === 'list' && isManyDocuments;
            return (
              <SegmentedControlOption
                key={option.value}
                disabled={
                  Boolean(documentValidationError) ||
                  hasSafeIntegerViolations ||
                  disabledForManyDocs
                }
                data-testid={option.testId}
                aria-label={option.label}
                value={option.value}
                glyph={<Icon glyph={option.glyph} />}
                onMouseEnter={(evt) => {
                  hoveredOptionRef.current = evt.currentTarget;
                  setTooltipLabel(
                    disabledForManyDocs
                      ? 'The visual editor is unavailable for multiple documents'
                      : hasSafeIntegerViolations
                      ? 'Fix the numbers exceeding the safe integer range to switch views'
                      : option.label
                  );
                  setTooltipOpen(true);
                }}
                onMouseLeave={() => setTooltipOpen(false)}
                onClick={(evt) => {
                  // We override the `onClick` functionality to prevent form submission.
                  // The value changing occurs in the `onChange` in the `SegmentedControl`.
                  evt.preventDefault();
                }}
              ></SegmentedControlOption>
            );
          })}
        </SegmentedControl>
        <Tooltip open={tooltipOpen} refEl={hoveredOptionRef}>
          {tooltipLabel}
        </Tooltip>
      </div>
      <div className={documentViewContainer} id={documentViewId}>
        <DocumentOrJsonView
          insertView={insertView}
          doc={doc}
          isManyDocuments={isManyDocuments}
          updateInsertDocText={updateInsertDocText}
          editorText={editorText}
          safeIntegerLinter={safeIntegerLinter}
          editorRef={editorRef}
          namespace={ns}
        />
      </div>
      {insertView === 'shell' && (
        <InsertEJSONConversionBanner
          parsedEditorText={parseResult.value}
          conversionError={conversionError}
          onConvert={onFixEJSONToShellSyntax}
        />
      )}
      <InsertDocumentDialogBanner
        documentValidationError={documentValidationError}
        documentWriteError={documentWriteError}
        insertInProgress={insertInProgress}
        safeIntegerViolationCount={safeIntegerViolations.length}
        onFixSafeIntegerViolations={onFixSafeIntegerViolations}
      />
      <InsertCSFLEWarningBanner csfleState={csfleState} />
    </FormModal>
  );
};

export default withLogger(InsertDocumentDialog, 'COMPASS-CRUD-UI');
