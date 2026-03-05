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
  SpinLoader,
  Subtitle,
  Body,
  useDarkMode,
  cx,
} from '@mongodb-js/compass-components';
import {
  containerStyles,
  contentStyles,
  buttonContainerStyles,
  editorContainerStyles,
  editorContainerDarkModeStyles,
} from './drawer-view-styles';
import { IndexStatus } from '../search-indexes-table/use-search-indexes-table';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';
import type { EditorRef } from '@mongodb-js/compass-editor';
import type { Document } from 'mongodb';
import { parseShellBSON } from '../../utils/parse-shell-bson';
import type { SearchIndex } from 'mongodb-data-service';

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
  isEditing: boolean;
  isBusy: boolean;
  searchIndex?: SearchIndex;
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
  isEditing,
  isBusy,
  searchIndex,
  error,
  onClose,
  onResetUpdateState,
  updateIndex,
  onIndexDefinitionEdit,
}) => {
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
  }, [onResetUpdateState, onIndexDefinitionEdit]);

  // Navigate back to list when update succeeds
  useOnAsyncSuccess(isBusy, error, onClose);

  const darkMode = useDarkMode();

  const onChangeText = useIndexDefinitionChange(
    setIndexDefinition,
    onIndexDefinitionEdit
  );
  const onCancelClick = useConfirmCancel(isEditing, onClose);

  const onSaveClick = useCallback(() => {
    if (searchIndex?.name) {
      updateIndex({
        name: searchIndex.name,
        definition: parseShellBSON(indexDefinition),
      });
    }
  }, [searchIndex, indexDefinition, updateIndex]);

  if (!searchIndex) {
    return null;
  }

  const indexLabel =
    searchIndex.type === 'vectorSearch'
      ? 'Vector Search Index'
      : 'Search Index';

  return (
    <div
      className={containerStyles}
      data-testid="edit-search-index-drawer-view"
    >
      <div className={contentStyles}>
        <Subtitle data-testid="edit-search-index-drawer-view-title">
          Edit {indexLabel}
        </Subtitle>
        <div className={scrollContainerStyles}>
          <div className={headerContainerStyles}>
            <span data-testid="edit-search-index-drawer-view-index-name">
              {searchIndex.name}
            </span>
            <Badge
              data-testid="edit-search-index-drawer-view-index-type-badge"
              variant={BadgeVariant.Blue}
            >
              {indexLabel}
            </Badge>
            <IndexStatus
              status={searchIndex.status}
              data-testid="edit-search-index-drawer-view-status"
            />
            <Badge
              data-testid="edit-search-index-drawer-view-queryable-badge"
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
        <Body>
          This {indexLabel.toLowerCase()} parses the data in <b>{namespace}</b>{' '}
          and has the following configurations.
        </Body>
        <div
          className={cx(
            editorContainerStyles,
            darkMode && editorContainerDarkModeStyles
          )}
        >
          <CodemirrorMultilineEditor
            ref={editorRef}
            id="edit-search-index-drawer-view-editor"
            data-testid="edit-search-index-drawer-view-editor"
            text={indexDefinition}
            onChangeText={onChangeText}
            minLines={16}
            showLineNumbers={true}
          />
        </div>
        {error && <ErrorSummary errors={error} />}
      </div>
      <div className={buttonContainerStyles}>
        <Button
          data-testid="edit-search-index-drawer-view-cancel-button"
          variant="default"
          onClick={() => void onCancelClick()}
        >
          Cancel
        </Button>
        <Button
          data-testid="edit-search-index-drawer-view-submit-button"
          variant="primary"
          isLoading={isBusy}
          loadingIndicator={<SpinLoader />}
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
  searchIndex: searchIndexes.indexes.find(
    (x) => x.name === indexesDrawer.currentIndexName
  ),
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
