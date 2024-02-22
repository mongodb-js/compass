import {
  Select,
  Option,
  Body,
  spacing,
  css,
  TextInput,
  ComboboxWithCustomOption,
  ComboboxOption,
} from '@mongodb-js/compass-components';
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
  gap: spacing[2],
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
  gap: spacing[2],
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

const getFormValidationError = (formData: TextSearchState): Error | null => {
  if (formData.type === 'fuzzy') {
    if (formData.maxEdits === undefined) {
      return new Error('No max edits provided.');
    }
    if (formData.maxEdits < 1 || formData.maxEdits > 2) {
      return new Error('Max edits must be either 1 or 2.');
    }
  }

  if (formData.path === 'fields' && !formData.fields?.length) {
    return new Error('No fields provided.');
  }

  if (!formData.text) {
    return new Error('No search text provided');
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
    onChange(JSON.stringify(stageValue), getFormValidationError(data));
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
        <Body className={labelStyles}>Perform a</Body>
        <Select
          className={inputStyles}
          allowDeselect={false}
          aria-label={'Select search type'}
          value={formData.type}
          onChange={(value) => onChangeProperty('type', value as SearchType)}
        >
          <Option value="text">text search</Option>
          <Option value="fuzzy">fuzzy search</Option>
        </Select>
        <div className={inputWithLabelStyles}>
          <Body>
            with <span id="maxEdits-input-label">maxEdits</span>
          </Body>
          <TextInput
            type="number"
            aria-labelledby="maxEdits-input-label"
            data-testid="maxEdits-input"
            placeholder="e.g 2"
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
        <Body className={labelStyles}>for all documents where</Body>
        <Select
          className={inputStyles}
          allowDeselect={false}
          aria-label={'Select search path'}
          value={formData.path}
          onChange={(value) => onChangeProperty('path', value as SearchPath)}
        >
          <Option value="fields">field names</Option>
          <Option value="wildcard">any fields</Option>
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
        <Body className={labelStyles}>contains</Body>
        <TextInput
          placeholder={'text'}
          // NOTE: LeafyGreen doesn't support aria-label and only understands "aria-labelledby" and "label".
          aria-labelledby=""
          data-testid="text-search-contains-input"
          aria-label={'text'}
          value={formData.text}
          className={inputStyles}
          onChange={(e) => onChangeProperty('text', e.target.value)}
        />
        <div className={inputWithLabelStyles}>
          <Body>using</Body>
          <ComboboxWithCustomOption
            className={inputStyles}
            aria-label="Select or type a search index"
            placeholder="Select or type a search index"
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
            searchLoadingMessage="Fetching search indexes ..."
            searchErrorMessage={
              'Failed to fetch the search indexes. Type the index name manually.'
            }
            options={indexes.map((x) => ({ value: x.name }))}
            renderOption={(option, index, isCustom) => {
              return (
                <ComboboxOption
                  key={index}
                  value={option.value}
                  displayName={
                    isCustom ? `Index: "${option.value}"` : option.value
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
