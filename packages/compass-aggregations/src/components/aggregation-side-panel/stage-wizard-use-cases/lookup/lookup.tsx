import {
  Body,
  spacing,
  css,
  TextInput,
  Combobox,
  ComboboxWithCustomOption,
  ComboboxOption,
} from '@mongodb-js/compass-components';
import React, { useEffect, useMemo, useState } from 'react';
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
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing[2],
  flexWrap: 'wrap',
});

const formElementWithText = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

const comboboxStyles = (fields: string[]) => {
  return {
    width: `calc(${String(
      Math.max(...fields.map((label) => label.length), 10)
    )}ch)`,
  };
};

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
      console.log(formData.from);
      onSelectCollection(formData.from);
    }
  }, [formData.from, onSelectCollection]);

  useEffect(() => {
    onChange(JSON.stringify(formData), null);
  }, [formData, onChange]);

  const onSelectOption = (
    option: keyof LookupFormState,
    value: string | null
  ) => {
    if (!value) {
      return;
    }

    const newData: LookupFormState = { ...formData, [option]: value };

    // We set the "as" form field if:
    // 1. The value was not set initially.
    // 2. The value was set initially by us programmatically
    //  and was not changed by the user.
    if ((option === 'from' && !formData.as) || formData.from === formData.as) {
      newData.as = value;
    }

    setFormData(newData);
  };

  console.log(collectionsFields);

  const collectionInfo = collectionsFields[formData.from];

  const collectionsComboboxStyles = useMemo(
    () => comboboxStyles(Object.keys(collectionsFields)),
    [collectionsFields]
  );
  const localFieldsComboboxStyles = useMemo(
    () => comboboxStyles(fields),
    [fields]
  );
  const foreignFieldsComboboxStyles = useMemo(
    () => comboboxStyles(fields),
    [fields]
  );

  return (
    <div className={containerStyles}>
      <div className={formElementWithText}>
        <Body>Join documents in</Body>
        <Combobox
          aria-label="Select collection"
          value={formData.from}
          clearable={false}
          style={collectionsComboboxStyles}
          onChange={(value: string | null) => onSelectOption('from', value)}
        >
          {Object.keys(collectionsFields).map((coll, index) => (
            <ComboboxOption key={index} value={coll} />
          ))}
        </Combobox>
      </div>
      <div className={formElementWithText}>
        <Body>where</Body>
        <ComboboxWithCustomOption
          style={foreignFieldsComboboxStyles}
          aria-label="Select foreign field"
          size="default"
          clearable={false}
          onChange={(value: string | null) =>
            onSelectOption('foreignField', value)
          }
          searchState={collectionInfo?.isLoading ? 'loading' : 'unset'}
          searchLoadingMessage="Fetching fields ..."
          options={collectionInfo?.fields ?? []}
          optionLabel="Field:"
        />
      </div>
      <div className={formElementWithText}>
        <Body>matches</Body>
        <ComboboxWithCustomOption
          style={localFieldsComboboxStyles}
          aria-label="Select local field"
          size="default"
          clearable={false}
          onChange={(value: string | null) =>
            onSelectOption('localField', value)
          }
          options={fields}
          optionLabel="Field:"
        />
      </div>
      <div className={formElementWithText}>
        <Body>in</Body>
        <TextInput
          value={formData.as}
          aria-label="Name of the array"
          placeholder="Name of the array"
          onChange={(e) => onSelectOption('as', e.target.value)}
        />
      </div>
    </div>
  );
};

export default connect(
  (state: RootState) => {
    const collectionsFields = state.collectionsFields;
    return {
      collectionsFields,
    };
  },
  {
    onSelectCollection: fetchCollectionFields,
  }
)(LookupForm);
