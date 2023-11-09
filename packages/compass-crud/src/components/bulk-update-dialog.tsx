import React, { useMemo, useState, useEffect, useCallback } from 'react';
import type { UpdatePreview } from 'mongodb-data-service';
import HadronDocument from 'hadron-document';
import { toJSString } from 'mongodb-query-parser';
import {
  css,
  cx,
  spacing,
  palette,
  Label,
  Banner,
  BannerVariant,
  KeylineCard,
  Description,
  Link,
  useDarkMode,
  usePrevious,
  Modal,
  ModalFooter,
  Button,
  ModalHeader,
  ModalBody,
  Icon,
  InteractivePopover,
  TextInput,
} from '@mongodb-js/compass-components';
import type { Annotation } from '@mongodb-js/compass-editor';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';

import Document from './document';
import type { BSONObject } from '../stores/crud-store';

import { ReadonlyFilter } from './readonly-filter';

const columnsStyles = css({
  marginTop: spacing[4],
  display: 'grid',
  width: '100%',
  gap: spacing[4],
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
});

const queryStyles = css({
  display: 'flex',
  gap: spacing[4],
  flexDirection: 'column',
});

const queryFieldStyles = css({});

const updateFieldStyles = css({
  flex: 1,
});

const descriptionStyles = css({
  marginBottom: spacing[2],
});

const previewStyles = css({
  contain: 'size',
  overflow: 'scroll',
});

const previewDescriptionStyles = css({
  display: 'inline',
});

const codeContainerStyles = css({
  paddingTop: spacing[2],
  paddingBottom: spacing[2],
});

const codeDarkContainerStyles = css({
  background: palette.gray.dark4,
});

const codeLightContainerStyles = css({
  backgroundColor: palette.gray.light3,
});

const multilineContainerStyles = css({
  maxHeight: spacing[4] * 20,
});

// We use custom color here so need to disable default one that we use
// everywhere else
const codeEditorStyles = css({
  background: 'transparent !important',
  '& .cm-gutters': {
    background: 'transparent !important',
  },
  '& .cm-editor': {
    background: 'transparent !important',
  },
});

const bannerContainerStyles = css({
  // don't jump when an error appears
  minHeight: spacing[4] * 2 + 2,
  overflow: 'hidden',
});

const bannerStyles = css({
  flex: 'none',
  marginTop: spacing[2],
  marginLeft: spacing[2],
  marginRight: spacing[2],
  textAlign: 'left',
});

const updatePreviewStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[3],
});

const modalFooterToolbarSpacingStyles = css({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
});

const modalFooterFormActionsStyles = css({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[2],
});

const modalFooterAdditionalActionsStyles = css({});

const inlineSaveQueryModalStyles = css({
  display: 'flex',
  flexDirection: 'row',
  padding: spacing[3],
  gap: spacing[3],
});

const inlineSaveQueryModalInputStyles = css({
  width: '315px',
});

type InlineSaveQueryModalProps = {
  onSave: (name: string) => void;
};

const inlineSaveQueryModalContainedElements = [
  '#inline-save-query-modal',
  '#inline-save-query-modal-input',
];

const InlineSaveQueryModal: React.FunctionComponent<
  InlineSaveQueryModalProps
> = ({ onSave }) => {
  const [open, setOpen] = useState(false);
  const [favoriteName, setFavoriteName] = useState('');
  const [valid, setValid] = useState(false);

  const cleanClose = useCallback(() => {
    setOpen(false);
    setFavoriteName('');
  }, [setOpen, setFavoriteName]);

  const onClickSave = useCallback(() => {
    onSave(favoriteName);
    cleanClose();
  }, [onSave, favoriteName, cleanClose]);

  const updateFavoriteName = useCallback(
    (ev: React.ChangeEvent) => {
      const target = ev.target as any as { value: string };
      const favoriteName: string = (target.value || '').trim();

      setFavoriteName(favoriteName);
      setValid(favoriteName !== '');
    },
    [setFavoriteName]
  );

  const handleSpecialKeyboardEvents = useCallback(
    (ev: React.KeyboardEvent) => {
      if (ev.key === 'Enter') {
        onSave(favoriteName);
        cleanClose();
      } else if (ev.key === 'Escape') {
        cleanClose();
      }
    },
    [favoriteName, onSave, cleanClose]
  );

  return (
    <InteractivePopover
      containedElements={inlineSaveQueryModalContainedElements}
      // To prevent popover from closing when confirmation modal is shown
      trigger={({ onClick, children }) => {
        return (
          <Button
            variant="default"
            onClick={onClick}
            aria-haspopup="true"
            aria-expanded={open ? true : undefined}
          >
            <Icon glyph="Favorite" />
            Save
            {children}
          </Button>
        );
      }}
      align="top"
      hasCustomCloseButton={true}
      open={open}
      setOpen={setOpen}
    >
      <div id="inline-save-query-modal" className={inlineSaveQueryModalStyles}>
        <TextInput
          id="inline-save-query-modal-input"
          className={inlineSaveQueryModalInputStyles}
          aria-label="Saved query name"
          value={favoriteName}
          onChange={updateFavoriteName}
          onKeyUp={handleSpecialKeyboardEvents}
        />
        <Button variant="primary" disabled={!valid} onClick={onClickSave}>
          Save
        </Button>
        <Button variant="default" onClick={cleanClose}>
          Cancel
        </Button>
      </div>
    </InteractivePopover>
  );
};

export type BulkUpdateDialogProps = {
  isOpen: boolean;
  ns: string;
  filter: BSONObject;
  count?: number;
  updateText: string;
  preview: UpdatePreview;
  syntaxError?: Error & { loc?: { index: number } };
  serverError?: Error;
  closeBulkUpdateDialog: () => void;
  updateBulkUpdatePreview: (updateText: string) => void;
  runBulkUpdate: () => void;
  saveUpdateQuery: (name: string) => void;
};

export default function BulkUpdateDialog({
  isOpen,
  ns,
  filter,
  count,
  updateText,
  preview,
  syntaxError,
  serverError,
  closeBulkUpdateDialog,
  updateBulkUpdatePreview,
  runBulkUpdate,
  saveUpdateQuery,
}: BulkUpdateDialogProps) {
  const darkMode = useDarkMode();

  const [text, setText] = useState(updateText);
  const wasOpen = usePrevious(isOpen);

  const previewDocuments = useMemo(() => {
    return preview.changes.map(
      (change) => new HadronDocument(change.after as Record<string, unknown>)
    );
  }, [preview]);

  const onChangeText = (value: string) => {
    setText(value);
    updateBulkUpdatePreview(value);
  };

  const annotations = useMemo<Annotation[]>(() => {
    if (syntaxError?.loc?.index) {
      return [
        {
          message: syntaxError.message,
          severity: 'error',
          from: syntaxError.loc.index,
          to: syntaxError.loc.index,
        },
      ];
    }

    return [];
  }, [syntaxError]);

  // This hack in addition to keeping the text state locally exists due to
  // reflux (unlike redux) being async. We can remove it once we move
  // compass-crud to redux.
  useEffect(() => {
    if (isOpen && !wasOpen) {
      setText(updateText);
    }
  }, [isOpen, wasOpen, updateText]);

  return (
    <Modal open={isOpen} setOpen={closeBulkUpdateDialog} size="large">
      <ModalHeader title={`Update ${count || 0} documents`} subtitle={ns} />
      <ModalBody>
        <div className={columnsStyles}>
          <div className={queryStyles}>
            <div className={queryFieldStyles}>
              <ReadonlyFilter
                queryLabel="Filter"
                filterQuery={toJSString(filter) ?? ''}
              />
            </div>

            <div className={cx(queryFieldStyles, updateFieldStyles)}>
              <Label htmlFor="bulk-update-update">Update</Label>
              <Description className={descriptionStyles}>
                <Link href="https://www.mongodb.com/docs/manual/reference/method/db.collection.updateMany/#std-label-update-many-update">
                  Learn more about Update syntax
                </Link>
              </Description>
              <KeylineCard
                className={cx(
                  codeContainerStyles,
                  multilineContainerStyles,
                  darkMode ? codeDarkContainerStyles : codeLightContainerStyles
                )}
              >
                <CodemirrorMultilineEditor
                  text={text}
                  onChangeText={onChangeText}
                  id="bulk-update-update"
                  data-testid="bulk-update-update"
                  onBlur={() => ({})}
                  className={codeEditorStyles}
                  annotations={annotations}
                />

                <div className={bannerContainerStyles}>
                  {syntaxError && (
                    <Banner
                      variant={BannerVariant.Warning}
                      className={bannerStyles}
                    >
                      {syntaxError.message}
                    </Banner>
                  )}
                  {serverError && !syntaxError && (
                    <Banner
                      variant={BannerVariant.Danger}
                      className={bannerStyles}
                    >
                      {serverError.message}
                    </Banner>
                  )}
                </div>
              </KeylineCard>
            </div>
          </div>
          <div className={previewStyles}>
            <Label htmlFor="bulk-update-preview">
              Preview{' '}
              <Description className={previewDescriptionStyles}>
                (sample of {preview.changes.length} document
                {preview.changes.length !== 1 && 's'})
              </Description>
            </Label>
            <div className={updatePreviewStyles}>
              {previewDocuments.map((doc: HadronDocument, index: number) => {
                return (
                  <UpdatePreviewDocument
                    key={`change=${index}`}
                    data-testid="bulk-update-preview-document"
                    doc={doc}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter className={modalFooterToolbarSpacingStyles}>
        <div className={modalFooterAdditionalActionsStyles}>
          <InlineSaveQueryModal onSave={saveUpdateQuery} />
        </div>
        <div className={modalFooterFormActionsStyles}>
          <Button variant="default" onClick={closeBulkUpdateDialog}>
            Cancel
          </Button>
          <Button
            disabled={!!(syntaxError || serverError)}
            variant="primary"
            onClick={runBulkUpdate}
          >
            Update {count} documents
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}

function UpdatePreviewDocument({
  doc,
  ...props
}: {
  'data-testid': string;
  doc: HadronDocument;
}) {
  return (
    <KeylineCard data-testid={props['data-testid']}>
      <Document doc={doc} editable={false} />
    </KeylineCard>
  );
}
