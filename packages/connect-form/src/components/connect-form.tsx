import React from 'react';
import { ConnectionInfo } from 'mongodb-data-service';
import {
  Banner,
  BannerVariant,
  Card,
  Description,
  FavoriteIcon,
  H3,
  spacing,
  css,
} from '@mongodb-js/compass-components';

import ConnectionStringInput from './connection-string-input';
import AdvancedConnectionOptions from './advanced-connection-options';
import ConnectFormActions from './connect-form-actions';
import { useConnectForm } from '../hooks/use-connect-form';
import { validateConnectionOptionsErrors } from '../utils/validation';
import { ErrorSummary, WarningSummary } from './validation-summary';
import { IconButton } from '@mongodb-js/compass-components';

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

const favoriteButtonStyles = css({
  position: 'absolute',
  top: spacing[4],
  right: spacing[4],
  hover: {
    cursor: 'pointer'
  }
})

function ConnectForm({
  initialConnectionInfo,
  onConnectClicked,
  // The connect form will not always used in an environment where
  // the connection info can be saved.
  showSaveConnection
}: {
  initialConnectionInfo: ConnectionInfo;
  onConnectClicked: (connectionInfo: ConnectionInfo) => void;
  showSaveConnection: boolean
}): React.ReactElement {
  const [
    {
      errors,
      warnings,
      connectionStringUrl,
      connectionStringInvalidError,
      connectionOptions,
    },
    {
      updateConnectionFormField,
      setConnectionStringUrl,
      setConnectionStringError,
      setErrors,
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
          {/* {showSaveConnection && (
            <div className={favoriteButtonStyles}>
              <FavoriteIcon />
              Favorite
            </div>
          )} */}
          {showSaveConnection && (
            <IconButton className={favoriteButtonStyles}>
              <FavoriteIcon 
                isFavorite
              />
              {/* Favorite */}
            </IconButton>
          )}
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

        {warnings.length && !connectionStringInvalidError ? (
          <WarningSummary warnings={warnings} />
        ) : (
          ''
        )}

        {errors.length && !connectionStringInvalidError ? (
          <ErrorSummary errors={errors} />
        ) : (
          ''
        )}

        <ConnectFormActions
          onConnectClicked={() => {
            const updatedConnectionOptions = {
              ...connectionOptions,
              connectionString: editingConnectionStringUrl.toString(),
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
      </Card>
    </div>
  );
}

export default ConnectForm;
