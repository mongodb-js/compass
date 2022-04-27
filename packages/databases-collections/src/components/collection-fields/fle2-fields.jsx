import React from 'react';
import PropTypes from 'prop-types';
import {
  Description,
  Editor,
  EditorVariant,
  Label,
  Option,
  Select,
  SelectSize
} from '@mongodb-js/compass-components';

import CollapsibleFieldSet from '../collapsible-field-set/collapsible-field-set';
import FieldSet from '../field-set/field-set';

// TODO(COMPASS-5777): Use URL specifically for FLE2
const HELP_URL_FLE2 = 'https://www.mongodb.com/docs/drivers/security/client-side-field-level-encryption-guide/';

const kmsProviderNames = {
  local: 'Local',
  gcp: 'GCP',
  azure: 'Azure',
  aws: 'AWS',
  kmip: 'KMIP'
};

export const ENCRYPTED_FIELDS_PLACEHOLDER = `{
  fields: [
    {
      path: "encryptedField",
      // keyId: UUID("..."), // or specify KMS + Key encryption key below
      bsonType: "string",
      queries: { "queryType": "equality" } // optional
    }
  ]
}`;

const keyEncryptionKeyTemplate = {
  local: '/* No KeyEncryptionKey required */\n{}',
  aws: `{
  region: '',
  key: ''
}`,
  gcp: `{
  projectId: '',
  location: '',
  keyRing: '',
  keyName: '',
}`,
  azure: `{
  keyName: '',
  keyVaultEndpoint: '',
}`,
  kmip: '/* No KeyEncryptionKey required */\n{}'
};

function FLE2Fields({
  isCapped,
  isTimeSeries,
  isFLE2,
  onChangeIsFLE2,
  onChangeField,
  fle2,
  configuredKMSProviders
}) {
  return (
    <CollapsibleFieldSet
      toggled={isFLE2}
      disabled={isTimeSeries || isCapped}
      onToggle={checked => onChangeIsFLE2(checked)}
      // TODO(COMPASS-5626): Use proper name instead of FLE2
      label="FLE2"
      dataTestId="fle2-fields"
      helpUrl={HELP_URL_FLE2}
      description="FLE2 collections encrypt a subset of the fields using client-side encryption."
    >
      <FieldSet>
        <Label htmlFor="TODO(COMPASS-5653)">Encrypted fields</Label>
        <Description>Indicate which fields should be encrypted and whether they should be queryable.</Description>
        <Editor
          variant={EditorVariant.Shell}
          name="fle2.encryptedFields"
          value={fle2.encryptedFields}
          data-testid="fle2-encryptedFields"
          onChangeText={(newText) => onChangeField('fle2.encryptedFields', newText)}
        />
      </FieldSet>

      <FieldSet>
        <Select
          label="KMS Provider"
          description="Optional. If no keyId is specified in the encrypted fields config, Compass will create new data keys for each encrypted field using the specified KMS."
          name="fle2.kmsProvider"
          onChange={(newValue) => {
            onChangeField(
              ['fle2.kmsProvider', 'fle2.keyEncryptionKey'],
              [newValue, keyEncryptionKeyTemplate[newValue]]
            );
          }}
          size={SelectSize.Small}
          allowDeselect={false}
          value={fle2.kmsProvider}
          usePortal={false}
        >
          {
            (configuredKMSProviders || Object.keys(kmsProviderNames)).map(provider => {
              return (<Option
                key={provider}
                value={provider}
              >
                {kmsProviderNames[provider]}
              </Option>);
            })
          }
        </Select>
      </FieldSet>

      <FieldSet>
        <Label htmlFor="TODO(COMPASS-5653)">Key Encryption Key</Label>
        <Description>Specify which key encryption key to use for creating new data encryption keys.</Description>
        <Editor
          variant={EditorVariant.Shell}
          name="fle2.keyEncryptionKey"
          defaultValue={keyEncryptionKeyTemplate[fle2.kmsProvider]}
          value={fle2.keyEncryptionKey || keyEncryptionKeyTemplate[fle2.kmsProvider]}
          data-testid="fle2-keyEncryptionKey"
          onChangeText={(newText) => onChangeField('fle2.keyEncryptionKey', newText)}
        />
      </FieldSet>
    </CollapsibleFieldSet>
  );
}

FLE2Fields.propTypes = {
  isCapped: PropTypes.bool.isRequired,
  isTimeSeries: PropTypes.bool.isRequired,
  isFLE2: PropTypes.bool.isRequired,
  onChangeIsFLE2: PropTypes.func.isRequired,
  onChangeField: PropTypes.func.isRequired,
  fle2: PropTypes.object.isRequired,
  configuredKMSProviders: PropTypes.array
};

export default FLE2Fields;
