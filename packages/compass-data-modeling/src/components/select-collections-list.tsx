import {
  Checkbox,
  css,
  FormFieldContainer,
  SearchInput,
  SelectList,
  spacing,
  SpinLoaderWithLabel,
  WarningSummary,
} from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import React, { useCallback } from 'react';
import { useMemo, useState } from 'react';

const loadingStyles = css({
  textAlign: 'center',
  marginTop: spacing[1800],
  marginBottom: spacing[1800],
});

const errorStyles = css({
  marginTop: spacing[600],
  marginBottom: spacing[600],
});

const selectListStyles = css({
  maxHeight: 200,
  overflow: 'scroll',
});

type SelectCollectionsListProps = {
  collections: string[];
  selectedCollections: string[];
  disabledCollections?: string[];
  automaticallyInferRelationships: boolean;
  isFetchingCollections: boolean;
  error?: Error;
  onCollectionsSelect: (colls: string[]) => void;
  onAutomaticallyInferRelationshipsToggle: (newVal: boolean) => void;
};

type SelectCollectionItem = {
  id: string;
  selected: boolean;
  disabled?: boolean;
};

export const SelectCollectionsList: React.FunctionComponent<
  SelectCollectionsListProps
> = ({
  automaticallyInferRelationships,
  collections,
  selectedCollections,
  disabledCollections = [],
  isFetchingCollections,
  error,
  onCollectionsSelect,
  onAutomaticallyInferRelationshipsToggle,
}) => {
  const showAutoInferOption = usePreference(
    'enableAutomaticRelationshipInference'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const filteredCollections = useMemo(() => {
    try {
      const regex = new RegExp(searchTerm, 'i');
      return collections.filter((x) => regex.test(x));
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
          return item.selected;
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
          Fetching collections ...
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
      <FormFieldContainer>
        <SelectList
          className={selectListStyles}
          items={filteredCollections.map((collName): SelectCollectionItem => {
            return {
              id: collName,
              selected: selectedCollections.includes(collName),
              disabled: disabledCollections.includes(collName),
            };
          })}
          label={{ displayLabelKey: 'id', name: 'Collection Name' }}
          onChange={onChangeSelection}
        ></SelectList>
      </FormFieldContainer>
      {showAutoInferOption && (
        <FormFieldContainer>
          <Checkbox
            checked={automaticallyInferRelationships}
            onChange={(evt) => {
              onAutomaticallyInferRelationshipsToggle(
                evt.currentTarget.checked
              );
            }}
            label="Automatically infer relationships"
            // @ts-expect-error Element is accepted, but not typed correctly
            description={
              <>
                Analysis process will try to automatically discover
                relationships in selected collections. This operation will run
                multiple find requests against indexed fields of the collections
                and{' '}
                <strong>
                  will take additional time per collection being analyzed.
                </strong>
              </>
            }
          ></Checkbox>
        </FormFieldContainer>
      )}
    </>
  );
};
