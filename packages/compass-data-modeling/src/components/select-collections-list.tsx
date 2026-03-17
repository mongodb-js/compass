import {
  Body,
  css,
  FormFieldContainer,
  SearchInput,
  SelectList,
  spacing,
  SpinLoaderWithLabel,
  WarningSummary,
} from '@mongodb-js/compass-components';
import React, { useCallback, useMemo, useState } from 'react';

const loadingStyles = css({
  textAlign: 'center',
  marginTop: spacing[1800],
  marginBottom: spacing[1800],
});

const errorStyles = css({
  marginTop: spacing[600],
  marginBottom: spacing[600],
});

const collectionListStyles = css({
  height: 200,
  overflow: 'auto',
});

type SelectCollectionsListProps = {
  collections: string[];
  selectedCollections: string[];
  disabledCollections?: string[];
  isFetchingCollections: boolean;
  error?: Error;
  onCollectionsSelect: (colls: string[]) => void;
};

type SelectCollectionItem = {
  id: string;
  selected: boolean;
  disabled?: boolean;
};

export const SelectCollectionsList: React.FunctionComponent<
  SelectCollectionsListProps
> = ({
  collections,
  selectedCollections,
  disabledCollections = [],
  isFetchingCollections,
  error,
  onCollectionsSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCollections = useMemo(() => {
    try {
      return collections.filter((x) =>
        x.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch {
      return collections;
    }
  }, [collections, searchTerm]);

  const onChangeSelection = useCallback(
    (items: SelectCollectionItem[]) => {
      // When a user is searching, less collections are shown to the user
      // and we need to keep existing selected collections selected.
      const currentSelectedItems = selectedCollections.filter((collName) => {
        if (disabledCollections.includes(collName)) {
          return false;
        }
        const item = items.find((x) => x.id === collName);
        // The already selected item was not shown to the user (using search),
        // and we have to keep it selected.
        return item ? item.selected : true;
      });

      const newSelectedItems = items
        .filter((item) => {
          return item.selected && !disabledCollections.includes(item.id);
        })
        .map((item) => {
          return item.id;
        });
      onCollectionsSelect(
        Array.from(new Set([...newSelectedItems, ...currentSelectedItems]))
      );
    },
    [selectedCollections, disabledCollections, onCollectionsSelect]
  );

  if (isFetchingCollections) {
    return (
      <div className={loadingStyles}>
        <SpinLoaderWithLabel progressText="">
          Fetching collections …
        </SpinLoaderWithLabel>
      </div>
    );
  }

  if (error) {
    return (
      <div className={errorStyles}>
        <WarningSummary warnings={[error.message]} />
      </div>
    );
  }
  return (
    <>
      <FormFieldContainer>
        <SearchInput
          aria-label="Search collections"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
        />
      </FormFieldContainer>
      {collections.length === 0 ? (
        <Body>This database has no collections.</Body>
      ) : filteredCollections.length === 0 ? (
        <Body>No collections match your search.</Body>
      ) : (
        <SelectList
          className={collectionListStyles}
          items={filteredCollections.map((collName): SelectCollectionItem => {
            return {
              id: collName,
              selected: selectedCollections.includes(collName),
              disabled: disabledCollections.includes(collName),
            };
          })}
          label={{ displayLabelKey: 'id', name: 'Collection Name' }}
          onChange={onChangeSelection}
        />
      )}
    </>
  );
};
