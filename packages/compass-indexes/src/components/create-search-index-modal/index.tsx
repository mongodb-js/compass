import React, { useCallback, useState } from 'react';
import { useTrackOnChange } from '@mongodb-js/compass-logging';
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
} from '@mongodb-js/compass-components';
import { closeModal, saveIndex } from '../../modules/search-indexes';
import { connect } from 'react-redux';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';
import type { RootState } from '../../modules';
import _parseShellBSON, { ParseMode } from 'ejson-shell-parser';
import type { Document } from 'mongodb';
import { ErrorSummary } from '@mongodb-js/compass-components';

// Copied from packages/compass-aggregations/src/modules/pipeline-builder/pipeline-parser/utils.ts
export function parseShellBSON(source: string): Document[] {
  const parsed = _parseShellBSON(source, { mode: ParseMode.Loose });
  if (!parsed || typeof parsed !== 'object') {
    // XXX(COMPASS-5689): We've hit the condition in
    // https://github.com/mongodb-js/ejson-shell-parser/blob/c9c0145ababae52536ccd2244ac2ad01a4bbdef3/src/index.ts#L36
    throw new Error('The provided index definition is invalid.');
  }
  return parsed;
}

const ATLAS_SEARCH_SERVER_ERRORS: Record<string, string> = {
  InvalidIndexSpecificationOption: 'Invalid index definition.',
  IndexAlreadyExists:
    'This index name is already in use. Please choose another one.',
};

const DEFAULT_INDEX_DEFINITION = `{
  "mappings": {
    "dynamic": true
  }
}`;

const bodyGapStyles = css({
  marginTop: spacing[3],
});

const toolbarStyles = css({
  display: 'flex',
  gap: spacing[2],
});

type CreateSearchIndexModalProps = {
  isModalOpen: boolean;
  error?: string;
  saveIndex: (indexName: string, indexDefinition: Document) => void;
  closeModal: () => void;
};

export const CreateSearchIndexModal: React.FunctionComponent<
  CreateSearchIndexModalProps
> = ({ isModalOpen, error, saveIndex, closeModal }) => {
  const [indexName, setIndexName] = useState<string>('default');
  const [indexDefinition, setIndexDefinition] = useState<string>(
    DEFAULT_INDEX_DEFINITION
  );
  const [parsingError, setParsingError] = useState<string | undefined>(
    undefined
  );

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
  const onSetOpen = useCallback(
    (open) => {
      if (!open) {
        closeModal();
      }
    },
    [closeModal]
  );

  const onSaveIndex = useCallback(() => {
    if (parsingError) {
      return;
    }

    const indexDefinitionDoc = parseShellBSON(indexDefinition);
    saveIndex(indexName, indexDefinitionDoc);
  }, [saveIndex, parsingError, indexName, indexDefinition]);

  const onCancel = useCallback(() => {
    onSetOpen(false);
  }, [onSetOpen]);

  useTrackOnChange(
    'COMPASS-SEARCH-INDEXES-UI',
    (track) => {
      if (isModalOpen) {
        track('Screen', { name: 'create_search_index_modal' });
      }
    },
    [isModalOpen],
    undefined,
    React
  );

  return (
    <Modal
      open={isModalOpen}
      setOpen={onSetOpen}
      data-testid="create-search-index-modal"
    >
      <ModalHeader
        title="Create Search Index"
        subtitle="Give your search index a name for easy reference"
      />
      <ModalBody>
        <div className={bodyGapStyles}>
          <Label htmlFor="name-of-search-index">Name of Search Index</Label>
          <TextInput
            id="name-of-search-index"
            aria-labelledby="Name of Search Index"
            type="text"
            state={indexName === '' ? 'error' : 'none'}
            errorMessage={
              indexName === '' && 'Please enter the name of the index.'
            }
            value={indexName}
            onChange={(evt: any) => setIndexName(evt.target.value)}
          />
        </div>
        <HorizontalRule className={bodyGapStyles} />
        <div className={bodyGapStyles}>
          <Subtitle>Index Definition</Subtitle>
          <p className={bodyGapStyles}>
            By default, search indexes will have the following search
            configurations. You can refine this later.
          </p>
          <Link href="/" target="_blank" hideExternalIcon={true}>
            View Atlas Search tutorials{' '}
            <Icon size="small" glyph="OpenNewTab"></Icon>
          </Link>
          <CodemirrorMultilineEditor
            text={indexDefinition}
            onChangeText={onSearchIndexDefinitionChanged}
            minLines={16}
            className={bodyGapStyles}
          />
          {parsingError && <WarningSummary warnings={[parsingError]} />}
          {error && (
            <ErrorSummary
              errors={[ATLAS_SEARCH_SERVER_ERRORS[error] || error]}
            />
          )}
        </div>
      </ModalBody>

      <ModalFooter className={toolbarStyles}>
        <Button variant="primary" onClick={onSaveIndex}>
          Create Search Index
        </Button>
        <Button variant="default" onClick={onCancel}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

const mapState = ({ searchIndexes }: RootState) => ({
  isModalOpen: searchIndexes.createIndex.isModalOpen,
  error: searchIndexes.error,
});

const mapDispatch = {
  closeModal,
  saveIndex,
};

export default connect(mapState, mapDispatch)(CreateSearchIndexModal);
