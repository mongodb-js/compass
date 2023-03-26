import {
  Combobox,
  ComboboxOption,
  Select,
  Option,
} from '@mongodb-js/compass-components';
import React from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../../modules';
import type { Field } from '.';
import toNS from 'mongodb-ns';

type LookupFormState = {
  localField: string;
  foreignField: string;
  from: string;
  as: string;
};

export const mapLookupFormToStageValue = (data: LookupFormState) => {
  return data;
};

const BaseLookupForm = ({
  initialData = {
    as: '',
    foreignField: '',
    from: '',
    localField: '',
  },
  fields: schemaFields,
  onChange,
  options: { getCollectionFields, getCollections },
}: {
  initialData?: LookupFormState;
  fields: Field[];
  onChange: (data: LookupFormState) => void;
  options: {
    getCollections: () => Promise<string[]>;
    getCollectionFields: (collection: string) => Promise<string[]>;
  };
}) => {
  const [collections, setCollections] = React.useState<string[]>([]);
  const [collectionFields, setCollectionFields] = React.useState<string[]>([]);

  React.useEffect(() => {
    getCollections()
      .then((data) => {
        setCollections(data);
      })
      .catch(() => {
        // noop
      });
  }, [getCollections]);

  React.useEffect(() => {
    getCollectionFields(initialData.from)
      .then((data) => {
        setCollectionFields(data);
      })
      .catch(() => {
        // noop
      });
  }, [initialData.from]);

  const onChangeValue = (key: keyof LookupFormState, value: string) => {
    const newData = {
      ...initialData,
      [key]: value,
    };
    onChange(newData);
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <p>Join documents in</p>
      <Select
        style={{ width: '100px' }}
        allowDeselect={false}
        aria-labelledby="Select collection"
        value={initialData.from}
        onChange={(value) => onChangeValue('from', value)}
      >
        {collections.map((label) => {
          return (
            <Option key={label} value={label}>
              {label}
            </Option>
          );
        })}
      </Select>
      <p>where</p>
      <Select
        style={{ width: '100px' }}
        allowDeselect={false}
        aria-labelledby="Select foreign field"
        value={initialData.foreignField}
        onChange={(value) => onChangeValue('foreignField', value)}
      >
        {collectionFields.map((label) => {
          return (
            <Option key={label} value={label}>
              {label}
            </Option>
          );
        })}
      </Select>
      <p>matches</p>
      <div style={{ width: '100px' }}>
        <Combobox
          aria-label="Select a field"
          size="default"
          clearable={false}
          initialValue={initialData.localField}
          onChange={(value: string | null) => {
            if (value) {
              onChangeValue('localField', value);
            }
          }}
        >
          {schemaFields.map(({ name, value }, index) => (
            <ComboboxOption
              key={`combobox-option-stage-${index}`}
              value={value}
              displayName={name}
            />
          ))}
        </Combobox>
      </div>
      <p>in an array</p>
    </div>
  );
};

export const LookupForm = connect((state: RootState) => {
  const {
    namespace,
    dataService: { dataService },
  } = state;
  // todo: move to somewhere else
  return {
    options: {
      getCollections: async () => {
        if (!dataService) {
          return [];
        }
        const { database } = toNS(namespace);
        const data = await dataService.listCollections(database);
        return data.map(({ name }) => name);
      },
      // todo: this is just for testing
      getCollectionFields: (collection: string) => {
        if (!dataService) {
          return Promise.resolve([]);
        }
        const { database } = toNS(namespace);
        return Promise.resolve([database, collection]);
      },
    },
  };
})(BaseLookupForm);
