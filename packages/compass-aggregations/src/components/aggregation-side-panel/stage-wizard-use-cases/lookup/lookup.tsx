import {
  Body,
  spacing,
  css,
  TextInput,
  Combobox,
  ComboboxWithCustomOption,
  ComboboxOption,
} from '@mongodb-js/compass-components';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../../../modules';
import { fetchCollectionFields } from '../../../../modules/collections-fields';

type LookupFormState = {
  from: string;
  localField: string;
  foreignField: string;
  as: string;
};

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
});

const titleStyles = css({
  minWidth: `${'Join documents in'.length}ch`,
  textAlign: 'right',
});

const formGroup = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

const inputFieldStyles = css({
  width: '300px',
});

export const LookupForm = ({
  fields,
  collectionsFields,
  onSelectCollection,
  onChange,
}: {
  fields: string[];
  collectionsFields: Record<string, { isLoading: boolean; fields: string[] }>;
  onSelectCollection: (collection: string) => void;
  onChange: (value: string, error: Error | null) => void;
}) => {
  const [formData, setFormData] = useState<LookupFormState>({
    as: '',
    from: '',
    foreignField: '',
    localField: '',
  });

  useEffect(() => {
    if (formData.from) {
      onSelectCollection(formData.from);
    }
  }, [formData.from, onSelectCollection]);

  useEffect(() => {
    const anyEmptyValue = Object.values(formData).some((x) => !x);
    onChange(
      JSON.stringify(formData),
      anyEmptyValue ? new Error('Enter all the fields') : null
    );
  }, [formData, onChange]);

  const onSelectOption = (
    option: keyof LookupFormState,
    value: string | null
  ) => {
    if (value === null) {
      return;
    }

    const newData: LookupFormState = { ...formData, [option]: value };

    // We set the "as" form field if:
    // 1. The value was not set initially and
    // 2. The value was set initially programmatically and
    //  was not changed by the user or the value is empty
    if (option === 'from' && (!formData.as || formData.from === formData.as)) {
      newData.as = value;
    }

    setFormData(newData);
  };

  const collectionInfo = collectionsFields[formData.from];

  return (
    <div className={containerStyles}>
      <div className={formGroup}>
        <Body className={titleStyles}>Join documents in</Body>
        <Combobox
          aria-label="Select collection"
          placeholder="Select collection"
          value={formData.from}
          clearable={false}
          className={inputFieldStyles}
          onChange={(value: string | null) => onSelectOption('from', value)}
        >
          {Object.keys(collectionsFields).map((coll, index) => (
            <ComboboxOption key={index} value={coll} />
          ))}
        </Combobox>
      </div>
      <div className={formGroup}>
        <Body className={titleStyles}>where</Body>
        <ComboboxWithCustomOption
          className={inputFieldStyles}
          aria-label="Select foreign field"
          placeholder="Select foreign field"
          size="default"
          clearable={false}
          onChange={(value: string | null) =>
            onSelectOption('foreignField', value)
          }
          searchState={collectionInfo?.isLoading ? 'loading' : 'unset'}
          searchLoadingMessage="Fetching fields ..."
          searchEmptyMessage={
            !formData.from ? 'Select a collection first' : undefined
          }
          options={collectionInfo?.fields ?? []}
          optionLabel="Field:"
        />
      </div>
      <div className={formGroup}>
        <Body className={titleStyles}>matches</Body>
        <ComboboxWithCustomOption
          className={inputFieldStyles}
          aria-label="Select local field"
          placeholder="Select local field"
          size="default"
          clearable={false}
          onChange={(value: string | null) =>
            onSelectOption('localField', value)
          }
          options={fields}
          optionLabel="Field:"
        />
      </div>
      <div className={formGroup}>
        <Body className={titleStyles}>in</Body>
        <div className={inputFieldStyles}>
          <TextInput
            value={formData.as}
            title="Name of the array"
            aria-label="Name of the array"
            placeholder="Name of the array"
            onChange={(e) => onSelectOption('as', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default connect(
  (state: RootState) => ({
    collectionsFields: state.collectionsFields,
  }),
  {
    onSelectCollection: fetchCollectionFields,
  }
)(LookupForm);
