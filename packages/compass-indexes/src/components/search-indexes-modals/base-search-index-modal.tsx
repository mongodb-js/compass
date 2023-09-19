import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  ModalFooter,
  ModalHeader,
  ModalBody,
  TextInput,
  Label,
  spacing,
  css,
  HorizontalRule,
  Subtitle,
  Button,
  Link,
  Icon,
  WarningSummary,
  ErrorSummary,
  Body,
  Banner,
} from '@mongodb-js/compass-components';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';
import _parseShellBSON, { ParseMode } from 'ejson-shell-parser';
import type { Document } from 'mongodb';
import { useTrackOnChange } from '@mongodb-js/compass-logging';

// Copied from packages/compass-aggregations/src/modules/pipeline-builder/pipeline-parser/utils.ts
function parseShellBSON(source: string): Document[] {
  const parsed = _parseShellBSON(source, { mode: ParseMode.Loose });
  if (!parsed || typeof parsed !== 'object') {
    // XXX(COMPASS-5689): We've hit the condition in
    // https://github.com/mongodb-js/ejson-shell-parser/blob/c9c0145ababae52536ccd2244ac2ad01a4bbdef3/src/index.ts#L36
    throw new Error('The provided index definition is invalid.');
  }
  return parsed;
}

const bodyStyles = css({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  gap: spacing[3],
});

const formContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[3],
  overflow: 'auto',
  padding: spacing[1],
});

const footerStyles = css({
  display: 'flex',
  gap: spacing[2],
});

type BaseSearchIndexModalProps = {
  mode: 'create' | 'update';
  initialIndexName: string;
  initialIndexDefinition: string;
  isModalOpen: boolean;
  isBusy: boolean;
  error: string | undefined;
  onSubmit: (indexName: string, indexDefinition: Document) => void;
  onClose: () => void;
};

export const BaseSearchIndexModal: React.FunctionComponent<
  BaseSearchIndexModalProps
> = ({
  mode,
  initialIndexName,
  initialIndexDefinition,
  isModalOpen,
  isBusy,
  error,
  onSubmit,
  onClose,
}) => {
  const [indexName, setIndexName] = useState(initialIndexName);
  const [indexDefinition, setIndexDefinition] = useState(
    initialIndexDefinition
  );
  const [parsingError, setParsingError] = useState<string | undefined>(
    undefined
  );

  useTrackOnChange(
    'COMPASS-SEARCH-INDEXES-UI',
    (track) => {
      if (isModalOpen) {
        track('Screen', { name: `${mode}_search_index_modal` });
        if (mode === 'create') {
          track('Index Create Opened', {
            atlas_search: true,
          });
        }
      }
    },
    [isModalOpen, mode],
    undefined,
    React
  );

  useEffect(() => {
    // Reset the name and definition when modal is closed.
    if (!isModalOpen) {
      setIndexName(initialIndexName);
      setIndexDefinition(initialIndexDefinition);
      setParsingError(undefined);
    }
  }, [isModalOpen]);

  useEffect(() => {
    setIndexName(initialIndexName);
    setIndexDefinition(initialIndexDefinition);
  }, [initialIndexName, initialIndexDefinition]);

  const onSearchIndexDefinitionChanged = useCallback(
    (newDefinition: string) => {
      setParsingError(undefined);

      try {
        parseShellBSON(newDefinition);
        setIndexDefinition(newDefinition);
      } catch (ex) {
        setParsingError((ex as Error).message);
      }
    },
    [setIndexDefinition, setParsingError]
  );

  const onSubmitIndex = useCallback(() => {
    if (parsingError) {
      setParsingError('The index definition is invalid.');
      return;
    }

    const indexDefinitionDoc = parseShellBSON(indexDefinition);
    onSubmit(indexName, indexDefinitionDoc);
  }, [onSubmit, parsingError, indexName, indexDefinition]);

  return (
    <Modal
      open={isModalOpen}
      setOpen={onClose}
      data-testid="search-index-modal"
    >
      <ModalHeader
        title={
          mode === 'create' ? 'Create Search Index' : 'Update Search Index'
        }
      />
      <ModalBody className={bodyStyles}>
        <div className={formContainerStyles}>
          <section>
            <Label htmlFor="name-of-search-index">Name of Search Index</Label>
            <TextInput
              id="name-of-search-index"
              data-testid="name-of-search-index"
              aria-labelledby="Name of Search Index"
              type="text"
              state={indexName === '' ? 'error' : 'none'}
              errorMessage={
                indexName === '' ? 'Please enter the name of the index.' : ''
              }
              disabled={mode === 'update'}
              value={indexName}
              onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
                setIndexName(evt.target.value)
              }
            />
          </section>
          <HorizontalRule />
          <section>
            <Subtitle>Index Definition</Subtitle>
            {mode === 'create' && (
              <Body>
                By default, search indexes will have the following search
                configurations. You can refine this later.
              </Body>
            )}
            <Link
              href="https://www.mongodb.com/docs/atlas/atlas-search/tutorial/"
              target="_blank"
              hideExternalIcon={true}
            >
              View Atlas Search tutorials{' '}
              <Icon size="small" glyph="OpenNewTab"></Icon>
            </Link>
            <CodemirrorMultilineEditor
              data-testid="definition-of-search-index"
              text={indexDefinition}
              onChangeText={onSearchIndexDefinitionChanged}
              minLines={16}
            />
          </section>
        </div>
        {parsingError && <WarningSummary warnings={parsingError} />}
        {!parsingError && error && <ErrorSummary errors={error} />}
        {mode === 'update' && (
          <Banner>
            Note: Updating the index may slow down your device temporarily due
            to resource usage. Save indexes only with changes to avoid
            reindexing.
          </Banner>
        )}
      </ModalBody>
      <ModalFooter className={footerStyles}>
        <Button
          data-testid="search-index-submit-button"
          variant="primary"
          onClick={onSubmitIndex}
          disabled={isBusy}
        >
          {mode === 'create' ? 'Create Index' : 'Update Index'}
        </Button>
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
