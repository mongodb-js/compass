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
  State as SearchIndexesState,
  updateIndex,
  updateSearchIndexClosed,
} from '../../modules/search-indexes';
import {
  openIndexesListDrawerView,
  setIsEditing,
} from '../../modules/indexes-drawer';
import {
  useOnAsyncSuccess,
  useConfirmCancel,
  useIndexDefinitionChange,
} from './drawer-view-hooks';
import {
  Badge,
  BadgeVariant,
  Button,
  css,
  spacing,
  ErrorSummary,
} from '@mongodb-js/compass-components';
import {
  containerStyles,
  contentStyles,
  buttonContainerStyles,
  titleStyles,
  descriptionStyles,
  editorContainerStyles,
} from './drawer-view-styles';
import { IndexStatus } from '../search-indexes-table/use-search-indexes-table';
import {
  CodemirrorMultilineEditor,
  type EditorRef,
} from '@mongodb-js/compass-editor';
import type { Document } from 'mongodb';
import { parseShellBSON } from '../../utils/parse-shell-bson';

const scrollContainerStyles = css({
  overflowX: 'auto',
});

const headerContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[400],
  width: 'max-content',
});

type EditSearchIndexViewProps = {
  namespace: string;
  searchIndexes: Pick<SearchIndexesState, 'indexes' | 'error' | 'status'>;
  currentIndexName: string;
  isEditing: boolean;
  isBusy: boolean;
  error?: string;
  onClose: () => void;
  onResetUpdateState: () => void;
  updateIndex: (index: { name: string; definition: Document }) => void;
  onIndexDefinitionEdit: (isEditing: boolean) => void;
};

const EditSearchIndexDrawerView: React.FunctionComponent<
  EditSearchIndexViewProps
> = ({
  namespace,
  searchIndexes,
  currentIndexName,
  isEditing,
  isBusy,
  error,
  onClose,
  onResetUpdateState,
  updateIndex,
  onIndexDefinitionEdit,
}) => {
  const searchIndex = searchIndexes.indexes.find(
    (x) => x.name === currentIndexName
  );

  const editorRef = useRef<EditorRef>(null);
  const initialDefinition = JSON.stringify(
    searchIndex?.latestDefinition,
    null,
    2
  );
  const [indexDefinition, setIndexDefinition] = useState(initialDefinition);

  const isSaveEnabled = useMemo(() => {
    try {
      const currentParsed = parseShellBSON(indexDefinition);
      const initialParsed = searchIndex?.latestDefinition;
      return (
        !isBusy &&
        JSON.stringify(currentParsed) !== JSON.stringify(initialParsed)
      );
    } catch {
      // If current definition is invalid, don't enable save
      return false;
    }
  }, [indexDefinition, searchIndex?.latestDefinition, isBusy]);

  // Reset states on unmount
  useEffect(() => {
    return () => {
      onResetUpdateState();
      onIndexDefinitionEdit(false);
    };
  }, []);

  // Navigate back to list when update succeeds
  useOnAsyncSuccess(isBusy, error, onClose);

  const onChangeText = useIndexDefinitionChange(
    setIndexDefinition,
    onIndexDefinitionEdit
  );
  const onCancelClick = useConfirmCancel(isEditing, onClose);

  const onSaveClick = useCallback(() => {
    updateIndex({
      name: currentIndexName,
      definition: parseShellBSON(indexDefinition),
    });
  }, [currentIndexName, indexDefinition, updateIndex]);

  if (!searchIndex) {
    return null;
  }

  const indexLabel =
    searchIndex.type === 'vectorSearch'
      ? 'Vector Search Index'
      : 'Search Index';

  return (
    <div className={containerStyles}>
      <div className={contentStyles}>
        <div className={titleStyles}>Edit {indexLabel}</div>
        <div className={scrollContainerStyles}>
          <div className={headerContainerStyles}>
            {currentIndexName}
            <Badge variant={BadgeVariant.Blue}>{indexLabel}</Badge>
            <IndexStatus
              status={searchIndex.status}
              data-testid={'edit-search-index-drawer-view-status'}
            />
            <Badge
              variant={
                searchIndex.queryable
                  ? BadgeVariant.LightGray
                  : BadgeVariant.Red
              }
            >
              {searchIndex.queryable ? 'Queryable' : 'Non-queryable'}
            </Badge>
          </div>
        </div>
        <div className={descriptionStyles}>
          This {indexLabel.toLowerCase()} parses the data in <b>{namespace}</b>{' '}
          and has the following configurations.
        </div>
        <div className={editorContainerStyles}>
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
        <Button variant="default" onClick={onCancelClick}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={!isSaveEnabled}
          onClick={onSaveClick}
        >
          Save and Rebuild
        </Button>
      </div>
    </div>
  );
};

const mapState = ({ namespace, searchIndexes, indexesDrawer }: RootState) => ({
  namespace,
  searchIndexes,
  currentIndexName: indexesDrawer.currentIndexName,
  isEditing: indexesDrawer.isEditing,
  isBusy: searchIndexes.updateIndex.isBusy,
  error: searchIndexes.updateIndex.error,
});

const mapDispatch = {
  onClose: openIndexesListDrawerView,
  onResetUpdateState: updateSearchIndexClosed,
  updateIndex,
  onIndexDefinitionEdit: setIsEditing,
};

export default connect(mapState, mapDispatch)(EditSearchIndexDrawerView);
