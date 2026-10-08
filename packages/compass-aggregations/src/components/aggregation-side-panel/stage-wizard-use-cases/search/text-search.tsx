import { translateEnglish } from '../../../../utils/i18n';
import {
  Select,
  Option,
  Body,
  spacing,
  css,
  TextInput,
  ComboboxWithCustomOption,
  ComboboxOption,
  useTranslation,
} from '@mongodb-js/compass-components';
import type { TranslateFn } from '@mongodb-js/compass-components';
import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { type Document } from 'mongodb';
import type { SearchIndex } from 'mongodb-data-service';

import type { RootState } from '../../../../modules';
import type { WizardComponentProps } from '..';
import { FieldCombobox } from '../field-combobox';
import {
  type SearchIndexesStatus,
  fetchIndexes,
} from '../../../../modules/search-indexes';

type SearchType = 'text' | 'fuzzy';
type SearchPath = 'fields' | 'wildcard';

type TextSearchState = {
  type: SearchType;
  path: SearchPath;
  maxEdits?: number;
  fields?: string[];
  text: string;
  indexName: string;
};

const containerStyles = css({
  gap: spacing[200],
  width: '100%',
  maxWidth: '800px',
  display: 'grid',
  gridTemplateColumns: '150px 1fr 1fr',
  alignItems: 'center',
});

const rowStyles = css({
  display: 'contents',
});

const inputWithLabelStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
});

const labelStyles = css({
  textAlign: 'right',
});

const inputStyles = css({ flex: 1 });

const mapTextSearchDataToStageValue = (formData: TextSearchState): Document => {
  return {
    index: formData.indexName || 'default',
    text: {
      query: formData.text,
      path: formData.path === 'wildcard' ? { wildcard: '*' } : formData.fields,
      ...(formData.type === 'fuzzy'
        ? { fuzzy: { maxEdits: formData.maxEdits } }
        : {}),
    },
  };
};

const getFormValidationError = (
  formData: TextSearchState,
  t: TranslateFn = translateEnglish
): Error | null => {
  if (formData.type === 'fuzzy') {
    if (formData.maxEdits === undefined) {
      return new Error(
        t('aggregations.wizard.search.noMaxEdits', 'No max edits provided.')
      );
    }
    if (formData.maxEdits < 1 || formData.maxEdits > 2) {
      return new Error(
        t(
          'aggregations.wizard.search.maxEditsRange',
          'Max edits must be either 1 or 2.'
        )
      );
    }
  }

  if (formData.path === 'fields' && !formData.fields?.length) {
    return new Error(
      t('aggregations.wizard.search.noFields', 'No fields provided.')
    );
  }

  if (!formData.text) {
    return new Error(
      t('aggregations.wizard.search.noText', 'No search text provided')
    );
  }

  return null;
};

export const TextSearch = ({
  fields,
  onChange,
  indexes,
  indexesStatus,
  onFetchIndexes,
}: WizardComponentProps & {
  indexes: SearchIndex[];
  indexesStatus: SearchIndexesStatus;
  onFetchIndexes: () => void;
}) => {
  const t = useTranslation();
  const [formData, setFormData] = useState<TextSearchState>({
    type: 'text',
    path: 'fields',
    maxEdits: 2,
    text: '',
    indexName: '',
  });

  useEffect(() => {
    onFetchIndexes();
  }, [onFetchIndexes]);

  const onSetFormData = (data: TextSearchState) => {
    const stageValue = mapTextSearchDataToStageValue(data);
    onChange(JSON.stringify(stageValue), getFormValidationError(data, t));
    setFormData(data);
  };

  const onChangeProperty = <T extends keyof TextSearchState>(
    property: T,
    value: TextSearchState[T]
  ) => {
    const newFormData = {
      ...formData,
      [property]: value,
    };
    onSetFormData(newFormData);
  };

  return (
    <div className={containerStyles}>
      <div className={rowStyles}>
        <Body className={labelStyles}>
          {t('aggregations.wizard.search.performA', 'Perform a')}
        </Body>
        <Select
          className={inputStyles}
          allowDeselect={false}
          aria-label={t(
            'aggregations.wizard.search.selectType',
            'Select search type'
          )}
          value={formData.type}
          onChange={(value) => onChangeProperty('type', value)}
        >
          <Option value="text">
            {t('aggregations.wizard.search.textSearch', 'text search')}
          </Option>
          <Option value="fuzzy">
            {t('aggregations.wizard.search.fuzzySearch', 'fuzzy search')}
          </Option>
        </Select>
        <div className={inputWithLabelStyles}>
          <Body>
            {t('aggregations.wizard.search.with', 'with')}{' '}
            <span id="maxEdits-input-label">maxEdits</span>
          </Body>
          <TextInput
            type="number"
            aria-labelledby="maxEdits-input-label"
            data-testid="maxEdits-input"
            placeholder={t('aggregations.wizard.search.example', 'e.g 2')}
            className={inputStyles}
            value={formData.maxEdits?.toString()}
            min={1}
            max={2}
            disabled={formData.type !== 'fuzzy'}
            onChange={(e) =>
              onChangeProperty('maxEdits', Number(e.target.value))
            }
          />
        </div>
      </div>
      <div className={rowStyles}>
        <Body className={labelStyles}>
          {t(
            'aggregations.wizard.search.forAllDocuments',
            'for all documents where'
          )}
        </Body>
        <Select
          className={inputStyles}
          allowDeselect={false}
          aria-label={t(
            'aggregations.wizard.search.selectPath',
            'Select search path'
          )}
          value={formData.path}
          onChange={(value) => onChangeProperty('path', value)}
        >
          <Option value="fields">
            {t('aggregations.wizard.search.fieldNames', 'field names')}
          </Option>
          <Option value="wildcard">
            {t('aggregations.wizard.search.anyFields', 'any fields')}
          </Option>
        </Select>
        <FieldCombobox
          className={inputStyles}
          value={formData.fields}
          onChange={(val: string[]) => onChangeProperty('fields', val)}
          fields={fields}
          multiselect={true}
          disabled={formData.path === 'wildcard'}
        />
      </div>
      <div className={rowStyles}>
        <Body className={labelStyles}>
          {t('aggregations.wizard.search.contains', 'contains')}
        </Body>
        <TextInput
          placeholder={t('aggregations.wizard.search.text', 'text')}
          // NOTE: LeafyGreen doesn't support aria-label and only understands "aria-labelledby" and "label".
          aria-labelledby=""
          data-testid="text-search-contains-input"
          aria-label={t('aggregations.wizard.search.text', 'text')}
          value={formData.text}
          className={inputStyles}
          onChange={(e) => onChangeProperty('text', e.target.value)}
        />
        <div className={inputWithLabelStyles}>
          <Body>{t('aggregations.wizard.search.using', 'using')}</Body>
          <ComboboxWithCustomOption
            className={inputStyles}
            aria-label={t(
              'aggregations.wizard.search.selectIndex',
              'Select or type a search index'
            )}
            placeholder={t(
              'aggregations.wizard.search.selectIndex',
              'Select or type a search index'
            )}
            size="default"
            clearable={false}
            onChange={(value: string | null) =>
              onChangeProperty('indexName', value ?? '')
            }
            searchState={(() => {
              if (indexesStatus === 'LOADING') {
                return 'loading';
              }
              if (indexesStatus === 'ERROR') {
                return 'error';
              }
              return 'unset';
            })()}
            searchLoadingMessage={t(
              'aggregations.wizard.search.fetchingIndexes',
              'Fetching search indexes ...'
            )}
            searchErrorMessage={t(
              'aggregations.wizard.search.fetchIndexesFailed',
              'Failed to fetch the search indexes. Type the index name manually.'
            )}
            options={indexes.map((x) => ({ value: x.name }))}
            renderOption={(option, index, isCustom) => {
              return (
                <ComboboxOption
                  key={index}
                  value={option.value}
                  displayName={
                    isCustom
                      ? t(
                          'aggregations.wizard.search.customIndex',
                          'Index: "{name}"',
                          { name: option.value }
                        )
                      : option.value
                  }
                />
              );
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default connect(
  (state: RootState) => ({
    indexes: state.searchIndexes.indexes,
    indexesStatus: state.searchIndexes.status,
  }),
  {
    onFetchIndexes: fetchIndexes,
  }
)(TextSearch);
