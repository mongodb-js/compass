import React, { useCallback, useState } from 'react';

import { EJSON } from 'bson';
import { parseFilter } from 'mongodb-query-parser';

import {
  FormModal,
  css,
  spacing,
  palette,
  Label,
  Banner,
  BannerVariant,
  KeylineCard,
} from '@mongodb-js/compass-components';

import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';

import type { BSONObject, UpdatePreview } from '../stores/crud-store';

const columnsStyles = css({
  marginTop: spacing[4],
  display: 'flex',
  gap: spacing[3],
  alignItems: 'flex-start',
  width: '100%',
  '> *': {
    flex: 1,
  },
});

const queryStyles = css({
  display: 'flex',
  gap: spacing[3],
  flexDirection: 'column',
});

const queryFieldStyles = css({});

const previewStyles = css({});

const codeEditorContainerStyles = css({
  backgroundColor: palette.gray.light3,
  paddingTop: spacing[3],
  paddingBottom: spacing[2],
});

const codeEditorStyles = css({});

const errorContainerStyles = css({
  marginTop: spacing[3],
});

function formatQuery(filter: BSONObject) {
  return EJSON.stringify(filter, undefined, 2);
}

export type BulkUpdateDialogProps = {
  isOpen: boolean;
  ns: string;
  filter: BSONObject;
  count: undefined | number;
  update: BSONObject;
  previews: UpdatePreview[];
  error: null | Error;
  closeBulkUpdateDialog: () => void;
  updateBulkUpdatePreview: (update: BSONObject) => void;
};

export default function BulkUpdateDialog({
  isOpen,
  ns,
  filter,
  count,
  update,
  previews,
  error: serverError,
  closeBulkUpdateDialog,
}: BulkUpdateDialogProps) {
  const title =
    count === undefined
      ? 'Update documents'
      : `Update ${count} ${count === 1 ? 'document' : 'documents'}`;
  const preview = previews[0];

  const [syntaxError, setSyntaxError] = useState<Error | null>(null);

  const changeUpdateText = useCallback(
    (text: string) => {
      try {
        parseFilter(text);
      } catch (error) {
        setSyntaxError(error as Error);
        return;
      }

      setSyntaxError(null);
    },
    [setSyntaxError]
  );

  return (
    <FormModal
      title={title}
      subtitle={ns}
      size="large"
      open={isOpen}
      onSubmit={() => ({})}
      onCancel={closeBulkUpdateDialog}
      submitButtonText="Update documents"
      submitDisabled={!!(syntaxError || serverError)}
    >
      <div className={columnsStyles}>
        <div className={queryStyles}>
          <div className={queryFieldStyles}>
            <Label htmlFor="bulk-update-filter">Filter</Label>
            <KeylineCard className={codeEditorContainerStyles}>
              <CodemirrorMultilineEditor
                text={formatQuery(filter)}
                id="bulk-update-filter"
                data-testid="bulk-update-filter"
                minLines={8}
                className={codeEditorStyles}
                showLineNumbers={false}
                showFoldGutter={false}
                readOnly={true}
              />
            </KeylineCard>
          </div>

          <div className={queryFieldStyles}>
            <Label htmlFor="bulk-update-update">Update</Label>
            <KeylineCard className={codeEditorContainerStyles}>
              <CodemirrorMultilineEditor
                text={formatQuery(update)}
                onChangeText={changeUpdateText}
                id="bulk-update-update"
                data-testid="bulk-update-update"
                minLines={16}
                onBlur={() => ({})}
                className={codeEditorStyles}
                showLineNumbers={false}
                showFoldGutter={false}
              />
            </KeylineCard>
          </div>
        </div>
        <div className={previewStyles}>
          <Label htmlFor="bulk-update-preview">Preview</Label>
          <UpdatePreviewDocument id="bulk-update-preview" preview={preview} />
        </div>
      </div>

      {syntaxError && (
        <div className={errorContainerStyles}>
          <Banner variant={BannerVariant.Warning}>{syntaxError.message}</Banner>
        </div>
      )}
      {serverError && !syntaxError && (
        <div className={errorContainerStyles}>
          <Banner variant={BannerVariant.Danger}>{serverError.message}</Banner>
        </div>
      )}
    </FormModal>
  );
}

const updatePreviewStyles = css({});

function UpdatePreviewDocument({
  id,
}: {
  id: string;
  preview?: UpdatePreview;
}) {
  /*
  if (!preview) {
    return (
      <p>No documents match the filter.</p>
    );
  }
  */
  return (
    <div id={id} className={updatePreviewStyles}>
      <p>diff goes here</p>
    </div>
  );
}
