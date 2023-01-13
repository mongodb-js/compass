import React, { useState } from 'react';
import {
  FormFieldContainer,
  css,
  spacing,
  Banner,
  BannerVariant,
  Button,
  ButtonVariant,
} from '@mongodb-js/compass-components';
import { randomLocalKey } from '../../../utils/csfle-handler';
import type { ConnectionOptions } from 'mongodb-data-service';

const bannerContainerStyles = css({
  marginTop: spacing[3],
});

function KMSLocalKeyGenerator({
  connectionOptions,
  handleFieldChanged,
}: {
  handleFieldChanged: (key: 'key', value?: string) => void;
  connectionOptions: ConnectionOptions;
}): React.ReactElement {
  const autoEncryptionOptions =
    connectionOptions.fleOptions?.autoEncryption ?? {};

  const [generatedKeyMaterial, setGeneratedKeyMaterial] = useState('');

  function generateRandomKey() {
    const keyMaterial = randomLocalKey();
    setGeneratedKeyMaterial(keyMaterial);
    handleFieldChanged('key', keyMaterial);
  }

  return (
    <div>
      <FormFieldContainer>
        <Button
          data-testid="generate-local-key-button"
          variant={ButtonVariant.Default}
          disabled={
            (autoEncryptionOptions.kmsProviders?.local?.key?.length || 0) > 0
          }
          onClick={generateRandomKey}
        >
          Generate Random Key
        </Button>
        {generatedKeyMaterial ===
          autoEncryptionOptions.kmsProviders?.local?.key && (
          <>
            <div className={bannerContainerStyles}>
              <Banner variant={BannerVariant.Info}>
                This key will be used to encrypt data stored in the database.
                Without it, encrypted data cannot be accessed.
              </Banner>
            </div>
            {!connectionOptions?.fleOptions?.storeCredentials && (
              <div className={bannerContainerStyles}>
                <Banner variant={BannerVariant.Warning}>
                  Compass does not save KMS credentials by default. Copy and
                  save the key in an external location.
                </Banner>
              </div>
            )}
          </>
        )}
      </FormFieldContainer>
    </div>
  );
}

export default KMSLocalKeyGenerator;
