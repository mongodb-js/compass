import {
  Body,
  Checkbox,
  css,
  Description,
  FormFieldContainer,
  Label,
  SearchInput,
  SelectList,
  spacing,
  SpinLoaderWithLabel,
  TextInput,
  WarningSummary,
} from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import React, { useCallback, useEffect } from 'react';
import { useMemo, useState } from 'react';

export const DEFAULT_SAMPLE_SIZE = 100;

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
  overflow: 'scroll',
});

const sampleSizeContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

const sampleSizeInputContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
});

const sampleSizeInputStyles = css({
  width: 100,
});

type SelectCollectionsListProps = {
  collections: string[];
  selectedCollections: string[];
  disabledCollections?: string[];
  automaticallyInferRelationships: boolean;
  sampleSize: number;
  isFetchingCollections: boolean;
  error?: Error;
  onCollectionsSelect: (colls: string[]) => void;
  onAutomaticallyInferRelationshipsToggle: (newVal: boolean) => void;
  onSampleSizeChange: (newVal: number) => void;
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
  sampleSize,
  isFetchingCollections,
  error,
  onCollectionsSelect,
  onAutomaticallyInferRelationshipsToggle,
  onSampleSizeChange,
}) => {
  const showAutoInferOption = usePreference(
    'enableAutomaticRelationshipInference'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [sampleSizeInputValue, setSampleSizeInputValue] = useState(
    `${sampleSize}`
  );

  // Sync local input value when the sampleSize prop changes
  useEffect(() => {
    setSampleSizeInputValue(`${sampleSize}`);
  }, [sampleSize]);

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
      <FormFieldContainer className={collectionListStyles}>
        {collections.length === 0 ? (
          <Body>This database has no collections.</Body>
        ) : filteredCollections.length === 0 ? (
          <Body>No collections match your search.</Body>
        ) : (
          <SelectList
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
      </FormFieldContainer>
      <FormFieldContainer className={sampleSizeContainerStyles}>
        <div className={sampleSizeInputContainerStyles}>
          <Label htmlFor="sample-size-input" id="sample-size-input-label">
            Maximum documents sampled per collection
          </Label>
          <TextInput
            id="sample-size-input"
            data-testid="sample-size-input"
            aria-labelledby="sample-size-input-label"
            aria-describedby="sample-size-description"
            className={sampleSizeInputStyles}
            type="number"
            min={1}
            value={sampleSizeInputValue}
            onChange={(evt) => {
              setSampleSizeInputValue(evt.target.value);
            }}
            onBlur={() => {
              const value = parseInt(sampleSizeInputValue, 10);
              if (!isNaN(value) && value > 0) {
                onSampleSizeChange(value);
              } else {
                // Reset to default if invalid
                setSampleSizeInputValue(`${DEFAULT_SAMPLE_SIZE}`);
                onSampleSizeChange(DEFAULT_SAMPLE_SIZE);
              }
            }}
          />
        </div>
        <Description id="sample-size-description">
          Compass generates an entity-relationship diagram based on a small
          sample of documents from each collection you select in your database.
          Larger samples can improve accuracy but may take longer to generate,
          while smaller samples are faster but may miss infrequent fields or
          relationships.
        </Description>
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
