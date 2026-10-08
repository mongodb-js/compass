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
  useTranslation,
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
import { getSearchIndexLabels } from '../../utils/search-index-labels';
import { parseShellBSON } from '../../utils/parse-shell-bson';
import {
  ATLAS_SEARCH_TEMPLATES,
  ATLAS_VECTOR_SEARCH_TEMPLATE,
  ATLAS_VECTOR_SEARCH_AUTO_EMBED_TEMPLATE,
} from '@mongodb-js/mongodb-constants';
import type { SearchTemplate } from '@mongodb-js/mongodb-constants';
import type { SearchIndex } from 'mongodb-data-service';
import {
  VectorSearchIndexTemplateDropdown,
  type VectorIndexTemplateChoice,
} from '../search-index-template-dropdown/vector-search-index-template-dropdown';
import { selectReadWriteAccess } from '../../utils/indexes-read-write-access';
import {
  useConnectionInfo,
  useConnectionInfoRef,
} from '@mongodb-js/compass-connections/provider';
import { usePreferences } from 'compass-preferences-model/provider';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { useJsonSchema } from '../../utils/use-json-schema';

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
  const t = useTranslation();
  const connectionInfoRef = useConnectionInfoRef();

  useEffect(() => {
    track(
      'Screen',
      { name: 'create_search_index_drawer' },
      connectionInfoRef.current
    );
  }, [track, connectionInfoRef]);

  const editorRef = useRef<EditorRef>(null);

  const {
    readOnly,
    readWrite,
    enableAtlasSearchIndexes,
    enableAutoEmbeddingPublicPreview,
    enableAutoEmbeddingGaRelease,
    enableIndexesManagement,
  } = usePreferences([
    'readOnly',
    'readWrite',
    'enableAtlasSearchIndexes',
    'enableAutoEmbeddingPublicPreview',
    'enableAutoEmbeddingGaRelease',
    'enableIndexesManagement',
  ]);

  // Public preview is required so the schema variant picked by use-json-schema
  // accepts autoEmbed; GA scopes the drawer to the GA rollout.
  const isAutoEmbedEnabled =
    enableAutoEmbeddingPublicPreview && enableAutoEmbeddingGaRelease;
  const defaultVectorTemplateChoice: VectorIndexTemplateChoice =
    isAutoEmbedEnabled ? 'autoEmbed' : 'bringYourOwn';

  const [vectorTemplateChoice, setVectorTemplateChoice] =
    useState<VectorIndexTemplateChoice>(defaultVectorTemplateChoice);

  const [indexDefinition, setIndexDefinition] = useState(
    normalizeSnippet(
      currentIndexType === 'vectorSearch'
        ? defaultVectorTemplateChoice === 'autoEmbed'
          ? ATLAS_VECTOR_SEARCH_AUTO_EMBED_TEMPLATE.snippet
          : ATLAS_VECTOR_SEARCH_TEMPLATE.snippet
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
  const { isSearchIndexesWritable } = useSelector(
    selectReadWriteAccess({
      readOnly,
      readWrite,
      enableAtlasSearchIndexes,
      enableSearchActivationProgramP1: true, // This component is only rendered if the user is in the variant
      enableIndexesManagement,
    }),
    shallowEqual
  );

  // Use the JSON schema autocomplete hook for validation and autocomplete
  const jsonSchema = useJsonSchema(currentIndexType);
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

  const onVectorTemplateChoice = useCallback(
    (choice: VectorIndexTemplateChoice, template: SearchTemplate) => {
      setVectorTemplateChoice(choice);
      setIndexDefinition(normalizeSnippet(template.snippet));
      onIndexDefinitionEdit(true);
    },
    [onIndexDefinitionEdit]
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

  const {
    label: indexLabel,
    lowerCase: indexLabelLowerCase,
    plural: indexLabelPlural,
  } = getSearchIndexLabels(t, currentIndexType === 'vectorSearch');

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
          {t(
            'indexes.searchIndexForm.createFor',
            'Create {indexLabel} for {namespace}',
            { indexLabel, namespace }
          )}
        </Subtitle>
        <Body>
          {currentIndexType === 'search'
            ? t(
                'indexes.searchIndexForm.searchTagline',
                'Full-text search for relevance-based app features.'
              )
            : t(
                'indexes.searchIndexForm.vectorTagline',
                'For semantic search and AI applications.'
              )}
        </Body>
        <TextInput
          data-testid="create-search-index-drawer-view-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          label={t('indexes.searchIndexForm.indexName', 'Index Name')}
          description={t(
            'indexes.searchIndexForm.nameDescription',
            'Give your {indexLabel} a name for easy reference',
            { indexLabel: indexLabelLowerCase }
          )}
          state={name === '' ? 'error' : 'none'}
          errorMessage={
            name === ''
              ? t(
                  'indexes.createSearchIndex.nameRequired',
                  'Please enter the name of the index.'
                )
              : ''
          }
          disabled={!isSearchIndexesWritable}
        />
        <Body>
          {t(
            'indexes.searchIndexForm.defaultConfiguration',
            'By default, your {indexLabel} will have the following configurations. We recommend starting with this and refining it later if you need to.',
            { indexLabel: indexLabelLowerCase }
          )}
        </Body>
        {currentIndexType === 'vectorSearch' && isAutoEmbedEnabled && (
          <VectorSearchIndexTemplateDropdown
            value={vectorTemplateChoice}
            tooltip={t(
              'indexes.searchIndexForm.templateTooltip',
              'Selecting a new template will replace your existing index definition in the code editor.'
            )}
            onTemplateChoice={onVectorTemplateChoice}
            disabled={!isSearchIndexesWritable}
          />
        )}
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
          {t('indexes.searchIndexForm.cancel', 'Cancel')}
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
              {t('indexes.searchIndexForm.create', 'Create {indexLabel}', {
                indexLabel,
              })}
            </Button>
          }
          enabled={!isSearchIndexesWritable}
        >
          {!atlasMetadata
            ? t(
                'indexes.searchIndexForm.noPermissionCreateCluster',
                "You currently don't have permission to create {indexLabel} in this cluster.",
                { indexLabel: indexLabelPlural }
              )
            : t(
                'indexes.searchIndexForm.noPermissionCreateProject',
                "You currently don't have permission to create {indexLabel} in this project, please contact Project Owner to request the Project Data Access Admin role.",
                { indexLabel: indexLabelPlural }
              )}
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
