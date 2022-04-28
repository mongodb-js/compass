import React from 'react';
import type { Document } from 'mongodb';
import {
  encryptedFieldConfigToText,
  textToEncryptedFieldConfig,
} from '../../../utils/csfle-handler';
import FormFieldContainer from '../../form-field-container';
import {
  Editor,
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

function EncryptedFieldConfigInput({
  encryptedFieldConfig,
  errorMessage,
  onChange,
}: {
  encryptedFieldConfig: Document | undefined;
  errorMessage: string | undefined;
  onChange: (value: Document | undefined) => void;
}): React.ReactElement {
  return (
    <div>
      <FormFieldContainer>
        <Label htmlFor="TODO(COMPASS-5653)">EncryptedFieldConfigMap</Label>
        <Description>
          Add an optional client-side EncryptedFieldConfigMap for enhanced
          security.
        </Description>
        <Editor
          variant="Shell"
          text={encryptedFieldConfigToText(encryptedFieldConfig)}
          onChangeText={(newText) =>
            onChange(textToEncryptedFieldConfig(newText))
          }
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
