import React, { useCallback, useEffect, useRef, useState } from 'react';
import { connect, shallowEqual, useSelector } from 'react-redux';
import type { RootState } from '../../modules';
import {
  createIndex,
  createSearchIndexClosed,
} from '../../modules/search-indexes';
import {
  openIndexesListDrawerView,
  setIsDirty,
} from '../../modules/indexes-drawer';
import {
  useOnAsyncSuccess,
  useIndexDefinitionChange,
} from './drawer-view-hooks';
import type { SearchIndexType } from '../../modules/indexes-drawer';
import {
  Body,
  Button,
  cx,
  ErrorSummary,
  SpinLoader,
  Subtitle,
  TextInput,
  Tooltip,
  useDarkMode,
} from '@mongodb-js/compass-components';
import {
  containerStyles,
  contentStyles,
  buttonContainerStyles,
  editorContainerStyles,
  editorContainerDarkModeStyles,
  overflowWrapStyles,
} from './drawer-view-styles';
import type { Document } from 'mongodb';
import {
  CodemirrorMultilineEditor,
  useJsonSchemaAutocompleter,
} from '@mongodb-js/compass-editor';
import type { EditorRef } from '@mongodb-js/compass-editor';
import { parseShellBSON } from '../../utils/parse-shell-bson';
import {
  ATLAS_SEARCH_TEMPLATES,
  ATLAS_VECTOR_SEARCH_TEMPLATE,
} from '@mongodb-js/mongodb-constants';
import type { SearchIndex } from 'mongodb-data-service';
import searchIndexSchema from '@mongodb-js/search-index-schema/output/search/index_jsonEditor.json';
import vectorSearchIndexSchema from '@mongodb-js/search-index-schema/output/vectorSearch/index_jsonEditor.json';
import type { JSONSchema7 } from 'json-schema';
import { selectReadWriteAccess } from '../../utils/indexes-read-write-access';
import {
  useConnectionInfo,
  useConnectionInfoRef,
} from '@mongodb-js/compass-connections/provider';
import { usePreferences } from 'compass-preferences-model/provider';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

/**
 * Strips snippet tab-stop placeholders (e.g. `${1:default}` → `default`)
 * so the template can be used as plain editor text
 */
function normalizeSnippet(snippet: string): string {
  return snippet.replace(/\${\d+:([^}]+)}/gm, '$1');
}

export const getNextAvailableIndexName = (
  indexes: SearchIndex[],
  defaultIndexName: string
): string => {
  const existingNames = new Set(indexes.map((index) => index.name));

  if (!existingNames.has(defaultIndexName)) {
    return defaultIndexName;
  }

  let counter = 1;
  while (existingNames.has(`${defaultIndexName}_${counter}`)) {
    counter++;
  }

  return `${defaultIndexName}_${counter}`;
};

type CreateSearchIndexViewProps = {
  namespace: string;
  searchIndexes: SearchIndex[];
  currentIndexType: SearchIndexType;
  isBusy: boolean;
  error?: string;
  onClose: () => void;
  onResetCreateState: () => void;
  createIndex: (index: {
    name: string;
    definition: Document;
    type?: string;
  }) => void;
  onIndexDefinitionEdit: (isDirty: boolean) => void;
};

const CreateSearchIndexDrawerView: React.FunctionComponent<
  CreateSearchIndexViewProps
> = ({
  namespace,
  searchIndexes,
  currentIndexType,
  isBusy,
  error,
  onClose,
  onResetCreateState,
  createIndex,
  onIndexDefinitionEdit,
}) => {
  const track = useTelemetry();
  const connectionInfoRef = useConnectionInfoRef();

  useEffect(() => {
    track(
      'Screen',
      { name: 'create_search_index_drawer' },
      connectionInfoRef.current
    );
  }, [track, connectionInfoRef]);

  const editorRef = useRef<EditorRef>(null);
  const [indexDefinition, setIndexDefinition] = useState(
    normalizeSnippet(
      currentIndexType === 'vectorSearch'
        ? ATLAS_VECTOR_SEARCH_TEMPLATE.snippet
        : ATLAS_SEARCH_TEMPLATES[0].snippet
    )
  );
  const [name, setName] = useState(
    getNextAvailableIndexName(
      searchIndexes,
      currentIndexType === 'vectorSearch' ? 'vector_index' : 'default'
    )
  );

  const { atlasMetadata } = useConnectionInfo();
  const isAtlas = !!atlasMetadata;
  const { readOnly, readWrite, enableAtlasSearchIndexes } = usePreferences([
    'readOnly',
    'readWrite',
    'enableAtlasSearchIndexes',
  ]);
  const { isSearchIndexesWritable } = useSelector(
    selectReadWriteAccess({
      isAtlas,
      readOnly,
      readWrite,
      enableAtlasSearchIndexes,
    }),
    shallowEqual
  );

  // Use the JSON schema autocomplete hook for validation and autocomplete
  const jsonSchema = (
    currentIndexType === 'vectorSearch'
      ? vectorSearchIndexSchema
      : searchIndexSchema
  ) as JSONSchema7;
  const { completer, extensions, annotations, hasErrors } =
    useJsonSchemaAutocompleter(jsonSchema, indexDefinition);

  const isCreateEnabled = !hasErrors && !isBusy;

  // Reset state on unmount
  useEffect(() => {
    return () => onResetCreateState();
  }, [onResetCreateState]);

  // Navigate back to list when create succeeds
  useOnAsyncSuccess(isBusy, error, onClose);

  const darkMode = useDarkMode();

  const onChangeText = useIndexDefinitionChange(
    setIndexDefinition,
    onIndexDefinitionEdit
  );

  const onCreateClick = useCallback(() => {
    track('Search Index Create Submitted', {
      context: 'Create Search Index Drawer View',
      index_type: currentIndexType,
    });
    createIndex({
      name,
      definition: parseShellBSON(indexDefinition),
      type: currentIndexType,
    });
  }, [name, indexDefinition, createIndex, currentIndexType, track]);

  const indexLabel =
    currentIndexType === 'vectorSearch'
      ? 'Vector Search Index'
      : 'Search Index';

  return (
    <div
      className={containerStyles}
      data-testid="create-search-index-drawer-view"
    >
      <div className={contentStyles}>
        <Subtitle
          className={overflowWrapStyles}
          data-testid="create-search-index-drawer-view-title"
        >
          Create {indexLabel} for {namespace}
        </Subtitle>
        <Body>
          {currentIndexType === 'search'
            ? 'Full-text search for relevance-based app features.'
            : 'For semantic search and AI applications.'}
        </Body>
        <TextInput
          data-testid="create-search-index-drawer-view-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          label="Index Name"
          description={`Give your ${indexLabel.toLowerCase()} a name for easy reference`}
          state={name === '' ? 'error' : 'none'}
          errorMessage={
            name === '' ? 'Please enter the name of the index.' : ''
          }
          disabled={!isSearchIndexesWritable}
        />
        <Body>
          By default, your {indexLabel.toLowerCase()} will have the following
          configurations. We recommend starting with this and refining it later
          if you need to.
        </Body>
        <div
          className={cx(
            editorContainerStyles,
            darkMode && editorContainerDarkModeStyles
          )}
        >
          <CodemirrorMultilineEditor
            ref={editorRef}
            id="create-search-index-drawer-view-editor"
            data-testid="create-search-index-drawer-view-editor"
            text={indexDefinition}
            onChangeText={onChangeText}
            minLines={16}
            showLineNumbers={true}
            language={'json'}
            initialJSONFoldAll={false}
            completer={completer}
            customExtensions={extensions}
            annotations={annotations}
            readOnly={!isSearchIndexesWritable}
          />
        </div>
        {error && <ErrorSummary errors={error} />}
      </div>
      <div className={buttonContainerStyles}>
        <Button
          data-testid="create-search-index-drawer-view-cancel-button"
          variant="default"
          onClick={() => {
            track('Search Index Create Cancelled', {
              context: 'Create Search Index Drawer View',
              index_type: currentIndexType,
            });
            onClose();
          }}
        >
          Cancel
        </Button>
        <Tooltip
          trigger={
            <Button
              data-testid="create-search-index-drawer-view-submit-button"
              variant="primary"
              isLoading={isBusy}
              loadingIndicator={<SpinLoader />}
              disabled={!isCreateEnabled || !isSearchIndexesWritable}
              onClick={onCreateClick}
            >
              Create {indexLabel}
            </Button>
          }
          enabled={!isSearchIndexesWritable}
        >
          You currently don&apos;t have permission to create {indexLabel}es in
          this{' '}
          {!atlasMetadata
            ? 'cluster.'
            : 'project, please contact Project Owner to request the Project Data Access Admin role.'}
        </Tooltip>
      </div>
    </div>
  );
};

const mapState = ({ namespace, searchIndexes, indexesDrawer }: RootState) => ({
  namespace,
  searchIndexes: searchIndexes.indexes,
  currentIndexType: indexesDrawer.currentIndexType,
  isBusy: searchIndexes.createIndex.isBusy,
  error: searchIndexes.createIndex.error,
});

const mapDispatch = {
  onClose: openIndexesListDrawerView,
  onResetCreateState: createSearchIndexClosed,
  createIndex,
  onIndexDefinitionEdit: setIsDirty,
};

export { CreateSearchIndexDrawerView };
export default connect(mapState, mapDispatch)(CreateSearchIndexDrawerView);
