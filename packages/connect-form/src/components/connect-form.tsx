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
  // bottom: 0,
  // left: 0,
  // right: 0,
  top: spacing[5],
  paddingTop: spacing[1],
  color: uiColors.black,
  fontWeight: 'bold',
  fontSize: 12,
  // textAlign: 'center'
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
  saveConnection: (connectionInfo: ConnectionInfo) => void;
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

  const [showSaveConnectionModal, setShowSaveConnectionModal] = useState(false);

  const editingConnectionStringUrl = connectionStringUrl;

  return (
    <>
      <div className={formContainerStyles} data-testid="new-connect-form">
        <Card className={formCardStyles}>
          <div className={formContentContainerStyles}>
            <H3>
              New Connection
              {showSaveConnection && (
                <IconButton
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
      <SaveConnectionModal
        open={showSaveConnectionModal}
        onCancel={() => {
          setShowSaveConnectionModal(false);
        }}
        onSave={(connectionInfo: ConnectionInfo) => {
          saveConnection(connectionInfo);
          setShowSaveConnectionModal(false);
        }}
        initialConnectionInfo={initialConnectionInfo}
      />
    </>
  );
}

export default ConnectForm;
