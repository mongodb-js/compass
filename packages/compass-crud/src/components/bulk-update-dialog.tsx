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
  useId,
} from '@mongodb-js/compass-components';
import type { Annotation } from '@mongodb-js/compass-editor';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';

import Document from './document';
import type { BSONObject } from '../stores/crud-store';

import { ReadonlyFilter } from './readonly-filter';
import { DocumentIcon } from '@mongodb-js/compass-components';

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

const codeDarkContainerStyles = css({});

const codeLightContainerStyles = css({
  backgroundColor: palette.gray.light3,
});

const multilineContainerStyles = css({
  maxHeight: spacing[4] * 20,
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

const inlineSaveQueryModalContainedElements = ['#inline-save-query-modal *'];

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
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      const favoriteName: string = ev.target.value || '';

      setFavoriteName(favoriteName);
      setValid(favoriteName !== '');
    },
    [setFavoriteName, setValid]
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
      trigger={({ onClick, children }) => {
        return (
          <Button
            variant="default"
            onClick={onClick}
            data-testid="inline-save-query-modal-opener"
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
      hideCloseButton={true}
      customFocusTrapFallback={'#inline-save-query-modal-cancel-button'}
      open={open}
      setOpen={setOpen}
    >
      <div id="inline-save-query-modal" className={inlineSaveQueryModalStyles}>
        <TextInput
          id="inline-save-query-modal-input"
          data-testid="inline-save-query-modal-input"
          className={inlineSaveQueryModalInputStyles}
          aria-label="Saved query name"
          value={favoriteName}
          onChange={updateFavoriteName}
          onKeyUp={handleSpecialKeyboardEvents}
        />
        <Button
          data-testid="inline-save-query-modal-submit"
          variant="primary"
          disabled={!valid}
          onClick={onClickSave}
        >
          Save
        </Button>
        <Button
          id="inline-save-query-modal-cancel-button"
          variant="default"
          onClick={cleanClose}
        >
          Cancel
        </Button>
      </div>
    </InteractivePopover>
  );
};

const previewZeroStateIconStyles = css({
  margin: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
  alignItems: 'center',
});

const previewNoResultsLabel = css({
  color: palette.green.dark2,
});

const previewZeroStateDescriptionStyles = css({
  textAlign: 'center',
  margin: 0,
});

export type BulkUpdatePreviewProps = {
  count?: number;
  preview: UpdatePreview;
};

const BulkUpdatePreview: React.FunctionComponent<BulkUpdatePreviewProps> = ({
  count,
  preview,
}) => {
  const previewDocuments = useMemo(() => {
    return preview.changes.map(
      (change) => new HadronDocument(change.after as Record<string, unknown>)
    );
  }, [preview]);

  // show a preview for the edge case where the count is undefined, not the
  // empty state
  if (count === 0) {
    return (
      <div
        className={updatePreviewStyles}
        data-testid="bulk-update-preview-empty-state"
      >
        <Label htmlFor="bulk-update-preview">
          Preview{' '}
          <Description className={previewDescriptionStyles}>
            (sample of {preview.changes.length} document
            {preview.changes.length === 1 ? '' : 's'})
          </Description>
        </Label>
        <div className={previewZeroStateIconStyles}>
          <DocumentIcon />
          <b className={previewNoResultsLabel}>No results</b>
          <p className={previewZeroStateDescriptionStyles}>
            Try modifying your query to get results.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={previewStyles}>
      <Label htmlFor="bulk-update-preview">
        Preview{' '}
        <Description className={previewDescriptionStyles}>
          (sample of {preview.changes.length} document
          {preview.changes.length === 1 ? '' : 's'})
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
  enablePreview?: boolean;
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
  enablePreview = false,
  closeBulkUpdateDialog,
  updateBulkUpdatePreview,
  runBulkUpdate,
  saveUpdateQuery,
}: BulkUpdateDialogProps) {
  const darkMode = useDarkMode();

  const [text, setText] = useState(updateText);
  const wasOpen = usePrevious(isOpen);

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

  const modalTitleAndButtonText = useMemo(() => {
    if (typeof count !== 'number') {
      return 'Update documents';
    }

    if (count === 1) {
      return `Update 1 document`;
    }

    return `Update ${count} documents`;
  }, [count]);

  const bulkUpdateUpdateId = useId();
  return (
    <Modal
      open={isOpen}
      setOpen={closeBulkUpdateDialog}
      size={enablePreview ? 'large' : 'default'}
      data-testid="bulk-update-dialog"
      initialFocus={`#${bulkUpdateUpdateId} .cm-content`}
    >
      <ModalHeader title={modalTitleAndButtonText} subtitle={ns} />
      <ModalBody>
        <div className={enablePreview ? columnsStyles : undefined}>
          <div className={queryStyles}>
            <div className={queryFieldStyles}>
              <ReadonlyFilter
                queryLabel="Filter"
                filterQuery={toJSString(filter) ?? ''}
              />
            </div>

            <div className={cx(queryFieldStyles, updateFieldStyles)}>
              <Label htmlFor={bulkUpdateUpdateId}>Update</Label>
              <Description className={descriptionStyles}>
                <Link
                  tabIndex={0}
                  href="https://www.mongodb.com/docs/manual/reference/method/db.collection.updateMany/#std-label-update-many-update"
                >
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
                  id={bulkUpdateUpdateId}
                  data-testid="bulk-update-update"
                  onBlur={() => ({})}
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
          {enablePreview && (
            <BulkUpdatePreview count={count} preview={preview} />
          )}
        </div>
      </ModalBody>
      <ModalFooter className={modalFooterToolbarSpacingStyles}>
        <div className={modalFooterAdditionalActionsStyles}>
          <InlineSaveQueryModal onSave={saveUpdateQuery} />
        </div>
        <div className={modalFooterFormActionsStyles}>
          <Button
            variant="default"
            onClick={closeBulkUpdateDialog}
            data-testid="cancel-button"
          >
            Cancel
          </Button>
          <Button
            disabled={!!(syntaxError || serverError)}
            variant="primary"
            onClick={runBulkUpdate}
            data-testid="update-button"
          >
            {modalTitleAndButtonText}
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
