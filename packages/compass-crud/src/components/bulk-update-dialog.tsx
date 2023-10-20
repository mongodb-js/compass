import React, { useMemo, useState } from 'react';
import Document from './document';
import HadronDocument from 'hadron-document';

import { toJSString } from 'mongodb-query-parser';

import {
  FormModal,
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
  InfoSprinkle,
  useDarkMode,
} from '@mongodb-js/compass-components';

import type { Annotation } from '@mongodb-js/compass-editor';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';

import type { BSONObject } from '../stores/crud-store';
import type { UpdatePreview } from 'mongodb-data-service';

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

const filterLabelContainerStyles = css({
  display: 'flex',
  gap: spacing[1],
  alignItems: 'center',
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

const inlineContainerStyles = css({
  paddingLeft: spacing[2],
  pre: {
    margin: 0,
  },
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
}: BulkUpdateDialogProps) {
  const darkMode = useDarkMode();

  const [text, setText] = useState(updateText);

  const previewDocuments = useMemo(() => {
    return preview.changes.map(
      (change) => new HadronDocument(change.after as Record<string, unknown>)
    );
  }, [preview]);

  const onChangeText = (value: string) => {
    setText(value);
    updateBulkUpdatePreview(value);
  };

  const title =
    count === undefined ? 'Update documents' : `Update documents (${count})`;

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

  return (
    <FormModal
      title={title}
      subtitle={ns}
      size="large"
      open={isOpen}
      onSubmit={runBulkUpdate}
      onCancel={closeBulkUpdateDialog}
      cancelButtonText="Close"
      submitButtonText="Update documents"
      submitDisabled={!!(syntaxError || serverError)}
    >
      <div className={columnsStyles}>
        <div className={queryStyles}>
          <div className={queryFieldStyles}>
            <div className={filterLabelContainerStyles}>
              <Label htmlFor="bulk-update-filter">Filter</Label>
              <InfoSprinkle>
                Return to the Documents tab to edit this query
              </InfoSprinkle>
            </div>
            <KeylineCard
              className={cx(
                codeContainerStyles,
                inlineContainerStyles,
                darkMode ? codeDarkContainerStyles : codeLightContainerStyles
              )}
            >
              <pre>{toJSString(filter)}</pre>
            </KeylineCard>
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
                maxLines={20}
              />
              {syntaxError && (
                <Banner
                  variant={BannerVariant.Warning}
                  className={bannerStyles}
                >
                  {syntaxError.message}
                </Banner>
              )}
              {serverError && !syntaxError && (
                <Banner variant={BannerVariant.Danger} className={bannerStyles}>
                  {serverError.message}
                </Banner>
              )}
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
    </FormModal>
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
