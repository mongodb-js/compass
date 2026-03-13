import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { connect } from 'react-redux';
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
  useConfirmCancel,
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
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';
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
  isDirty: boolean;
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
  isDirty,
  isBusy,
  error,
  onClose,
  onResetCreateState,
  createIndex,
  onIndexDefinitionEdit,
}) => {
  const editorRef = useRef<EditorRef>(null);
  const [indexDefinition, setIndexDefinition] = useState(
    currentIndexType === 'vectorSearch'
      ? ATLAS_VECTOR_SEARCH_TEMPLATE.snippet
      : ATLAS_SEARCH_TEMPLATES[0].snippet
  );
  const [name, setName] = useState(
    getNextAvailableIndexName(
      searchIndexes,
      currentIndexType === 'vectorSearch' ? 'vector_index' : 'default'
    )
  );
  const [hasSchemaErrors, setHasSchemaErrors] = useState(false);

  const onValidationChange = useCallback((hasErrors: boolean) => {
    setHasSchemaErrors(hasErrors);
  }, []);

  const isCreateEnabled = useMemo(() => {
    if (hasSchemaErrors) {
      return false;
    }

    try {
      parseShellBSON(indexDefinition);
      return !isBusy;
    } catch {
      // If current definition is invalid, don't enable create
      return false;
    }
  }, [indexDefinition, isBusy, hasSchemaErrors]);

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
  const onCancelClick = useConfirmCancel(isDirty, onClose);

  const onCreateClick = useCallback(() => {
    createIndex({
      name,
      definition: parseShellBSON(indexDefinition),
      type: currentIndexType,
    });
  }, [name, indexDefinition, createIndex, currentIndexType]);

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
        <Body>For semantic search and AI applications.</Body>
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
            onValidationChange={onValidationChange}
            minLines={16}
            showLineNumbers={true}
            language={'json'}
            initialJSONFoldAll={false}
            jsonSchema={
              (currentIndexType === 'vectorSearch'
                ? vectorSearchIndexSchema
                : searchIndexSchema) as JSONSchema7
            }
          />
        </div>
        {error && <ErrorSummary errors={error} />}
      </div>
      <div className={buttonContainerStyles}>
        <Button
          data-testid="create-search-index-drawer-view-cancel-button"
          variant="default"
          onClick={() => void onCancelClick()}
        >
          Cancel
        </Button>
        <Button
          data-testid="create-search-index-drawer-view-submit-button"
          variant="primary"
          isLoading={isBusy}
          loadingIndicator={<SpinLoader />}
          disabled={!isCreateEnabled}
          onClick={onCreateClick}
        >
          Create {indexLabel}
        </Button>
      </div>
    </div>
  );
};

const mapState = ({ namespace, searchIndexes, indexesDrawer }: RootState) => ({
  namespace,
  searchIndexes: searchIndexes.indexes,
  currentIndexType: indexesDrawer.currentIndexType,
  isDirty: indexesDrawer.isDirty,
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
