import {
  Checkbox,
  css,
  FormFieldContainer,
  SearchInput,
  SelectList,
} from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import React from 'react';
import { useMemo, useState } from 'react';
import { connect } from 'react-redux';
import {
  selectCollections,
  toggleInferRelationships,
} from '../../store/generate-diagram-wizard';
import type { DataModelingState } from '../../store/reducer';

const selectListStyles = css({
  maxHeight: 200,
  overflow: 'scroll',
});

type SelectCollectionsStepProps = {
  collections: string[];
  selectedCollections: string[];
  automaticallyInferRelationships: boolean;
  onCollectionsSelect: (colls: string[]) => void;
  onAutomaticallyInferRelationshipsToggle: (newVal: boolean) => void;
};

const SelectCollectionsStep: React.FunctionComponent<
  SelectCollectionsStepProps
> = ({
  automaticallyInferRelationships,
  collections,
  selectedCollections,
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
  return (
    <>
      <FormFieldContainer>
        <SearchInput
          aria-label="Search collections"
          value={searchTerm}
          data-testid="new-diagram-search-collections"
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <SelectList
          className={selectListStyles}
          items={filteredCollections.map((collName) => {
            return {
              id: collName,
              selected: selectedCollections.includes(collName),
              'data-testid': `new-diagram-collection-checkbox-${collName}`,
            };
          })}
          label={{ displayLabelKey: 'id', name: 'Collection Name' }}
          onChange={(items) => {
            // When a user is searching, less collections are shown to the user
            // and we need to keep existing selected collections selected.
            const currentSelectedItems = selectedCollections.filter(
              (collName) => {
                const item = items.find((x) => x.id === collName);
                // The already selected item was not shown to the user (using search),
                // and we have to keep it selected.
                return item ? item.selected : true;
              }
            );

            const newSelectedItems = items
              .filter((item) => {
                return item.selected;
              })
              .map((item) => {
                return item.id;
              });
            onCollectionsSelect(
              Array.from(
                new Set([...newSelectedItems, ...currentSelectedItems])
              )
            );
          }}
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

export default connect(
  (state: DataModelingState) => {
    const { formFields, databaseCollections, automaticallyInferRelations } =
      state.generateDiagramWizard;

    return {
      collections: databaseCollections ?? [],
      selectedCollections: formFields.selectedCollections.value ?? [],
      automaticallyInferRelationships: automaticallyInferRelations,
    };
  },
  {
    onCollectionsSelect: selectCollections,
    onAutomaticallyInferRelationshipsToggle: toggleInferRelationships,
  }
)(SelectCollectionsStep);
