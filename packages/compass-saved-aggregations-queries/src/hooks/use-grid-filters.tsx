import React, { useState, useMemo } from 'react';
import { useId } from '@react-aria/utils';
import Fuse from 'fuse.js';
import {
  css,
  spacing,
  Select,
  Option,
  TextInput,
} from '@mongodb-js/compass-components';

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

  const selectControls = useMemo(() => {
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
      const key = Array.isArray(path) ? path[0] : path;
      if (key === 'namespace') {
        return `${item.database}.${item.collection}`;
      }

      if (item.type === 'query') {
        if (key === 'tags') {
          return ['find', 'query'];
        }
        if (key === 'data') {
          return JSON.stringify({
            filter: item.query.filter,
          });
        }
      }

      if (item.type === 'aggregation') {
        if (key === 'tags') {
          return ['aggregate', 'aggregation', 'pipeline'];
        }

        if (key === 'data') {
          const stages = item.aggregation.pipeline
            .filter((p) => p.stageOperator && p.stage)
            .map((p) => `${p.stageOperator}: ${p.stage}`)
            .join(' ');
          return JSON.stringify(stages);
        }
      }

      return item[key as keyof Item] as any;
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
