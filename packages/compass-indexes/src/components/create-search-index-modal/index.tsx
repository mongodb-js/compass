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
import type { CreateSearchIndexState } from '../../modules/create-search-index';
import { connect } from 'react-redux';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';

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
  createIndex: (indexName: string, indexDefinition: string) => void;
  closeModal: () => void;
};

export const CreateSearchIndexModal: React.FunctionComponent<
  CreateSearchIndexModalProps
> = ({ isModalOpen, createIndex, closeModal }) => {
  const [indexName, setIndexName] = useState<string>('default');
  const [indexDefinition, setIndexDefinition] = useState<string>(
    DEFAULT_INDEX_DEFINITION
  );

  const onSetOpen = useCallback(
    (open) => {
      if (!open) {
        closeModal?.();
      }
    },
    [closeModal]
  );

  const onCreateIndex = useCallback(() => {
    createIndex?.(indexName, indexDefinition);
    onSetOpen(false);
  }, [indexName, indexDefinition, onSetOpen]);

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
        subtitle="Give your search index a name for easy deference"
      />
      <ModalBody>
        <div className={bodyGapStyles}>
          <Label htmlFor="name-of-search-index">Name of Search Index</Label>
          <TextInput
            id="name-of-search-index"
            aria-labelledby="Name of Search Index"
            type="text"
            value={indexName}
            onChange={(evt) => setIndexName(evt.target.value)}
          />
        </div>
        <HorizontalRule className={bodyGapStyles} />
        <div className={bodyGapStyles}>
          <Subtitle>JSON Editor</Subtitle>
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

const mapState = ({ createSearchIndexReducer }: CreateSearchIndexState) => {
  return { isModalOpen: createSearchIndexReducer.isModalOpen };
};

export default connect(mapState, {})(CreateSearchIndexModal);
