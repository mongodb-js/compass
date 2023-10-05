import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
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
  Button,
  Link,
  Icon,
  WarningSummary,
  ErrorSummary,
  Body,
  Banner,
  rafraf,
} from '@mongodb-js/compass-components';
import type { Annotation } from '@mongodb-js/compass-editor';
import {
  CodemirrorMultilineEditor,
  createSearchIndexAutocompleter,
} from '@mongodb-js/compass-editor';
import type { EditorRef } from '@mongodb-js/compass-editor';
import _parseShellBSON, { ParseMode } from 'ejson-shell-parser';
import type { Document } from 'mongodb';
import { useTrackOnChange } from '@mongodb-js/compass-logging/provider';
import { SearchIndexTemplateDropdown } from '../search-index-template-dropdown';
import type { SearchTemplate } from '@mongodb-js/mongodb-constants';
import type { Field } from '../../modules/fields';

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
  gap: spacing[3],
});

const templateToolbarStyles = css({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[3],
});

const templateToolbarTextDescriptionStyles = css({
  width: '60%',
});

const templateToolbarDropdownStyles = css({
  width: '40%',
});

const formContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
  overflow: 'auto',
  // This is to accomodate for the focus ring that is visible
  // when the index name input is focussed.
  padding: spacing[1],
});

const formFieldContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[1],
});

const footerStyles = css({
  display: 'flex',
  gap: spacing[2],
});

type ParsingError = {
  message: string;
  pos: number | undefined;
};

type BaseSearchIndexModalProps = {
  mode: 'create' | 'update';
  initialIndexName: string;
  initialIndexDefinition: string;
  isModalOpen: boolean;
  isBusy: boolean;
  error: string | undefined;
  fields: Field[];
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
  fields,
  onSubmit,
  onClose,
}) => {
  const editorRef = useRef<EditorRef>(null);

  const [indexName, setIndexName] = useState(initialIndexName);
  const [indexDefinition, setIndexDefinition] = useState(
    initialIndexDefinition
  );
  const [parsingError, setParsingError] = useState<ParsingError | undefined>(
    undefined
  );

  // https://github.com/mongodb-js/ejson-shell-parser/blob/master/src/index.ts#L30
  // Wraps the input in (\n$input\n) so we need to substract 4 chars from the position.
  const annotations = useMemo<Annotation[]>(() => {
    if (parsingError && parsingError.pos) {
      const pos = Math.max(parsingError.pos - 4, 0);
      return [
        {
          message: parsingError.message,
          severity: 'error',
          from: pos,
          to: pos,
        },
      ];
    }

    return [];
  }, [parsingError]);

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
    undefined
  );

  useEffect(() => {
    if (isModalOpen) {
      setIndexName(initialIndexName);
      setIndexDefinition(initialIndexDefinition);
      setParsingError(undefined);
    }
  }, [isModalOpen, initialIndexName, initialIndexDefinition]);

  const onSearchIndexDefinitionChanged = useCallback(
    (newDefinition: string) => {
      setParsingError(undefined);

      try {
        parseShellBSON(newDefinition);
        setIndexDefinition(newDefinition);
      } catch (ex) {
        setParsingError(ex as ParsingError);
      }
    },
    [setIndexDefinition, setParsingError]
  );

  const onSubmitIndex = useCallback(() => {
    if (parsingError) {
      return;
    }

    const indexDefinitionDoc = parseShellBSON(indexDefinition);
    onSubmit(indexName, indexDefinitionDoc);
  }, [onSubmit, parsingError, indexName, indexDefinition]);

  const onChangeTemplate = useCallback(
    (template: SearchTemplate) => {
      rafraf(() => {
        editorRef.current?.focus();
        editorRef.current?.applySnippet(template.snippet);
      });
    },
    [editorRef]
  );

  const completer = useMemo(
    () =>
      createSearchIndexAutocompleter({
        fields,
      }),
    [fields]
  );

  return (
    <Modal
      open={isModalOpen}
      setOpen={onClose}
      data-testid="search-index-modal"
    >
      <ModalHeader
        title={
          mode === 'create'
            ? 'Create Search Index'
            : `Edit "${indexName}" index`
        }
      />
      <ModalBody className={bodyStyles}>
        <div className={formContainerStyles}>
          {mode === 'create' && (
            <>
              <section className={formFieldContainerStyles}>
                <Label htmlFor="name-of-search-index">
                  Name of Search Index
                </Label>
                <TextInput
                  id="name-of-search-index"
                  data-testid="name-of-search-index"
                  aria-labelledby="Name of Search Index"
                  type="text"
                  state={indexName === '' ? 'error' : 'none'}
                  errorMessage={
                    indexName === ''
                      ? 'Please enter the name of the index.'
                      : ''
                  }
                  value={indexName}
                  onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
                    setIndexName(evt.target.value)
                  }
                />
              </section>
              <HorizontalRule />
            </>
          )}
          <div className={formFieldContainerStyles}>
            <section className={templateToolbarStyles}>
              <div className={templateToolbarTextDescriptionStyles}>
                <Label htmlFor="definition-of-search-index">
                  Index Definition
                </Label>
                <br />
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
              </div>
              <div className={templateToolbarDropdownStyles}>
                <SearchIndexTemplateDropdown
                  tooltip="Selecting a new template will replace your existing index definition in the code editor."
                  onTemplate={onChangeTemplate}
                />
              </div>
            </section>
            <CodemirrorMultilineEditor
              ref={editorRef}
              id="definition-of-search-index"
              data-testid="definition-of-search-index"
              text={indexDefinition}
              annotations={annotations}
              onChangeText={onSearchIndexDefinitionChanged}
              minLines={16}
              completer={completer}
            />
          </div>
        </div>
        {parsingError && <WarningSummary warnings={parsingError.message} />}
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
          {mode === 'create' ? 'Create Search Index' : 'Save'}
        </Button>
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
