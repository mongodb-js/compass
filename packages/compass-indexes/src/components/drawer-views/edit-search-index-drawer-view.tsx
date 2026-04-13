import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { connect, shallowEqual, useSelector } from 'react-redux';
import type { RootState } from '../../modules';
import {
  updateIndex,
  updateSearchIndexClosed,
} from '../../modules/search-indexes';
import {
  openIndexesListDrawerView,
  setIsDirty,
} from '../../modules/indexes-drawer';
import {
  useOnAsyncSuccess,
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
  Tooltip,
  useDarkMode,
  cx,
} from '@mongodb-js/compass-components';
import {
  containerStyles,
  contentStyles,
  buttonContainerStyles,
  editorContainerStyles,
  editorContainerDarkModeStyles,
  overflowWrapStyles,
} from './drawer-view-styles';
import { IndexStatus } from '../search-indexes-table/use-search-indexes-table';
import {
  CodemirrorMultilineEditor,
  useJsonSchemaAutocompleter,
} from '@mongodb-js/compass-editor';
import type { EditorRef } from '@mongodb-js/compass-editor';
import type { Document } from 'mongodb';
import { parseShellBSON } from '../../utils/parse-shell-bson';
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

const scrollContainerStyles = css({
  overflowX: 'auto',
  flexShrink: 0,
});

const headerContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[400],
  width: 'max-content',
});

type EditSearchIndexViewProps = {
  namespace: string;
  searchIndex: SearchIndex;
  isBusy: boolean;
  error?: string;
  onClose: () => void;
  onResetUpdateState: () => void;
  updateIndex: (index: { name: string; definition: Document }) => void;
  onIndexDefinitionEdit: (isDirty: boolean) => void;
};

const EditSearchIndexDrawerView: React.FunctionComponent<
  EditSearchIndexViewProps
> = ({
  namespace,
  searchIndex,
  isBusy,
  error,
  onClose,
  onResetUpdateState,
  updateIndex,
  onIndexDefinitionEdit,
}) => {
  const track = useTelemetry();
  const connectionInfoRef = useConnectionInfoRef();

  useEffect(() => {
    track(
      'Screen',
      { name: 'edit_search_index_drawer' },
      connectionInfoRef.current
    );
  }, [track, connectionInfoRef]);

  const editorRef = useRef<EditorRef>(null);
  const [indexDefinition, setIndexDefinition] = useState(
    JSON.stringify(searchIndex.latestDefinition, null, 2)
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
    searchIndex.type === 'vectorSearch'
      ? vectorSearchIndexSchema
      : searchIndexSchema
  ) as JSONSchema7;
  const { completer, extensions, annotations, hasErrors } =
    useJsonSchemaAutocompleter(jsonSchema, indexDefinition);

  const isSaveEnabled = useMemo(() => {
    if (hasErrors) {
      return false;
    }

    try {
      const currentParsed = parseShellBSON(indexDefinition);
      const initialParsed = searchIndex.latestDefinition;
      return (
        !isBusy &&
        JSON.stringify(currentParsed) !== JSON.stringify(initialParsed)
      );
    } catch {
      // If current definition is invalid, don't enable save
      return false;
    }
  }, [indexDefinition, searchIndex.latestDefinition, isBusy, hasErrors]);

  // Reset state on unmount
  useEffect(() => {
    return () => onResetUpdateState();
  }, [onResetUpdateState]);

  // Navigate back to list when update succeeds
  useOnAsyncSuccess(isBusy, error, onClose);

  const darkMode = useDarkMode();

  const onChangeText = useIndexDefinitionChange(
    setIndexDefinition,
    onIndexDefinitionEdit
  );

  const onSaveClick = useCallback(() => {
    track('Search Index Edit Submitted', {
      context: 'Edit Search Index Drawer View',
      index_type: searchIndex.type ?? 'search',
    });
    updateIndex({
      name: searchIndex.name,
      definition: parseShellBSON(indexDefinition),
    });
  }, [searchIndex, indexDefinition, updateIndex, track]);

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
        <Body className={overflowWrapStyles}>
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
          data-testid="edit-search-index-drawer-view-cancel-button"
          variant="default"
          onClick={() => {
            track('Search Index Edit Cancelled', {
              context: 'Edit Search Index Drawer View',
              index_type: searchIndex.type ?? 'search',
            });
            onClose();
          }}
        >
          Cancel
        </Button>
        <Tooltip
          trigger={
            <Button
              data-testid="edit-search-index-drawer-view-submit-button"
              variant="primary"
              isLoading={isBusy}
              loadingIndicator={<SpinLoader />}
              disabled={!isSaveEnabled || !isSearchIndexesWritable}
              onClick={onSaveClick}
            >
              Save and Rebuild
            </Button>
          }
          enabled={!isSearchIndexesWritable}
        >
          You currently don&apos;t have permission to edit {indexLabel}es in
          this{' '}
          {!atlasMetadata
            ? 'cluster.'
            : 'project, please contact Project Owner to request the Project Data Access Admin role.'}
        </Tooltip>
      </div>
    </div>
  );
};

const mapState = ({ namespace, searchIndexes, indexesDrawer }: RootState) => {
  const searchIndex = searchIndexes.indexes.find(
    (x) => x.name === indexesDrawer.currentIndexName
  );

  // Should not happen in theory as we navigate to edit view only if index is found
  if (!searchIndex) {
    throw new Error('Search index not found');
  }

  return {
    namespace,
    searchIndex,
    isBusy: searchIndexes.updateIndex.isBusy,
    error: searchIndexes.updateIndex.error,
  };
};

const mapDispatch = {
  onClose: openIndexesListDrawerView,
  onResetUpdateState: updateSearchIndexClosed,
  updateIndex,
  onIndexDefinitionEdit: setIsDirty,
};

export { EditSearchIndexDrawerView };
export default connect(mapState, mapDispatch)(EditSearchIndexDrawerView);
