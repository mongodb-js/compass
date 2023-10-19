import React, { useMemo, useState } from 'react';

import { EJSON } from 'bson';

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
import {
  CodemirrorInlineEditor,
  CodemirrorMultilineEditor,
} from '@mongodb-js/compass-editor';

import type { BSONObject } from '../stores/crud-store';
import type { UpdatePreview, UpdatePreviewChange } from 'mongodb-data-service';

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

const previewStyles = css({});

const previewDescriptionStyles = css({
  display: 'inline',
});

const codeEditorContainerStyles = css({
  paddingTop: spacing[2],
  paddingBottom: spacing[2],
});

const codeEditorDarkContainerStyles = css({
  background: palette.gray.dark4,
});

const codeEditorLightContainerStyles = css({
  backgroundColor: palette.gray.light3,
});

const inlineContainerStyles = css({
  paddingLeft: spacing[2],
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

// TODO: this is a temporary hack
const updatePreviewStyles = css({
  overflow: 'scroll',
  maxHeight: '500px',
});

function formatQuery(filter: BSONObject) {
  return EJSON.stringify(filter, undefined, 2);
}

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
}: BulkUpdateDialogProps) {
  const darkMode = useDarkMode();

  const [text, setText] = useState(updateText);

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
      onSubmit={() => ({})}
      onCancel={closeBulkUpdateDialog}
      cancelButtonText="Close"
      submitButtonText="Update documents"
      submitDisabled={!!(syntaxError || serverError)}
    >
      <div className={columnsStyles}>
        <div className={queryStyles}>
          <div className={queryFieldStyles}>
            <div className={filterLabelContainerStyles}>
              <Label htmlFor="bulk-update-filter">Filter Query</Label>
              <InfoSprinkle>
                Return to the Documents tab to edit this query
              </InfoSprinkle>
            </div>
            <KeylineCard
              className={cx(
                codeEditorContainerStyles,
                inlineContainerStyles,
                darkMode
                  ? codeEditorDarkContainerStyles
                  : codeEditorLightContainerStyles
              )}
            >
              <CodemirrorInlineEditor
                text={formatQuery(filter)}
                id="bulk-update-filter"
                data-testid="bulk-update-filter"
                className={codeEditorStyles}
                readOnly={true}
              />
            </KeylineCard>
          </div>

          <div className={cx(queryFieldStyles, updateFieldStyles)}>
            <Label htmlFor="bulk-update-update">Update Query</Label>
            <Description className={descriptionStyles}>
              <Link href="https://www.mongodb.com/docs/manual/reference/method/db.collection.updateMany/#std-label-update-many-update">
                Learn more about Update syntax
              </Link>
            </Description>
            <KeylineCard
              className={cx(
                codeEditorContainerStyles,
                darkMode
                  ? codeEditorDarkContainerStyles
                  : codeEditorLightContainerStyles
              )}
            >
              <CodemirrorMultilineEditor
                text={text}
                onChangeText={onChangeText}
                id="bulk-update-update"
                data-testid="bulk-update-update"
                minLines={16}
                onBlur={() => ({})}
                className={codeEditorStyles}
                annotations={annotations}
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
            {preview.changes.map(
              (change: UpdatePreviewChange, index: number) => {
                return (
                  <UpdatePreviewDocument
                    key={`change=${index as number}`}
                    data-testid="bulk-update-preview-document"
                    change={change}
                  />
                );
              }
            )}
          </div>
        </div>
      </div>
    </FormModal>
  );
}

function UpdatePreviewDocument({
  change,
  ...props
}: {
  'data-testid': string;
  change: UpdatePreviewChange;
}) {
  const text = EJSON.stringify(change.after, undefined, 2, { relaxed: false });
  return (
    <div data-testid={props['data-testid']}>
      <pre>{text}</pre>
    </div>
  );
}
