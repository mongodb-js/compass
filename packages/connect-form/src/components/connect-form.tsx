import React, { useState } from 'react';
import { ConnectionInfo } from 'mongodb-data-service';
import {
  Banner,
  BannerVariant,
  Card,
  Description,
  FavoriteIcon,
  Icon,
  IconButton,
  H3,
  spacing,
  css,
  uiColors,
} from '@mongodb-js/compass-components';

import ConnectionStringInput from './connection-string-input';
import AdvancedConnectionOptions from './advanced-connection-options';
import ConnectFormActions from './connect-form-actions';
import { useConnectForm } from '../hooks/use-connect-form';
import { validateConnectionOptionsErrors } from '../utils/validation';
import { ErrorSummary, WarningSummary } from './validation-summary';
import SaveConnectionModal from './save-connection-modal';

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
  right: spacing[6],
  hover: {
    cursor: 'pointer',
  },
});

const editFavoriteButtonStyles = css({
  verticalAlign: 'text-top',
  marginLeft: spacing[1],
});

const favoriteButtonLabelStyles = css({
  position: 'absolute',
  top: spacing[5],
  paddingTop: spacing[1],
  color: uiColors.black,
  fontWeight: 'bold',
  fontSize: 12,
});

function ConnectForm({
  initialConnectionInfo,
  onConnectClicked,
  // The connect form will not always used in an environment where
  // the connection info can be saved.
  showSaveConnection = false,
  saveConnection,
}: {
  initialConnectionInfo: ConnectionInfo;
  onConnectClicked: (connectionInfo: ConnectionInfo) => void;
  showSaveConnection?: boolean;
  saveConnection: (connectionInfo: ConnectionInfo) => Promise<void>;
}): React.ReactElement {
  const [
    { enableEditingConnectionString, errors, warnings, connectionOptions },
    { setEnableEditingConnectionString, updateConnectionFormField, setErrors },
  ] = useConnectForm(initialConnectionInfo);

  const [showSaveConnectionModal, setShowSaveConnectionModal] = useState(false);

  const connectionStringInvalidError = errors.find(
    (error) => error.fieldName === 'connectionString'
  );

  return (
    <>
      <div className={formContainerStyles} data-testid="new-connect-form">
        <Card className={formCardStyles}>
          <div className={formContentContainerStyles}>
            <H3>
              {initialConnectionInfo.favorite?.name ?? 'New Connection'}
              {showSaveConnection && (
                <IconButton
                  aria-label="Save Connection"
                  className={editFavoriteButtonStyles}
                  onClick={() => {
                    setShowSaveConnectionModal(true);
                  }}
                >
                  <Icon glyph="Edit" />
                </IconButton>
              )}
            </H3>
            <Description className={descriptionStyles}>
              Connect to a MongoDB deployment
            </Description>
            {showSaveConnection && (
              <IconButton
                aria-label="Save Connection"
                className={favoriteButtonStyles}
                size="large"
                onClick={() => {
                  setShowSaveConnectionModal(true);
                }}
              >
                <FavoriteIcon isFavorite />
                <span className={favoriteButtonLabelStyles}>FAVORITE</span>
              </IconButton>
            )}
            <ConnectionStringInput
              connectionString={connectionOptions.connectionString}
              enableEditingConnectionString={enableEditingConnectionString}
              setEnableEditingConnectionString={
                setEnableEditingConnectionString
              }
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
      <SaveConnectionModal
        open={showSaveConnectionModal}
        onCancel={() => {
          setShowSaveConnectionModal(false);
        }}
        onSave={async (connectionInfo: ConnectionInfo) => {
          setShowSaveConnectionModal(false);

          try {
            await saveConnection(connectionInfo);
          } catch (err) {
            setErrors([err as Error]);
          }
        }}
        key={initialConnectionInfo.id}
        initialConnectionInfo={initialConnectionInfo}
      />
    </>
  );
}

export default ConnectForm;
