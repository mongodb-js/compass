import {
  Body,
  css,
  FormFieldContainer,
  Icon,
  Label,
  palette,
  Radio,
  RadioGroup,
  SearchInput,
  SelectList,
  spacing,
  SpinLoaderWithLabel,
  TextInput,
  Toggle,
  WarningSummary,
} from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import React, { useCallback, useMemo, useState } from 'react';
import {
  areSamplingOptionsValid,
  type SamplingOptions,
} from '../store/sampling-options';

const LARGE_SAMPLE_SIZE_THRESHOLD = 100;

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

const sampleSizeContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

const sampleSizeRadioStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
});

const sampleSizeLabelStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
});

const radioGroupStyles = css({
  flexDirection: 'row',
  gap: spacing[400],
  alignItems: 'center',
  marginTop: spacing[200],
});

const sampleSizeInputStyles = css({
  width: 100,
});

const warningTextStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
  color: palette.yellow.dark2,
});

const errorTextStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
  color: palette.red.base,
});

const warningTextContainerStyles = css({
  marginTop: spacing[200],
});

const warningIconStyles = css({
  alignSelf: 'flex-start',
});

type SelectCollectionsListProps = {
  collections: string[];
  selectedCollections: string[];
  disabledCollections?: string[];
  automaticallyInferRelationships: boolean;
  samplingOptions: SamplingOptions;
  isFetchingCollections: boolean;
  error?: Error;
  onCollectionsSelect: (colls: string[]) => void;
  onAutomaticallyInferRelationshipsToggle: (newVal: boolean) => void;
  onSamplingOptionsChange: (newVal: SamplingOptions) => void;
};

type SelectCollectionItem = {
  id: string;
  selected: boolean;
  disabled?: boolean;
};

const InferRelationshipsHeaderStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: spacing[200],
});

const inferRelationshipLabelId = 'infer-relationships-label';
const inferRelationshipToggleId = 'infer-relationships-toggle';

export const SelectCollectionsList: React.FunctionComponent<
  SelectCollectionsListProps
> = ({
  automaticallyInferRelationships,
  collections,
  selectedCollections,
  disabledCollections = [],
  samplingOptions,
  isFetchingCollections,
  error,
  onCollectionsSelect,
  onAutomaticallyInferRelationshipsToggle,
  onSamplingOptionsChange,
}) => {
  const showAutoInferOption = usePreference(
    'enableAutomaticRelationshipInference'
  );
  const [searchTerm, setSearchTerm] = useState('');

  const handleSamplingOptionChange = useCallback(
    (change: Partial<SamplingOptions>) => {
      onSamplingOptionsChange({
        ...samplingOptions,
        ...change,
      });
    },
    [onSamplingOptionsChange, samplingOptions]
  );

  const handleRadioGroupChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      handleSamplingOptionChange({
        allDocuments: evt.target.value === 'allDocuments',
      });
    },
    [handleSamplingOptionChange]
  );

  const handleSampleSizeInputChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      handleSamplingOptionChange({
        sampleSize: parseInt(evt.target.value, 10),
      });
    },
    [handleSamplingOptionChange]
  );

  const areSamplingOptionsInvalid = useMemo(
    () => !areSamplingOptionsValid(samplingOptions),
    [samplingOptions]
  );
  const isLargeSampleSize = useMemo(
    () =>
      !areSamplingOptionsInvalid &&
      (samplingOptions.allDocuments ||
        samplingOptions.sampleSize > LARGE_SAMPLE_SIZE_THRESHOLD),
    [samplingOptions, areSamplingOptionsInvalid]
  );

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

      {showAutoInferOption && (
        <>
          <div className={InferRelationshipsHeaderStyles}>
            <Label
              id={inferRelationshipLabelId}
              htmlFor={inferRelationshipToggleId}
            >
              Automatically infer relationships
            </Label>
            <Toggle
              id={inferRelationshipToggleId}
              aria-labelledby={inferRelationshipLabelId}
              checked={automaticallyInferRelationships}
              onChange={(checked) => {
                onAutomaticallyInferRelationshipsToggle(checked);
              }}
              size="small"
            ></Toggle>
          </div>
          Analysis process will try to automatically discover relationships in
          selected collections. This operation will run multiple find requests
          against indexed fields of the collections and{' '}
          <strong>
            will take additional time per collection being analyzed.
          </strong>
        </>
      )}
      <FormFieldContainer className={sampleSizeContainerStyles}>
        <Body weight="bold">Document sampling</Body>
        By default, diagrams are generated from a small sample per collection.
        Larger samples improve accuracy but increase analysis time and memory
        usage, while smaller samples are faster but may miss infrequent fields
        or relationships.
        <RadioGroup
          className={radioGroupStyles}
          onChange={handleRadioGroupChange}
        >
          <Radio value="sampleSize" className={sampleSizeRadioStyles} default>
            <div className={sampleSizeLabelStyles}>
              <TextInput
                id="sample-size-input"
                data-testid="sample-size-input"
                aria-label="Sample size"
                className={sampleSizeInputStyles}
                type="number"
                min={1}
                value={samplingOptions.sampleSize.toString()}
                onChange={handleSampleSizeInputChange}
              />
              <Body>documents per collection.</Body>
            </div>
          </Radio>
          <Radio value="allDocuments">
            <Body>All documents</Body>
          </Radio>
        </RadioGroup>
        <div className={warningTextContainerStyles}>
          {areSamplingOptionsInvalid && (
            <div className={errorTextStyles} data-testid="sample-size-warning">
              <Icon glyph="Warning" size="large" />
              <span>Invalid input</span>
            </div>
          )}
          {isLargeSampleSize && (
            <div
              className={warningTextStyles}
              data-testid="sample-size-warning"
            >
              <Icon
                glyph="Warning"
                size="large"
                className={warningIconStyles}
              />
              <span>
                <strong>Warning:</strong> Consider your dataset size and the
                available resources on the device or browser running Compass.
              </span>
            </div>
          )}
        </div>
      </FormFieldContainer>
    </>
  );
};
