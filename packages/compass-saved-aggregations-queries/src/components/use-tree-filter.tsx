import React, { useState, useMemo } from 'react';
import { useId } from '@react-aria/utils';
import {
  css,
  spacing,
  Select,
  Option,
  cx,
  TextInput,
} from '@mongodb-js/compass-components';

export interface Tree {
  value: string;
  items?: Tree[];
}

export interface TreeState {
  [key: string]: string | undefined;
}

const selectContainer = css({
  display: 'flex',
  flexDirection: 'row',
});

const selectStyles = css({
  marginRight: spacing[2],
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

export function useTreeFilter(tree: Tree[]): [React.ReactElement, TreeState] {
  const [treeState, setTreeState] = useState<TreeState>({});

  const [collections, setCollections] = useState<Tree[]>([]);

  const selectDatabase = useMemo(() => {
    return (database: string): void => {
      setTreeState({
        database: database ?? undefined,
        collection: undefined,
      });
      const items = tree.find((x) => x.value === database)?.items;
      setCollections(items || []);
    };
  }, [tree]);

  const selectCollection = useMemo(() => {
    return (collection: string): void => {
      setTreeState({
        ...treeState,
        collection: collection ?? undefined,
      });
    };
  }, [treeState]);

  const treeControls = useMemo(() => {
    return (
      <div className={selectContainer}>
        <RenderFilterSelect
          items={tree}
          placeHolder={'All databases'}
          onSelect={selectDatabase}
          defaultValue={treeState['database']}
        />
        <RenderFilterSelect
          items={collections}
          placeHolder={'All collections'}
          onSelect={selectCollection}
          defaultValue={treeState['collection']}
        />
      </div>
    );
  }, [selectDatabase, tree, collections, selectCollection, treeState]);

  return [treeControls, treeState];
}

export function useTextFilter(): [React.ReactElement, string] {
  const [search, setSearch] = useState('');

  const treeControls = useMemo(() => {
    return (
      <TextInput
        className={searchInputStyles}
        aria-label="Search"
        type="search"
        placeholder="Search"
        value={search}
        defaultValue={search}
        onChange={(e) => setSearch(e.target.value)}
        spellCheck={false}
      />
    );
  }, [search]);

  return [treeControls, search];
}