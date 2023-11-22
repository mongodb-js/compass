import React, { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import {
  css,
  spacing,
  useId,
  Select,
  Option,
  TextInput,
} from '@mongodb-js/compass-components';
import { useLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

import type { Item } from '../stores/aggregations-queries-items';

interface SelectState {
  database?: string;
  collection?: string;
}

interface FilterItem {
  score: number;
  item: Item;
}

const selectContainer = css({
  display: 'flex',
  flexDirection: 'row',
});

const selectStyles = css({
  marginRight: spacing[2],
  width: `calc(16ch + ${spacing[6]}px)`,
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

  return (
    <Select
      disabled={options.length === 0}
      id={controlId}
      aria-labelledby={labelId}
      allowDeselect={true}
      placeholder={placeholder}
      className={selectStyles}
      onChange={onSelect}
      value={value}
      name={value}
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
  const { track } = useLoggerAndTelemetry('COMPASS-MY-QUERIES-UI');
  const [search, setSearch] = useState('');
  const searchControls = useMemo(() => {
    return (
      <TextInput
        className={searchInputStyles}
        aria-label="Search"
        type="search"
        placeholder="Search"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
        }}
        onBlur={() => {
          if (search.length > 0) {
            track('My Queries Search');
          }
        }}
        spellCheck={false}
      />
    );
  }, [search, track]);

  return [searchControls, search];
}

function useSelectFilter(items: Item[]): [React.ReactElement, SelectState] {
  const [selectedDatabase, setSelectedDatabase] = useState<
    string | undefined
  >();
  const [selectedCollection, setSelectedCollection] = useState<
    string | undefined
  >();
  const [collections, setCollections] = useState<string[]>([]);

  const databases = items
    .map((x) => x.database)
    .filter((x, i, arr) => arr.indexOf(x) === i);

  const onDatabaseSelect = useMemo(() => {
    return (database: string): void => {
      setSelectedDatabase(database);
      setSelectedCollection(undefined);

      const collections = items
        .filter((x) => x.database === database)
        .map((x) => x.collection)
        .filter((x, i, arr) => arr.indexOf(x) === i);

      setCollections(collections);
    };
  }, [items]);

  const onCollectionSelect = useMemo(() => {
    return (collection: string): void => {
      setSelectedCollection(collection);
    };
  }, []);

  const selectControls = useMemo(() => {
    return (
      <div className={selectContainer}>
        <FilterSelect
          options={databases}
          placeholder={'All databases'}
          onSelect={onDatabaseSelect}
          value={selectedDatabase ?? ''}
        />
        <FilterSelect
          options={collections}
          placeholder={'All collections'}
          onSelect={onCollectionSelect}
          value={selectedCollection ?? ''}
        />
      </div>
    );
  }, [
    databases,
    onDatabaseSelect,
    selectedDatabase,
    collections,
    onCollectionSelect,
    selectedCollection,
  ]);

  const selectState = useMemo(() => {
    return {
      database: selectedDatabase,
      collection: selectedCollection,
    };
  }, [selectedDatabase, selectedCollection]);

  return [selectControls, selectState];
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

export function filterByText(items: Item[], text: string): FilterItem[] {
  if (!text || text.length === 1) {
    return items.map((item) => ({ item, score: 1 }));
  }
  const fuse = new Fuse<Item>(items, {
    findAllMatches: true,
    shouldSort: false,
    minMatchCharLength: 2,
    threshold: 0.3,
    ignoreLocation: true,
    includeScore: true,
    keys: [
      {
        name: 'name',
        weight: 4,
      },
      {
        name: 'namespace',
        weight: 3,
      },
      {
        name: 'tags',
        weight: 2,
      },
      {
        name: 'data',
        weight: 1,
      },
    ],
    getFn: (item: Item, path) => {
      // The `path` here can only be names from the `keys` configuration option
      // so it is safe to assert the type here. Additionally the argument value
      // is typed by the library as string | string[]. Even though the library
      // seem to always return an array, we will handle it as if we are not sure
      // excatly what is passed here
      const key = (Array.isArray(path) ? path[0] : path) as
        | 'name'
        | 'namespace'
        | 'tags'
        | 'data';

      if (key === 'namespace') {
        return `${item.database}.${item.collection}`;
      }

      if (key === 'tags') {
        if (item.type === 'query') {
          return ['find', 'query'];
        } else {
          return ['aggregate', 'aggregation', 'pipeline'];
        }
      }

      if (key === 'data') {
        if (item.type === 'query' || item.type === 'updatemany') {
          return JSON.stringify({
            filter: item.query.filter,
          });
        } else if (item.type === 'aggregation') {
          return item.aggregation.pipelineText;
        } else {
          return [];
        }
      }

      return item[key];
    },
  });
  return fuse.search(text).map((x) => ({ item: x.item, score: x.score ?? 0 }));
}

function filterByConditions(items: FilterItem[], conditions: SelectState) {
  const filterConditions = { ...conditions };
  for (const key in filterConditions) {
    if (!filterConditions[key as keyof SelectState]) {
      delete filterConditions[key as keyof SelectState];
    }
  }
  return [...items].filter((item) =>
    filterItemByConditions(item.item, filterConditions)
  );
}

export function useGridFilters(items: Item[]): {
  controls: React.ReactElement;
  conditions: SelectState;
  search: string;
} {
  const [selectControls, conditions] = useSelectFilter(items);
  const [searchControls, search] = useSearchFilter();

  const controls = useMemo(() => {
    return (
      <div className={filterStyles}>
        {searchControls}
        {selectControls}
      </div>
    );
  }, [searchControls, selectControls]);

  return {
    controls,
    conditions,
    search,
  };
}

export function useFilteredItems(
  items: Item[],
  conditions: SelectState,
  search: string
): FilterItem[] {
  const filteredItems: FilterItem[] = filterByText(items, search);
  return filterByConditions(filteredItems, conditions);
}
