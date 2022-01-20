import React, { useEffect } from 'react';
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
import { validateConnectionOptionsErrors } from '../utils/validation';

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
  height: 'fit-content',
  width: '100%',
  position: 'relative',
  display: 'flex',
  flexFlow: 'column nowrap',
  maxHeight: '95vh',
});

const descriptionStyles = css({
  marginTop: spacing[2],
});

const formContentContainerStyles = css({
  padding: spacing[4],
  overflow: 'scroll',
});

const formFooterStyles = css({
  marginTop: 'auto',
});

function ConnectForm({
  initialConnectionInfo,
  connectionErrorMessage,
  onConnectClicked,
}: {
  initialConnectionInfo: ConnectionInfo;
  connectionErrorMessage?: string | null;
  onConnectClicked: (connectionInfo: ConnectionInfo) => void;
}): React.ReactElement {
  const [
    { enableEditingConnectionString, errors, warnings, connectionOptions },
    { setEnableEditingConnectionString, updateConnectionFormField, setErrors },
  ] = useConnectForm(initialConnectionInfo);

  useEffect(() => {
    if (connectionErrorMessage) {
      setErrors([{ message: connectionErrorMessage }]);
    }
  }, [setErrors, connectionErrorMessage])

  const connectionStringInvalidError = errors.find(
    (error) => error.fieldName === 'connectionString'
  );

  return (
    <div className={formContainerStyles} data-testid="new-connect-form">
      <Card className={formCardStyles}>
        <div className={formContentContainerStyles}>
          <H3>New Connection</H3>
          <Description className={descriptionStyles}>
            Connect to a MongoDB deployment
          </Description>
          <ConnectionStringInput
            connectionString={connectionOptions.connectionString}
            enableEditingConnectionString={enableEditingConnectionString}
            setEnableEditingConnectionString={setEnableEditingConnectionString}
            updateConnectionFormField={updateConnectionFormField}
          />
          {connectionStringInvalidError && (
            <Banner variant={BannerVariant.Danger}>
              {connectionStringInvalidError.message}
            </Banner>
          )}
          <AdvancedConnectionOptions
            errors={errors}
            disabled={!!connectionStringInvalidError}
            updateConnectionFormField={updateConnectionFormField}
            connectionOptions={connectionOptions}
          />
        </div>

        <div className={formFooterStyles}>
          <ConnectFormActions
            errors={connectionStringInvalidError ? [] : errors}
            warnings={connectionStringInvalidError ? [] : warnings}
            onConnectClicked={() => {
              const updatedConnectionOptions = {
                ...connectionOptions,
              };
              const formErrors = validateConnectionOptionsErrors(
                updatedConnectionOptions
              );
              if (formErrors.length) {
                setErrors(formErrors);
                return;
              }
              onConnectClicked({
                ...initialConnectionInfo,
                connectionOptions: updatedConnectionOptions,
              });
            }}
          />
        </div>
      </Card>
    </div>
  );
}

export default ConnectForm;
