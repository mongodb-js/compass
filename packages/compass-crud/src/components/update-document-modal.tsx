import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  css,
  cx,
  spacing,
  palette,
  Icon,
  IconButton,
  KeylineCard,
  SegmentedControl,
  SegmentedControlOption,
  Modal,
  ModalBody,
  DocumentList,
  useDarkMode,
  useId,
} from '@mongodb-js/compass-components';
import type { Document } from 'hadron-document';
import HadronDocument from 'hadron-document';
import {
  createDocumentAutocompleter,
  CodemirrorMultilineEditor,
  prettify as prettifyJson,
} from '@mongodb-js/compass-editor';
import type { Action, EditorRef } from '@mongodb-js/compass-editor';

// Documents whose formatted EJSON exceeds this many lines open with all
// branches folded so the user sees a compact overview instead of a long
// scroll. Smaller documents open fully expanded.
const LARGE_DOC_LINE_THRESHOLD = 20;
import { useAutocompleteFields } from '@mongodb-js/compass-field-store';
import type { CrudActions } from '../stores/crud-store';
import UpdateDocumentFind from './update-document-find';
import type { UpdateDocumentFindRef } from './update-document-find';

type EditMode = 'JSON' | 'Tree';

const bodyStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
  height: '100%',
});

// Single-row top bar that lives in the same row as LeafyGreen's close X.
// `paddingRight` reserves space for the absolutely-positioned X button
// (LG puts it at top:18px / right:18px, ~24px wide) so the toolbar's right
// edge controls never collide with it.
const toolbarStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing[300],
  paddingRight: spacing[1200],
});

const titleGroupStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[25],
  flex: 'none',
  minWidth: 0,
});

const titleStyles = css({
  margin: 0,
  fontWeight: 700,
  fontSize: '16px',
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
});

const subtitleStyles = css({
  fontSize: '12px',
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  minWidth: 0,
});

const subtitleLightStyles = css({
  color: palette.gray.dark1,
});

const subtitleDarkStyles = css({
  color: palette.gray.light1,
});

// Find bar grows to fill the row when in JSON mode; an empty placeholder of
// the same flex behaviour keeps the right-side controls anchored consistently
// in Tree mode (where Find is intentionally hidden).
const findGroupStyles = css({
  flex: 1,
  minWidth: spacing[1800] * 2,
});

const controlsGroupStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing[100],
  flex: 'none',
});

// The document is presented inside a KeylineCard (the standard Compass card
// primitive, same as the bulk-update modal's editor). These styles only add
// the fill/scroll behaviour: minHeight:0 lets this flex child shrink within
// the bounded body and own the scroll instead of a tall min-height forcing
// the modal to grow; combined with the definite modal height it fills all
// the way down to the footer.
const editorCardStyles = css({
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
});

// Match the bulk-update editor card: light grey in light mode, KeylineCard's
// own default in dark mode.
const editorCardLightStyles = css({
  backgroundColor: palette.gray.light3,
});

const editorCardDarkStyles = css({});

const treeEditorStyles = css({
  padding: spacing[200],
});

// ModalBody is the scroll container, so the toolbar (which lives inside it,
// above the editor) would scroll away with the document. Pin it to the top,
// and pin the actions footer to the bottom, so they stay put while only the
// editor content scrolls underneath. An opaque background is required so the
// scrolling JSON does not show through.
const stickyHeaderStyles = css({
  position: 'sticky',
  top: 0,
  zIndex: 2,
  paddingBottom: spacing[200],
  backgroundColor: palette.white,
});

const stickyFooterStyles = css({
  position: 'sticky',
  bottom: 0,
  zIndex: 2,
  paddingTop: spacing[200],
  backgroundColor: palette.white,
});

const stickyDarkStyles = css({
  backgroundColor: palette.black,
});

// The underlying LeafyGreen modal is height:auto, so the editor can't fill
// the available space (leaving empty space below it) and the footer floats
// mid-modal. A height:100% chain is fragile through LG's internal wrappers,
// so instead pin a definite height on the dialog and turn it into a flex
// column whose content wrapper grows. LG renders:
//   <dialog className={ours}> <Body as="div"> {ModalBody} </Body>
//   <CloseButton/> <portalDiv/> </dialog>
// so the first child div is the Body wrapper we need to flex-grow. Applied
// via the passed-through className so only this modal is affected (the shared
// full-screen styles are reused by other modals).
const modalContentStyles = css({
  height: `calc(100vh - 2 * ${spacing[600]}px)`,
  display: 'flex',
  flexDirection: 'column',
  // compass-components Modal forces padding:0 on the dialog. Restore a small
  // top padding so the custom toolbar sits in the same vertical band as the
  // close X (absolutely positioned at top:18px from the dialog padding edge),
  // and restore a small right padding so the X has visual breathing room
  // — `right: 18px` is measured from the padding box, so dialog paddingRight
  // shifts the X inward and prevents the hover circle from being clipped by
  // the dialog border.
  paddingTop: spacing[400],
  paddingRight: spacing[400],
  paddingLeft: spacing[400],
  '& > div:first-of-type': {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
});

// ModalBody is a flex sibling of ModalHeader inside the Body wrapper; grow it
// to fill the remaining height and lay its child out as a flex column so the
// editor's flex:1 has a definite height to expand into. ModalBody's own
// contentStyle hard-caps its height (maxHeight: calc(100vh - spacing[1600]*5),
// ~100vh-320px) which is shorter than our dialog and leaves a dead band below
// the footer; override it so flex:1 can actually fill the dialog.
const modalBodyStyles = css({
  flex: 1,
  minHeight: 0,
  maxHeight: 'none',
  display: 'flex',
  flexDirection: 'column',
  // LG ModalBody adds paddingTop: spacing[800] (16px) when it is the first
  // child. Without ModalHeader it IS the first child, and the extra 16px
  // would push the toolbar below the close-X row — zero it out.
  '&:first-child': {
    paddingTop: 0,
  },
});

const noop = () => {
  /* the modal never deletes documents */
};

export type UpdateDocumentModalProps = {
  isOpen: boolean;
  doc: Document | null;
  namespace: string;
  closeUpdateDocumentModal: CrudActions['closeUpdateDocumentModal'];
  replaceDocument: CrudActions['replaceDocument'];
  updateDocument: CrudActions['updateDocument'];
};

const UpdateDocumentModal: React.FunctionComponent<
  UpdateDocumentModalProps
> = ({
  isOpen,
  doc,
  namespace,
  closeUpdateDocumentModal,
  replaceDocument,
  updateDocument,
}) => {
  const darkMode = useDarkMode();
  const editorRef = useRef<EditorRef>(null);
  const findRef = useRef<UpdateDocumentFindRef>(null);
  const editorId = useId();

  const [mode, setMode] = useState<EditMode>('JSON');
  const [jsonText, setJsonText] = useState('');
  const [initialJson, setInitialJson] = useState('');
  const [validationError, setValidationError] = useState<Error | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(true);
  // In small modal mode the Find input is collapsed behind a magnifier
  // IconButton to keep the toolbar single-row; this flag tracks whether the
  // user has opened it. Ignored in full-screen mode (find is always visible
  // there) and irrelevant in Tree mode (find is JSON-only).
  const [isSmallFindOpen, setIsSmallFindOpen] = useState(false);
  // Tracks the JSON editor's logical expand/collapse state for the combined
  // format-and-toggle button. Initialised when the modal opens to match the
  // editor's initial fold pass (large docs open collapsed, small ones open
  // expanded — see initiallyFolded).
  const [isExpanded, setIsExpanded] = useState(true);
  // Drives the editor's initialJSONFoldAll prop. Recomputed from the doc's
  // formatted line count each time the modal opens; large docs default to
  // collapsed so the user sees a compact overview.
  const [initiallyFolded, setInitiallyFolded] = useState(false);
  // Bumped on every open so the editor and find bar fully remount, which
  // clears any prior search and editor state.
  const [renderKey, setRenderKey] = useState(0);
  const wasOpenRef = useRef(false);

  // Opening the modal always resets to a clean, predictable state: the current
  // document loaded as JSON, no errors, JSON mode, full-screen, no search.
  // This runs on the closed -> open transition (including when the modal is
  // mounted already open).
  React.useEffect(() => {
    if (isOpen && !wasOpenRef.current && doc) {
      const ejson = doc.toEJSON();
      // Use the same prettifier the editor uses so the line count we
      // compare against matches what the user will actually see rendered.
      // prettifyJson can throw on malformed input — fall back to the raw
      // EJSON length so opening still works (doc.toEJSON() should always
      // produce parseable output, but defending against this avoids
      // blocking the modal on an edge case).
      let formattedLineCount = 0;
      try {
        formattedLineCount = prettifyJson(ejson, 'json').split('\n').length;
      } catch {
        formattedLineCount = ejson.split('\n').length;
      }
      const shouldFold = formattedLineCount > LARGE_DOC_LINE_THRESHOLD;
      setJsonText(ejson);
      setInitialJson(ejson);
      setMode('JSON');
      setValidationError(null);
      setIsFullScreen(true);
      setIsSmallFindOpen(false);
      setInitiallyFolded(shouldFold);
      setIsExpanded(!shouldFold);
      setRenderKey((key) => key + 1);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, doc]);

  // Tree -> JSON remounts the editor, which reapplies initialJSONFoldAll;
  // resync the toggle state so the button label matches the editor's
  // actual fold state on re-entry.
  React.useEffect(() => {
    if (mode === 'JSON') {
      setIsExpanded(!initiallyFolded);
    }
  }, [mode, initiallyFolded]);

  // Find is JSON-only, and in full-screen mode it is always inline. Either
  // condition turning false means the small-mode collapsed-Find state has
  // nothing to track, so reset it.
  React.useEffect(() => {
    if (isFullScreen || mode !== 'JSON') {
      setIsSmallFindOpen(false);
    }
  }, [isFullScreen, mode]);

  // Auto-focus the Find input when the user opens it in small mode so they
  // can start typing immediately. Must be in an effect — focus() inside the
  // setState callback would run before React mounts UpdateDocumentFind and
  // populates findRef.
  React.useEffect(() => {
    if (isSmallFindOpen) {
      findRef.current?.focus();
    }
  }, [isSmallFindOpen]);

  const fields = useAutocompleteFields(namespace);
  const completer = useMemo(() => {
    return createDocumentAutocompleter(fields.map((field) => field.name));
  }, [fields]);

  const onChangeJson = useCallback((value: string) => {
    try {
      HadronDocument.FromEJSON(value);
      setValidationError(null);
    } catch (error) {
      setValidationError(error as Error);
    } finally {
      setJsonText(value);
    }
  }, []);

  const onModeChange = useCallback(
    (next: string) => {
      const nextMode = next as EditMode;
      if (!doc || nextMode === mode) {
        return;
      }
      if (nextMode === 'Tree') {
        // JSON -> Tree: apply the edited JSON into the structured editor when
        // it is valid. If it cannot be parsed, preserve the current state
        // (stay in JSON, surface the error) rather than losing edits.
        try {
          const parsed = HadronDocument.FromEJSON(jsonText || '');
          parsed.preserveTypes(doc);
          doc.apply(parsed);
          setValidationError(null);
          setMode('Tree');
        } catch (error) {
          setValidationError(error as Error);
        }
      } else {
        // Tree -> JSON: regenerate the JSON text from the current document
        // state so structured edits carry across.
        setJsonText(doc.toEJSON());
        setValidationError(null);
        setMode('JSON');
      }
    },
    [doc, mode, jsonText]
  );

  const onUpdateJson = useCallback(() => {
    if (!doc) {
      return;
    }
    try {
      const newDoc = HadronDocument.FromEJSON(jsonText || '');
      // Preserve the original document's type information so field types are
      // not unintentionally changed by round-tripping through text.
      newDoc.preserveTypes(doc);
      doc.apply(newDoc);
      void replaceDocument(doc);
    } catch (error) {
      setValidationError(error as Error);
    }
  }, [doc, jsonText, replaceDocument]);

  const onUpdateTree = useCallback(
    (force: boolean) => {
      if (!doc) {
        return;
      }
      if (force) {
        void replaceDocument(doc);
      } else {
        void updateDocument(doc);
      }
    },
    [doc, replaceDocument, updateDocument]
  );

  // The combined format-and-toggle button (rendered next to Copy in the
  // editor's overlay action bar via customActions). Every press prettifies
  // and flips fold state. Icon + label follow the editor's built-in
  // expand/collapse convention (Caret glyphs, "Expand all"/"Collapse all").
  const editorCustomActions = useMemo<Action[]>(
    () => [
      {
        icon: isExpanded ? 'CaretDown' : 'CaretRight',
        label: isExpanded ? 'Collapse all' : 'Expand all',
        action: () => {
          const editor = editorRef.current;
          if (!editor) {
            return false;
          }
          editor.prettify();
          if (isExpanded) {
            editor.foldAll();
          } else {
            editor.unfoldAll();
          }
          setIsExpanded((value) => !value);
          return true;
        },
      },
    ],
    [isExpanded]
  );

  const handleCancel = useCallback(() => {
    closeUpdateDocumentModal();
  }, [closeUpdateDocumentModal]);

  const onSetOpen = useCallback(
    (open: boolean) => {
      // Closing the modal by any means must end the editing session.
      if (!open) {
        closeUpdateDocumentModal();
      }
    },
    [closeUpdateDocumentModal]
  );

  // Close the modal once a save succeeds. On save error the modal stays open
  // and the footer surfaces the error so the user can correct and retry.
  React.useEffect(() => {
    if (!doc) {
      return;
    }
    const onUpdateSuccess = () => {
      closeUpdateDocumentModal();
    };
    doc.on(HadronDocument.Events.UpdateSuccess, onUpdateSuccess);
    return () => {
      doc.removeListener(HadronDocument.Events.UpdateSuccess, onUpdateSuccess);
    };
  }, [doc, closeUpdateDocumentModal]);

  // Ctrl/Cmd+F focuses the find bar, but only while the modal is open in
  // JSON mode (find is intentionally scoped to JSON mode).
  React.useEffect(() => {
    if (!isOpen || mode !== 'JSON') {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        (event.key === 'f' || event.key === 'F')
      ) {
        event.preventDefault();
        findRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => {
      document.removeEventListener('keydown', handler, true);
    };
  }, [isOpen, mode]);

  return (
    <Modal
      open={isOpen}
      setOpen={onSetOpen}
      fullScreen={isFullScreen}
      className={modalContentStyles}
      data-testid="update-document-modal"
      aria-labelledby="update-document-title"
    >
      <ModalBody className={modalBodyStyles}>
        {doc && (
          <div className={bodyStyles}>
            <div
              className={cx(stickyHeaderStyles, darkMode && stickyDarkStyles)}
            >
              <div className={toolbarStyles}>
                {/* Title hides when Find is expanded in small mode so the
                    Find input has the whole row to itself. */}
                {!(isSmallFindOpen && !isFullScreen) && (
                  <div className={titleGroupStyles}>
                    <h1 id="update-document-title" className={titleStyles}>
                      Update Document
                    </h1>
                    <span
                      className={cx(
                        subtitleStyles,
                        darkMode ? subtitleDarkStyles : subtitleLightStyles
                      )}
                    >
                      {namespace}
                    </span>
                  </div>
                )}

                <div className={findGroupStyles}>
                  {mode === 'JSON' && (isFullScreen || isSmallFindOpen) && (
                    <UpdateDocumentFind
                      key={`find-${renderKey}`}
                      ref={findRef}
                      editorRef={editorRef}
                    />
                  )}
                </div>

                <div className={controlsGroupStyles}>
                  {/* JSON/Tree toggle is full-screen only — small mode hides
                      it to free room for the Find icon. */}
                  {isFullScreen && (
                    <SegmentedControl
                      name="update-document-editor-mode"
                      size="small"
                      value={mode}
                      onChange={onModeChange}
                      data-testid="update-document-mode"
                    >
                      {/* Icon-only: LG auto-detects when `glyph` is set and
                          children are omitted. `title` adds a hover tooltip,
                          `aria-label` keeps screen-reader names. */}
                      <SegmentedControlOption
                        value="JSON"
                        aria-label="JSON editor"
                        title="JSON editor"
                        data-testid="update-document-mode-json"
                        glyph={<Icon glyph="CurlyBraces" />}
                      />
                      <SegmentedControlOption
                        value="Tree"
                        aria-label="Tree editor"
                        title="Tree editor"
                        data-testid="update-document-mode-tree"
                        glyph={<Icon glyph="Menu" />}
                      />
                    </SegmentedControl>
                  )}
                  {/* Small mode + JSON: a magnifier IconButton toggles the
                      collapsed Find input. Becomes an X (close) once open so
                      the same button collapses it again. */}
                  {!isFullScreen && mode === 'JSON' && (
                    <IconButton
                      aria-label={
                        isSmallFindOpen ? 'Close find' : 'Find in document'
                      }
                      title={
                        isSmallFindOpen ? 'Close find' : 'Find in document'
                      }
                      onClick={() => setIsSmallFindOpen((v) => !v)}
                      data-testid="update-document-find-toggle"
                    >
                      <Icon glyph={isSmallFindOpen ? 'X' : 'MagnifyingGlass'} />
                    </IconButton>
                  )}
                  <IconButton
                    aria-label={
                      isFullScreen ? 'Exit full screen' : 'Enter full screen'
                    }
                    onClick={() => setIsFullScreen((value) => !value)}
                    data-testid="update-document-fullscreen-toggle"
                  >
                    <Icon
                      glyph={
                        isFullScreen ? 'FullScreenExit' : 'FullScreenEnter'
                      }
                    />
                  </IconButton>
                </div>
              </div>
            </div>

            <KeylineCard
              className={cx(
                editorCardStyles,
                darkMode ? editorCardDarkStyles : editorCardLightStyles
              )}
              data-testid="update-document-editor-container"
            >
              {mode === 'JSON' ? (
                <CodemirrorMultilineEditor
                  key={`json-${renderKey}`}
                  ref={editorRef}
                  id={editorId}
                  data-testid="update-document-json-editor"
                  language="json"
                  text={jsonText}
                  onChangeText={onChangeJson}
                  copyable
                  customActions={editorCustomActions}
                  showLineNumbers
                  minLines={10}
                  completer={completer}
                  initialJSONFoldAll={initiallyFolded}
                />
              ) : (
                <div
                  className={treeEditorStyles}
                  data-testid="update-document-tree-editor"
                >
                  <DocumentList.Document value={doc} editable editing />
                </div>
              )}
            </KeylineCard>

            <div
              className={cx(stickyFooterStyles, darkMode && stickyDarkStyles)}
            >
              <DocumentList.DocumentEditActionsFooter
                doc={doc}
                editing
                deleting={false}
                alwaysForceUpdate={mode === 'JSON'}
                primaryActionLabel="Update"
                modified={
                  mode === 'JSON' ? jsonText !== initialJson : undefined
                }
                validationError={mode === 'JSON' ? validationError : null}
                onUpdate={(force: boolean) => {
                  if (mode === 'JSON') {
                    onUpdateJson();
                  } else {
                    onUpdateTree(force);
                  }
                }}
                onDelete={noop}
                onCancel={handleCancel}
              />
            </div>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
};

export default UpdateDocumentModal;
