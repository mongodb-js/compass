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
  RadioBoxGroup,
  RadioBox,
  rafraf,
} from '@mongodb-js/compass-components';
import type { Annotation } from '@mongodb-js/compass-editor';
import {
  CodemirrorMultilineEditor,
  createSearchIndexAutocompleter,
} from '@mongodb-js/compass-editor';
import type { EditorRef } from '@mongodb-js/compass-editor';
import _parseShellBSON, { ParseMode } from '@mongodb-js/shell-bson-parser';
import type { Document } from 'mongodb';
import { SearchIndexTemplateDropdown } from '../search-index-template-dropdown';
import {
  ATLAS_SEARCH_TEMPLATES,
  ATLAS_VECTOR_SEARCH_TEMPLATE,
  type SearchTemplate,
} from '@mongodb-js/mongodb-constants';
import { useAutocompleteFields } from '@mongodb-js/compass-field-store';
import {
  useTrackOnChange,
  type TrackFunction,
} from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfoRef } from '@mongodb-js/compass-connections/provider';

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
  gap: spacing[400],
});

const templateToolbarStyles = css({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[400],
});

const templateToolbarTextDescriptionStyles = css({
  flexGrow: 1,
});

const templateToolbarDropdownStyles = css({
  width: '40%',
  flexShrink: 0,
});

const formContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
  overflow: 'auto',
  // This is to accomodate for the focus ring that is visible
  // when the index name input is focussed.
  padding: spacing[100],
});

const formFieldContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

const footerStyles = css({
  display: 'flex',
  gap: spacing[200],
});

export const DEFAULT_INDEX_DEFINITION = `{
  mappings: {
    dynamic: true,
  },
}`;

type ParsingError = {
  message: string;
  pos: number | undefined;
};

type BaseSearchIndexModalProps = {
  namespace: string;
  mode: 'create' | 'update';
  initialIndexName: string;
  initialIndexDefinition: string;
  initialIndexType?: string;
  isModalOpen: boolean;
  isBusy: boolean;
  isVectorSearchSupported: boolean;
  error: string | undefined;
  onSubmit: (index: {
    name: string;
    type?: string;
    definition: Document;
  }) => void;
  onClose: () => void;
};

type SearchIndexType = 'search' | 'vectorSearch';

const searchIndexTypes = [
  {
    label: 'Search',
    value: 'search',
  },
  {
    label: 'Vector Search',
    value: 'vectorSearch',
  },
] as const;

export const BaseSearchIndexModal: React.FunctionComponent<
  BaseSearchIndexModalProps
> = ({
  namespace,
  mode,
  initialIndexName,
  initialIndexDefinition,
  initialIndexType,
  isModalOpen,
  isBusy,
  isVectorSearchSupported,
  error,
  onSubmit,
  onClose,
}) => {
  const initialSearchIndexType: SearchIndexType =
    initialIndexType === 'search' || initialIndexType === 'vectorSearch'
      ? initialIndexType
      : 'search';
  const editorRef = useRef<EditorRef>(null);
  const connectionInfoRef = useConnectionInfoRef();

  const [indexName, setIndexName] = useState(initialIndexName);
  const [searchIndexType, setSearchIndexType] = useState<SearchIndexType>(
    initialSearchIndexType
  );
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
    (track: TrackFunction) => {
      if (isModalOpen) {
        const connectionInfo = connectionInfoRef.current;
        track(
          'Screen',
          {
            name:
              mode === 'create'
                ? 'create_search_index_modal'
                : 'update_search_index_modal',
          },
          connectionInfo
        );
        if (mode === 'create') {
          track(
            'Index Create Opened',
            {
              atlas_search: true,
            },
            connectionInfo
          );
        }
      }
    },
    [isModalOpen, mode, connectionInfoRef],
    undefined
  );

  useEffect(() => {
    if (isModalOpen) {
      setSearchIndexType(initialSearchIndexType);
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
    onSubmit({
      name: indexName,
      definition: indexDefinitionDoc,
      ...(isVectorSearchSupported
        ? {
            type: searchIndexType,
          }
        : {}),
    });
  }, [
    onSubmit,
    parsingError,
    indexName,
    searchIndexType,
    indexDefinition,
    isVectorSearchSupported,
  ]);

  const onChangeTemplate = useCallback(
    (template: SearchTemplate) => {
      rafraf(() => {
        editorRef.current?.focus();
        editorRef.current?.applySnippet(template.snippet);
      });
    },
    [editorRef]
  );

  const onChangeSearchIndexType = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
      setSearchIndexType(value as SearchIndexType);

      // Set the template.
      if (value === 'vectorSearch') {
        setIndexDefinition(ATLAS_VECTOR_SEARCH_TEMPLATE.snippet);
        onChangeTemplate(ATLAS_VECTOR_SEARCH_TEMPLATE);
      } else {
        setIndexDefinition(ATLAS_SEARCH_TEMPLATES[0].snippet);
        onChangeTemplate(ATLAS_SEARCH_TEMPLATES[0]);
      }
    },
    [setSearchIndexType, onChangeTemplate, setIndexDefinition]
  );

  const fields = useAutocompleteFields(namespace);

  const completer = useMemo(() => {
    return createSearchIndexAutocompleter({ fields });
  }, [fields]);

  const isEditingVectorSearchIndex =
    mode === 'update' && initialIndexType === 'vectorSearch';

  return (
    <Modal
      open={isModalOpen}
      setOpen={onClose}
      data-testid="search-index-modal"
    >
      <ModalHeader
        title={
          mode === 'create'
            ? 'Create Atlas Search Index'
            : `Edit ${
                initialIndexType === 'vectorSearch' ? 'Vector Search' : 'Search'
              } Index "${indexName}"`
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
              {isVectorSearchSupported && (
                <>
                  <section className={formFieldContainerStyles}>
                    <Label htmlFor="search-index-type">
                      Atlas Search Index type
                    </Label>
                    <RadioBoxGroup
                      id="search-index-type"
                      data-testid="search-index-type"
                      onChange={onChangeSearchIndexType}
                      value={searchIndexType}
                    >
                      {searchIndexTypes.map(({ label, value }) => {
                        return (
                          <RadioBox
                            id={`search-index-type-${value}-button`}
                            data-testid={`search-index-type-${value}-button`}
                            checked={searchIndexType === value}
                            value={value}
                            key={value}
                          >
                            {label}
                          </RadioBox>
                        );
                      })}
                    </RadioBoxGroup>
                  </section>
                  <HorizontalRule />
                </>
              )}
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
                    By default,{' '}
                    {searchIndexType === 'vectorSearch'
                      ? 'vector search'
                      : 'search'}{' '}
                    indexes will have the following search configurations. You
                    can refine this later.
                  </Body>
                )}
                <Link
                  href={
                    searchIndexType === 'vectorSearch'
                      ? 'https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-tutorial/'
                      : 'https://www.mongodb.com/docs/atlas/atlas-search/tutorial/'
                  }
                  target="_blank"
                  hideExternalIcon={true}
                >
                  View Atlas{' '}
                  {searchIndexType === 'vectorSearch'
                    ? 'Vector Search'
                    : 'Search'}{' '}
                  tutorials <Icon size="small" glyph="OpenNewTab"></Icon>
                </Link>
              </div>
              {searchIndexType === 'search' && !isEditingVectorSearchIndex && (
                <div className={templateToolbarDropdownStyles}>
                  <SearchIndexTemplateDropdown
                    isVectorSearchSupported={isVectorSearchSupported}
                    tooltip="Selecting a new template will replace your existing index definition in the code editor."
                    onTemplate={onChangeTemplate}
                  />
                </div>
              )}
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
          disabled={isBusy || !!parsingError}
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
