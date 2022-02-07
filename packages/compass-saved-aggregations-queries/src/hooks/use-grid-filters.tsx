import React, { useState, useMemo } from 'react';
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
import _ from 'lodash';

import type { Item } from '../stores/aggregations-queries-items';

interface SelectState {
  database?: string;
  collection?: string;
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

  const databases = _.uniq(_.map(items, 'database'));

  const selectDatabase = useMemo(() => {
    return (database: string): void => {
      setSelectState({
        database: database ?? undefined,
      });

      const collections = _.uniq(
        _.map(
          _.filter(items, (x) => x.database === database),
          'collection'
        )
      );
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

function filterByText(items: Item[], text: string): Item[] {
  if (!text || text.length === 1) {
    return items;
  }
  const fuse = new Fuse<Item>(items, {
    findAllMatches: true,
    shouldSort: true,
    minMatchCharLength: 2,
    threshold: 0.3,
    ignoreLocation: true,
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
          return ['aggregate', 'aggregation'];
        }

        if (key === 'data') {
          const stages = item.aggregation.pipeline
            .filter((x) => x.stageOperator && x.stage)
            .map((stage) => {
              return {
                [stage.stageOperator]: JSON.parse(stage.stage),
              };
            });
          return JSON.stringify(stages);
        }
      }
      return _.get(item, path);
    },
  });
  return fuse.search(text).map((x) => x.item);
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
