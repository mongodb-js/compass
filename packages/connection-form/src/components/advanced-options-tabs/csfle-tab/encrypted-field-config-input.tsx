import React, { useState } from 'react';
import type { Document } from 'mongodb';
import {
  encryptedFieldConfigToEditorProps,
  editorTextToEncryptedFieldConfig,
} from '../../../utils/csfle-handler';
import FormFieldContainer from '../../form-field-container';
import {
  BSONDocumentEditor,
  Label,
  Banner,
  Description,
  css,
  spacing,
} from '@mongodb-js/compass-components';

const errorContainerStyles = css({
  padding: spacing[3],
  width: '100%',
});

const ENCRYPTED_FIELDS_MAP_PLACEHOLDER = `{
/**
 * // Client-side encrypted fields map configuration:
 * 'database.collection': {
 *   fields: [
 *     {
 *       keyId: UUID("..."),
 *       path: '...',
 *       bsonType: '...',
 *       queries: [{ queryType: 'equality' }]
 *     }
 *   ]
 * }
 */
}
`;

function EncryptedFieldConfigInput({
  encryptedFieldsMap,
  errorMessage,
  label,
  description,
  onChange,
}: {
  encryptedFieldsMap: Document | undefined;
  errorMessage: string | undefined;
  onChange: (value: Document | undefined) => void;
  label: React.ReactNode;
  description: React.ReactNode;
}): React.ReactElement {
  const [hasEditedContent, setHasEditedContent] = useState(false);

  if (encryptedFieldsMap === undefined && !hasEditedContent) {
    encryptedFieldsMap = editorTextToEncryptedFieldConfig(
      {},
      null,
      'Shell',
      ENCRYPTED_FIELDS_MAP_PLACEHOLDER
    );
  }

  return (
    <div data-testid="connection-csfle-encrypted-fields-map">
      <FormFieldContainer>
        <Label htmlFor="TODO(COMPASS-5653)">{label}</Label>
        <Description>{description}</Description>
        <BSONDocumentEditor
          data-testid="encrypted-fields-map-editor"
          {...encryptedFieldConfigToEditorProps(encryptedFieldsMap)}
          onChangeValue={(value, error, variant, newText) => {
            setHasEditedContent(true);
            onChange(
              editorTextToEncryptedFieldConfig(value, error, variant, newText)
            );
          }}
        />
      </FormFieldContainer>
      {errorMessage && (
        <div className={errorContainerStyles}>
          <Banner variant="danger">{errorMessage}</Banner>
        </div>
      )}
    </div>
  );
}

export default EncryptedFieldConfigInput;
