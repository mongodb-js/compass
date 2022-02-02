import React, { useState, useMemo } from 'react';
import { useId } from '@react-aria/utils';
import {
  css,
  spacing,
  Select,
  Option,
  cx,
} from '@mongodb-js/compass-components';

export interface Tree {
  propName: string;
  value: string;
  items?: Tree[];
}

interface TreeState {
  [key: string]: string | null;
}

const selectContainer = css({
  display: 'flex',
  flexDirection: 'row',
});

const RenderFilterSelect = ({
  items,
  onSelect,
  placeHolder = 'Select',
}: {
  items: Pick<Tree, 'value'>[];
  onSelect: (value: string) => void;
  placeHolder?: string;
}) => {
  const labelId = useId();
  const controlId = useId();
  return (
    <Select
      disabled={items.length === 0}
      id={controlId}
      aria-labelledby={labelId}
      allowDeselect={true}
      placeholder={placeHolder}
      className={cx(
        css({
          width: '200px',
          marginRight: spacing[2],
        })
      )}
      onChange={onSelect}
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
  const [treeState, setTreeState] = useState<TreeState>({
    database: null,
    collection: null,
  });

  const [collections, setCollections] = useState<Tree[]>([]);

  const selectDatabase = useMemo(() => {
    return (database: string): void => {
      if (!database) {
        setTreeState({
          database: null,
          collection: null,
        });
        setCollections([]);
        return;
      }
      setTreeState({
        database,
        collection: null,
      });
      const items = tree.find((x) => x.value === database)?.items;
      setCollections(items || []);
    };
  }, [tree]);

  const selectCollection = useMemo(() => {
    return (collection: string): void => {
      if (!collection) {
        setTreeState({
          ...treeState,
          collection: null,
        });
        return;
      }
      setTreeState({
        ...treeState,
        collection,
      });
      return;
    };
  }, [treeState]);

  const treeControls = useMemo(() => {
    return (
      <div className={selectContainer}>
        <RenderFilterSelect
          items={tree}
          placeHolder={'Select database'}
          onSelect={selectDatabase}
        />
        <RenderFilterSelect
          items={collections}
          placeHolder={'Select collection'}
          onSelect={selectCollection}
        />
      </div>
    );
  }, [selectDatabase, tree, collections, selectCollection]);

  return [treeControls, treeState];
}

export function useFilteredItems<T extends Record<string, unknown>>(
  items: T[],
  treeState: TreeState
): T[] {
  return useMemo(() => {
    const filterConditions = { ...treeState };
    for (const key in filterConditions) {
      if (!filterConditions[key]) {
        delete filterConditions[key];
      }
    }
    return [...items].filter((item) => {
      let shouldReturnItem = true;
      for (const key in filterConditions) {
        if (item[key] !== filterConditions[key]) {
          shouldReturnItem = false;
        }
      }
      return shouldReturnItem;
    });
  }, [items, treeState]);
}
