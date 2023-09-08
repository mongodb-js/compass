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
} from '@mongodb-js/compass-components';
import type { CreateSearchIndexError } from '../../modules/create-search-index';
import {
  closeModal,
  createIndex,
  type CreateSearchIndexState,
} from '../../modules/create-search-index';
import { connect } from 'react-redux';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';

const ERROR_MAPPINGS: Record<CreateSearchIndexError, string> = {
  'index-name-is-empty': 'Enter name.',
  'index-already-exists': 'This name already exists. Choose another name.',
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
  error?: CreateSearchIndexError;
  createIndex: (indexName: string, indexDefinition: string) => void;
  closeModal: () => void;
};

export const CreateSearchIndexModal: React.FunctionComponent<
  CreateSearchIndexModalProps
> = ({ isModalOpen, error, createIndex, closeModal }) => {
  const [indexName, setIndexName] = useState<string>('default');
  const [indexDefinition, setIndexDefinition] = useState<string>(
    DEFAULT_INDEX_DEFINITION
  );

  const onSetOpen = useCallback(
    (open) => {
      if (!open) {
        closeModal();
      }
    },
    [closeModal]
  );

  const onCreateIndex = useCallback(() => {
    createIndex(indexName, indexDefinition);
  }, [createIndex, indexName, indexDefinition]);

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
            state={error ? 'error' : 'none'}
            errorMessage={error && ERROR_MAPPINGS[error]}
            value={indexName}
            onChange={(evt) => setIndexName(evt.target.value)}
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
            onChangeText={setIndexDefinition}
            minLines={16}
            className={bodyGapStyles}
          />
        </div>
      </ModalBody>

      <ModalFooter className={toolbarStyles}>
        <Button variant="primary" onClick={onCreateIndex}>
          Create Search Index
        </Button>
        <Button variant="default" onClick={onCancel}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

const mapState = ({ createSearchIndexReducer }: CreateSearchIndexState) => ({
  isModalOpen: createSearchIndexReducer.isModalOpen,
  error: createSearchIndexReducer.error,
});

const mapDispatch = {
  closeModal,
  createIndex,
};

export default connect(mapState, mapDispatch)(CreateSearchIndexModal);
