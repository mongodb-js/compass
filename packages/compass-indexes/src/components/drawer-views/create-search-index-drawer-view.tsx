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
import type { State as SearchIndexesState } from '../../modules/search-indexes';
import {
  openIndexesListDrawerView,
  setIsEditing,
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
} from './drawer-view-styles';
import type { Document } from 'mongodb';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';
import type { EditorRef } from '@mongodb-js/compass-editor';
import { parseShellBSON } from '../../utils/parse-shell-bson';
import {
  ATLAS_SEARCH_TEMPLATES,
  ATLAS_VECTOR_SEARCH_TEMPLATE,
} from '@mongodb-js/mongodb-constants';

type CreateSearchIndexViewProps = {
  namespace: string;
  searchIndexes: Pick<SearchIndexesState, 'indexes' | 'error' | 'status'>;
  currentIndexType: SearchIndexType;
  isEditing: boolean;
  isBusy: boolean;
  error?: string;
  onClose: () => void;
  onResetCreateState: () => void;
  createIndex: (index: {
    name: string;
    definition: Document;
    type?: string;
  }) => void;
  onIndexDefinitionEdit: (isEditing: boolean) => void;
};

const CreateSearchIndexDrawerView: React.FunctionComponent<
  CreateSearchIndexViewProps
> = ({
  namespace,
  currentIndexType,
  isEditing,
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
    currentIndexType === 'vectorSearch' ? 'vector_index' : 'default'
  );

  const isCreateEnabled = useMemo(() => {
    try {
      parseShellBSON(indexDefinition);
      return !isBusy;
    } catch {
      // If current definition is invalid, don't enable create
      return false;
    }
  }, [indexDefinition, isBusy]);

  // Reset states on unmount
  useEffect(() => {
    return () => {
      onResetCreateState();
      onIndexDefinitionEdit(false);
    };
  }, [onResetCreateState, onIndexDefinitionEdit]);

  // Navigate back to list when create succeeds
  useOnAsyncSuccess(isBusy, error, onClose);

  const darkMode = useDarkMode();

  const onChangeText = useIndexDefinitionChange(
    setIndexDefinition,
    onIndexDefinitionEdit
  );
  const onCancelClick = useConfirmCancel(isEditing, onClose);

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
    <div className={containerStyles}>
      <div className={contentStyles}>
        <Subtitle>
          Create {indexLabel} for {namespace}
        </Subtitle>
        <Body>For semantic search and AI applications.</Body>
        <TextInput
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
        <div className={editorContainerStyles(darkMode)}>
          <CodemirrorMultilineEditor
            ref={editorRef}
            id="definition-of-search-index"
            data-testid="definition-of-search-index"
            text={indexDefinition}
            onChangeText={onChangeText}
            minLines={16}
            showLineNumbers={true}
          />
        </div>
        {error && <ErrorSummary errors={error} />}
      </div>
      <div className={buttonContainerStyles}>
        <Button variant="default" onClick={() => void onCancelClick()}>
          Cancel
        </Button>
        <Button
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
  searchIndexes,
  currentIndexType: indexesDrawer.currentIndexType,
  isEditing: indexesDrawer.isEditing,
  isBusy: searchIndexes.createIndex.isBusy,
  error: searchIndexes.createIndex.error,
});

const mapDispatch = {
  onClose: openIndexesListDrawerView,
  onResetCreateState: createSearchIndexClosed,
  createIndex,
  onIndexDefinitionEdit: setIsEditing,
};

export default connect(mapState, mapDispatch)(CreateSearchIndexDrawerView);
