import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useId } from '@react-aria/utils';
import Fuse from 'fuse.js';
import {
  css,
  spacing,
  Select,
  Option,
  cx,
  TextInput,
} from '@mongodb-js/compass-components';

import type { Item } from '../stores/aggregations-queries-items';

interface SelectState {
  database?: string;
  collection?: string;
}

interface SearchableItem {
  /**
   * Information about the item (name, namespace, timeseries?)
   */
  meta: string[];
  /**
   * Possible keywords user can use to search by,
   * e.g a query can also be searched by find.
   */
  tags: string[];
  /**
   * The actual query/agregation information
   */
  data: string;
}

const selectContainer = css({
  display: 'flex',
  flexDirection: 'row',
});

const selectStyles = css({
  marginRight: spacing[2],
});

const filterStyles = css({
  display: 'flex',
});

const searchInputStyles = css({
  width: '300px',
  marginRight: spacing[2],
});

const FilterSelect: React.FunctionComponent<{
  options: string[];
  onSelect: (value: string) => void;
  value?: string;
  placeholder?: string;
}> = ({ options, onSelect, value, placeholder }) => {
  const labelId = useId();
  const controlId = useId();
  const longestLabel = Math.max(
    placeholder?.length || 0,
    ...options.map((item) => item.length)
  );
  return (
    <Select
      disabled={options.length === 0}
      id={controlId}
      aria-labelledby={labelId}
      allowDeselect={true}
      placeholder={placeholder}
      className={cx(
        selectStyles,
        css({ minWidth: `calc(${longestLabel}ch + ${spacing[6]}px)` })
      )}
      onChange={onSelect}
      value={value}
    >
      {options.map((option) => (
        <Option key={option} value={option}>
          {option}
        </Option>
      ))}
    </Select>
  );
};

function useSearchFilter(): [React.ReactElement, string] {
  const ref = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  useEffect(() => {
    ref.current?.focus();
  }, [search]);
  const searchControls = useMemo(() => {
    return (
      <TextInput
        ref={ref}
        className={searchInputStyles}
        aria-label="Search"
        type="search"
        placeholder="Search"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
        }}
        spellCheck={false}
      />
    );
  }, [search]);

  return [searchControls, search];
}

function useSelectFilter(items: Item[]): [React.ReactElement, SelectState] {
  const [selectState, setSelectState] = useState<SelectState>({});
  const [collections, setCollections] = useState<string[]>([]);

  const databases = items
    .map((x) => x.database)
    .filter((x, i, arr) => arr.indexOf(x) === i);

  const selectDatabase = useMemo(() => {
    return (database: string): void => {
      setSelectState({
        database: database ?? undefined,
      });
      const collections = items
        .filter((x) => x.database === database)
        .map((x) => x.collection)
        .filter((x, i, arr) => arr.indexOf(x) === i);
      setCollections(collections);
    };
  }, [items]);

  const selectCollection = useMemo(() => {
    return (collection: string): void => {
      setSelectState({
        ...selectState,
        collection: collection ?? undefined,
      });
    };
  }, [selectState]);

  const treeControls = useMemo(() => {
    return (
      <div className={selectContainer}>
        <FilterSelect
          options={databases}
          placeholder={'All databases'}
          onSelect={selectDatabase}
          value={selectState.database}
        />
        <FilterSelect
          options={collections}
          placeholder={'All collections'}
          onSelect={selectCollection}
          value={selectState.collection}
        />
      </div>
    );
  }, [databases, selectDatabase, selectState, collections, selectCollection]);

  return [treeControls, selectState];
}

function filterItemByConditions(item: Item, conditions: SelectState): boolean {
  if (Object.keys(conditions).length === 0) {
    return true;
  }
  let shouldReturnItem = true;
  for (const key in conditions) {
    if (
      item[key as keyof SelectState] !== conditions[key as keyof SelectState]
    ) {
      shouldReturnItem = false;
    }
  }
  return shouldReturnItem;
}

function mapItemToSearchable(item: Item): SearchableItem {
  const searchable: SearchableItem = {
    meta: [item.name],
    tags: [],
    data: '',
  };

  if (item.type === 'aggregation') {
    const stages = item.aggregation.pipeline
      .filter((x) => x.stageOperator && x.stage)
      .map((stage) => {
        return {
          [stage.stageOperator]: JSON.parse(stage.stage),
        };
      });

    searchable.meta.push(item.aggregation.namespace);
    searchable.meta.push(item.aggregation.env ?? '');
    searchable.meta.push(item.aggregation.collationString ?? '');
    searchable.meta.push(item.aggregation.isTimeSeries ? 'timeseries' : '');
    searchable['tags'] = ['aggregate', 'aggregation'];
    searchable['data'] = JSON.stringify(stages);
  } else {
    searchable.meta.push(item.query._ns);
    searchable['tags'] = ['find', 'query'];
    searchable['data'] = JSON.stringify({
      filter: item.query.filter,
      project: item.query.project,
      sort: item.query.sort,
      skip: item.query.skip,
      limit: item.query.limit,
      collation: item.query.collation,
    });
  }
  return searchable;
}

function filterByText(items: Item[], text: string): Item[] {
  if (!text || text.length === 1) {
    return items;
  }
  const fuse = new Fuse<SearchableItem>(items.map(mapItemToSearchable), {
    findAllMatches: true,
    shouldSort: true,
    minMatchCharLength: 2,
    threshold: 0.3,
    ignoreLocation: true,
    keys: ['meta', 'tags', 'data'],
  });
  const searchedIndexes = fuse.search(text).map((x) => x.refIndex);
  return items.filter((_x, index) => searchedIndexes.includes(index));
}

export function useGridFilters(
  items: Item[]
): [React.ReactElement, SelectState, string] {
  const [selectControls, conditions] = useSelectFilter(items);
  const [searchControls, search] = useSearchFilter();

  const filterControls = useMemo(() => {
    return (
      <div className={filterStyles}>
        {searchControls}
        {selectControls}
      </div>
    );
  }, [searchControls, selectControls]);

  return [filterControls, conditions, search];
}

export function useFilteredItems(
  items: Item[],
  conditions: SelectState,
  search: string
): Item[] {
  const filterConditions = { ...conditions };
  for (const key in filterConditions) {
    if (!filterConditions[key as keyof SelectState]) {
      delete filterConditions[key as keyof SelectState];
    }
  }
  const filteredItems = [...items].filter((item) =>
    filterItemByConditions(item, filterConditions)
  );
  return filterByText(filteredItems, search);
}