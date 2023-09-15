import React, { useCallback, useEffect, useState } from 'react';
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
  ErrorSummary,
} from '@mongodb-js/compass-components';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';
import _parseShellBSON, { ParseMode } from 'ejson-shell-parser';
import type { Document } from 'mongodb';

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

const flexWithGapStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[3],
});

const bodyGapStyles = css({
  marginTop: spacing[3],
});

const toolbarStyles = css({
  display: 'flex',
  gap: spacing[2],
});

type BaseSearchIndexModalProps = {
  title: string;
  submitActionName: string;
  initialIndexName: string;
  initialIndexDefinition: string;
  isIndexNameReadonly: boolean;
  isModalOpen: boolean;
  isBusy: boolean;
  error: string | undefined;
  submitIndex: (indexName: string, indexDefinition: Document) => void;
  closeModal: () => void;
};

export const BaseSearchIndexModal: React.FunctionComponent<
  BaseSearchIndexModalProps
> = ({
  title,
  submitActionName,
  initialIndexName,
  isIndexNameReadonly,
  initialIndexDefinition,
  isModalOpen,
  isBusy,
  error,
  submitIndex,
  closeModal,
}) => {
  const [indexName, setIndexName] = useState<string>(() => initialIndexName);
  const [indexDefinition, setIndexDefinition] = useState<string>(
    initialIndexDefinition
  );
  const [parsingError, setParsingError] = useState<string | undefined>(
    undefined
  );

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
      return;
    }

    const indexDefinitionDoc = parseShellBSON(indexDefinition);
    submitIndex(indexName, indexDefinitionDoc);
  }, [submitIndex, parsingError, indexName, indexDefinition]);

  return (
    <Modal
      open={isModalOpen}
      setOpen={closeModal}
      data-testid="search-index-modal"
    >
      <ModalHeader
        title={title}
        subtitle="Give your search index a name for easy reference"
      />
      <ModalBody className={flexWithGapStyles}>
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
            disabled={isIndexNameReadonly}
            value={indexName}
            onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
              setIndexName(evt.target.value)
            }
          />
        </section>
        <HorizontalRule />
        <section>
          <Subtitle>Index Definition</Subtitle>
          <p className={bodyGapStyles}>
            By default, search indexes will have the following search
            configurations. You can refine this later.
          </p>
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
            className={bodyGapStyles}
          />
          {parsingError && <WarningSummary warnings={parsingError} />}
          {error && <ErrorSummary errors={error} />}
        </section>
      </ModalBody>

      <ModalFooter className={toolbarStyles}>
        <Button
          data-testid="search-index-submit-button"
          variant="primary"
          onClick={onSubmitIndex}
          disabled={isBusy}
        >
          {submitActionName}
        </Button>
        <Button variant="default" onClick={closeModal}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
