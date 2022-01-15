import React from 'react';
import { ConnectionInfo } from 'mongodb-data-service';
import {
  Banner,
  BannerVariant,
  Card,
  Description,
  H3,
  spacing,
  css,
} from '@mongodb-js/compass-components';

import ConnectionStringInput from './connection-string-input';
import AdvancedConnectionOptions from './advanced-connection-options';
import ConnectFormActions from './connect-form-actions';
import { useConnectForm } from '../hooks/use-connect-form';
import { validateConnectionOptionsErrors } from '../utils/validation-errors';

const formContainerStyles = css({
  margin: 0,
  padding: 0,
  height: 'fit-content',
  flexGrow: 1,
  minWidth: 650,
  maxWidth: 760,
  position: 'relative',
  display: 'inline-block',
});

const formCardStyles = css({
  margin: 0,
  padding: spacing[2],
  height: 'fit-content',
  width: '100%',
  position: 'relative',
});

const descriptionStyles = css({
  marginTop: spacing[2],
});

const formContentContainerStyles = css({
  padding: spacing[4],
});

function ConnectForm({
  initialConnectionInfo,
  onConnectClicked,
}: {
  initialConnectionInfo: ConnectionInfo;
  onConnectClicked: (connectionInfo: ConnectionInfo) => void;
}): React.ReactElement {
  const [
    {
      errors,
      connectionStringUrl,
      connectionStringInvalidError,
      connectionOptions,
    },
    {
      updateConnectionFormField,
      setConnectionStringUrl,
      setConnectionStringError,
      setErrors
    },
  ] = useConnectForm(initialConnectionInfo);

  const editingConnectionStringUrl = connectionStringUrl;

  return (
    <div className={formContainerStyles} data-testid="new-connect-form">
      <Card className={formCardStyles}>
        <div className={formContentContainerStyles}>
          <H3>New Connection</H3>
          <Description className={descriptionStyles}>
            Connect to a MongoDB deployment
          </Description>
          <ConnectionStringInput
            connectionString={editingConnectionStringUrl.toString()}
            setConnectionStringUrl={setConnectionStringUrl}
            setConnectionStringError={setConnectionStringError}
          />
          {connectionStringInvalidError && (
            <Banner variant={BannerVariant.Danger}>
              {connectionStringInvalidError}
            </Banner>
          )}
          <AdvancedConnectionOptions
            errors={errors}
            disabled={!!connectionStringInvalidError}
            connectionStringUrl={editingConnectionStringUrl}
            updateConnectionFormField={updateConnectionFormField}
            connectionOptions={connectionOptions}
          />
        </div>
        <ConnectFormActions
          onConnectClicked={() => {
            const updatedConnectionOptions = {
              ...connectionOptions,
              connectionString: editingConnectionStringUrl.toString(),
            };
            const formErrors = validateConnectionOptionsErrors(updatedConnectionOptions)
            if (formErrors.length) {
              setErrors(formErrors);
              return;
            }
            onConnectClicked({
              ...initialConnectionInfo,
              connectionOptions: updatedConnectionOptions
            })
          }
          }
        />
        {errors.length && !connectionStringInvalidError && (
          <Banner variant={BannerVariant.Danger}>
            {errors.map((err) => err.message).join('\n')}
          </Banner>
        )}
      </Card>
    </div>
  );
}

export default ConnectForm;
