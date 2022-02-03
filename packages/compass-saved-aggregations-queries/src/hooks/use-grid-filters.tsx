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

interface Tree {
  value: string;
  items?: Tree[];
}

interface SelectState {
  database?: string;
  collection?: string;
}

interface SearchableItem {
  meta: string[];
  tags: string[];
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

const RenderFilterSelect = ({
  items,
  onSelect,
  defaultValue,
  placeHolder = 'Select',
}: {
  items: Pick<Tree, 'value'>[];
  onSelect: (value: string) => void;
  defaultValue?: string;
  placeHolder?: string;
}) => {
  const labelId = useId();
  const controlId = useId();
  const longestLabel = Math.max(
    placeHolder.length,
    ...items.map((item) => item.value.length)
  );
  return (
    <Select
      disabled={items.length === 0}
      id={controlId}
      aria-labelledby={labelId}
      allowDeselect={true}
      placeholder={placeHolder}
      className={cx(
        selectStyles,
        css({ minWidth: `calc(${longestLabel}ch + ${spacing[6]}px)` })
      )}
      onChange={onSelect}
      defaultValue={defaultValue}
    >
      {items.map((item) => (
        <Option key={item.value} value={item.value}>
          {item.value}
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

function useSelectFilter(tree: Tree[]): [React.ReactElement, SelectState] {
  const [selectState, setSelectState] = useState<SelectState>({});
  const [collections, setCollections] = useState<Tree[]>([]);

  const selectDatabase = useMemo(() => {
    return (database: string): void => {
      setSelectState({
        database: database ?? undefined,
      });
      const items = tree.find((x) => x.value === database)?.items;
      setCollections(items || []);
    };
  }, [tree]);

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
        <RenderFilterSelect
          items={tree}
          placeHolder={'All databases'}
          onSelect={selectDatabase}
          defaultValue={selectState.database}
        />
        <RenderFilterSelect
          items={collections}
          placeHolder={'All collections'}
          onSelect={selectCollection}
          defaultValue={selectState.collection}
        />
      </div>
    );
  }, [selectDatabase, tree, collections, selectCollection, selectState]);

  return [treeControls, selectState];
}

function convertItemsToTree(items: Item[]): Tree[] {
  const dbCollectionMap: Record<string, string[]> = {};
  const tree = [];
  items.forEach((item) => {
    if (!dbCollectionMap[item.database]) {
      dbCollectionMap[item.database] = [];
    }
    dbCollectionMap[item.database].push(item.collection);
  });
  for (const database in dbCollectionMap) {
    const collections = dbCollectionMap[database]
      .filter((collection, index, arr) => arr.indexOf(collection) === index)
      .map((collection) => ({
        value: collection,
      }));

    tree.push({
      value: database,
      items: collections,
    });
  }
  return tree;
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
  const tree: Tree[] = convertItemsToTree(items);
  const [selectControls, conditions] = useSelectFilter(tree);
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