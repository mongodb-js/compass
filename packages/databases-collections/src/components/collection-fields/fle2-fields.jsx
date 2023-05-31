import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  FormFieldContainer,
  CollapsibleFieldSet,
  Description,
  Label,
  RadioBox,
  RadioBoxGroup,
} from '@mongodb-js/compass-components';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';

const HELP_URL_FLE2 = 'https://dochub.mongodb.org/core/rqe-encrypted-fields';

const kmsProviderNames = {
  local: 'Local',
  gcp: 'GCP',
  azure: 'Azure',
  aws: 'AWS',
  kmip: 'KMIP',
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
  kmip: '/* No KeyEncryptionKey required */\n{}',
};

const queryableEncryptedFieldsEditorId = 'queryable-encrypted-fields-editor-id';
const keyEncryptionKeyEditorId = 'key-encryption-key-editor-id';

function FLE2Fields({
  isCapped,
  isTimeSeries,
  isFLE2,
  onChangeIsFLE2,
  onChangeField,
  fle2,
  configuredKMSProviders,
}) {
  const [keyEncryptionKeyEditorText, setKeyEncryptionKeyEditorText] = useState(
    fle2.keyEncryptionKey || keyEncryptionKeyTemplate[fle2.kmsProvider]
  );

  return (
    <CollapsibleFieldSet
      toggled={isFLE2}
      disabled={isTimeSeries || isCapped}
      onToggle={(checked) => onChangeIsFLE2(checked)}
      // Queryable Encryption is the user-facing name of FLE2
      label="Queryable Encryption"
      data-testid="fle2-fields"
      helpUrl={HELP_URL_FLE2}
      description="Encrypt a subset of the fields using Queryable Encryption."
    >
      <FormFieldContainer>
        <Label htmlFor={queryableEncryptedFieldsEditorId}>
          Encrypted fields
        </Label>
        <Description>
          Indicate which fields should be encrypted and whether they should be
          queryable.
        </Description>
        <CodemirrorMultilineEditor
          id={queryableEncryptedFieldsEditorId}
          text={fle2.encryptedFields}
          onChangeText={(newText) =>
            onChangeField('fle2.encryptedFields', newText)
          }
          data-testid="fle2-encryptedFields"
        />
      </FormFieldContainer>

      <FormFieldContainer>
        <Label htmlFor="createcollection-radioboxgroup">KMS Provider</Label>
        <Description>
          Optional. If no keyId is specified in the encrypted fields config,
          Compass will create new data keys for each encrypted field using the
          specified KMS.
        </Description>
        <RadioBoxGroup
          onChange={(ev) => {
            ev.preventDefault();
            onChangeField(
              ['fle2.kmsProvider', 'fle2.keyEncryptionKey'],
              [ev.target.value, keyEncryptionKeyTemplate[ev.target.value]]
            );
          }}
          id="createcollection-radioboxgroup"
          value={fle2.kmsProvider}
        >
          {(configuredKMSProviders || Object.keys(kmsProviderNames)).map(
            (provider) => {
              return (
                <RadioBox
                  id={`${provider}-kms-button`}
                  data-testid={`${provider}-kms-button`}
                  checked={fle2.kmsProvider === provider}
                  value={provider}
                  key={provider}
                >
                  {kmsProviderNames[provider]}
                </RadioBox>
              );
            }
          )}
        </RadioBoxGroup>
      </FormFieldContainer>

      <FormFieldContainer>
        <Label htmlFor={keyEncryptionKeyEditorId}>Key Encryption Key</Label>
        <Description>
          Specify which key encryption key to use for creating new data
          encryption keys.
        </Description>
        <CodemirrorMultilineEditor
          id={keyEncryptionKeyEditorId}
          text={keyEncryptionKeyEditorText}
          onChangeText={(newText) => {
            setKeyEncryptionKeyEditorText(newText);
            onChangeField('fle2.keyEncryptionKey', newText);
          }}
          data-testid="fle2-keyEncryptionKey"
        />
      </FormFieldContainer>
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
  configuredKMSProviders: PropTypes.array,
};

export default FLE2Fields;
