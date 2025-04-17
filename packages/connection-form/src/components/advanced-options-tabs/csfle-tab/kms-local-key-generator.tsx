import React, { useMemo, useState } from 'react';
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
import type {
  KMSProviderName,
  LocalKMSProviderConfiguration,
} from '../../../utils/csfle-kms-fields';

const bannerContainerStyles = css({
  marginTop: spacing[400],
});

function KMSLocalKeyGenerator({
  kmsProviderName,
  connectionOptions,
  handleFieldChanged,
}: {
  kmsProviderName: KMSProviderName<'local'>;
  handleFieldChanged: (key: 'key', value?: string) => void;
  connectionOptions: ConnectionOptions;
}): React.ReactElement {
  const kmsConfig = useMemo(() => {
    const autoEncryptionOptions =
      connectionOptions.fleOptions?.autoEncryption ?? {};
    return autoEncryptionOptions.kmsProviders?.[
      kmsProviderName as keyof typeof autoEncryptionOptions.kmsProviders
    ] as LocalKMSProviderConfiguration | undefined;
  }, [connectionOptions.fleOptions?.autoEncryption, kmsProviderName]);

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
          disabled={Number(kmsConfig?.key?.length || 0) > 0}
          onClick={generateRandomKey}
        >
          Generate Random Key
        </Button>
        {generatedKeyMaterial === kmsConfig?.key && (
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
