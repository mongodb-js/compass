import React, { useCallback, useState } from 'react';
import type {
  ConnectionInfo,
  ConnectionFavoriteOptions,
} from 'mongodb-data-service';
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
  cx,
  palette,
  withTheme,
} from '@mongodb-js/compass-components';
import { cloneDeep } from 'lodash';

import ConnectionStringInput from './connection-string-input';
import AdvancedConnectionOptions from './advanced-connection-options';
import ConnectFormActions from './connect-form-actions';
import { useConnectForm } from '../hooks/use-connect-form';
import { validateConnectionOptionsErrors } from '../utils/validation';
import SaveConnectionModal from './save-connection-modal';

const formContainerStyles = css({
  margin: 0,
  padding: 0,
  height: 'fit-content',
  width: spacing[6] * 12,
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

const formCardDarkThemeStyles = css({
  background: palette.gray.dark3,
});

const formCardLightThemeStyles = css({
  background: palette.white,
});

const descriptionStyles = css({
  marginTop: spacing[2],
});

const formStyles = css({
  display: 'contents',
});

const formContentContainerStyles = css({
  padding: spacing[4],
  overflowY: 'auto',
  position: 'relative',
});

const formFooterStyles = css({
  marginTop: 'auto',
});

const favoriteButtonStyles = css({
  position: 'absolute',
  top: spacing[2],
  right: spacing[2],
  hover: {
    cursor: 'pointer',
  },
  width: spacing[7],
  height: spacing[7],
});

const favoriteButtonContentStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
});

const formHeaderStyles = css({
  button: {
    visibility: 'hidden',
  },
  '&:hover': {
    button: {
      visibility: 'visible',
    },
  },
});

const editFavoriteButtonStyles = css({
  verticalAlign: 'text-top',
});

const favoriteButtonLabelStyles = css({
  paddingTop: spacing[1],
  color: palette.black,
  fontWeight: 'bold',
  fontSize: 12,
});

const connectionStringErrorStyles = css({
  marginBottom: spacing[3],
});

function ConnectForm({
  darkMode,
  initialConnectionInfo,
  connectionErrorMessage,
  onConnectClicked,
  // The connect form will not always used in an environment where
  // the connection info can be saved.
  onSaveConnectionClicked,
}: {
  darkMode?: boolean;
  initialConnectionInfo: ConnectionInfo;
  connectionErrorMessage?: string | null;
  onConnectClicked: (connectionInfo: ConnectionInfo) => void;
  onSaveConnectionClicked?: (connectionInfo: ConnectionInfo) => Promise<void>;
}): React.ReactElement {
  const [
    {
      enableEditingConnectionString,
      isDirty,
      errors,
      warnings,
      connectionOptions,
    },
    { setEnableEditingConnectionString, updateConnectionFormField, setErrors },
  ] = useConnectForm(initialConnectionInfo, connectionErrorMessage);

  type SaveConnectionModalState = 'hidden' | 'save' | 'saveAndConnect';

  const [saveConnectionModal, setSaveConnectionModal] =
    useState<SaveConnectionModalState>('hidden');

  const connectionStringInvalidError = errors.find(
    (error) => error.fieldName === 'connectionString'
  );

  const onSubmitForm = useCallback(
    (connectionInfo?: ConnectionInfo) => {
      const updatedConnectionOptions = cloneDeep(connectionOptions);
      const formErrors = validateConnectionOptionsErrors(
        updatedConnectionOptions
      );
      if (formErrors.length) {
        setErrors(formErrors);
        return;
      }
      onConnectClicked({
        ...initialConnectionInfo,
        // If connectionInfo is passed in that will be used similar to if there
        // was initialConnectionInfo. Useful for connecting to a new favorite that
        // was just added.
        ...connectionInfo,
        connectionOptions: updatedConnectionOptions,
      });
    },
    [initialConnectionInfo, onConnectClicked, setErrors, connectionOptions]
  );

  const callOnSaveConnectionClickedAndStoreErrors = useCallback(
    async (connectionInfo: ConnectionInfo): Promise<void> => {
      try {
        await onSaveConnectionClicked?.(connectionInfo);
      } catch (err) {
        // save errors are already handled as toast notifications,
        // keeping so we don't rely too much on far-away code and leave errors
        // uncaught in case that code would change
        setErrors([
          {
            message: `Unable to save connection: ${(err as Error).message}`,
          },
        ]);
      }
    },
    [onSaveConnectionClicked, setErrors]
  );

  return (
    <>
      <div className={formContainerStyles} data-testid="connection-form">
        <Card
          className={cx(
            formCardStyles,
            darkMode ? formCardDarkThemeStyles : formCardLightThemeStyles
          )}
        >
          <form
            className={formStyles}
            onSubmit={(e) => {
              // Prevent default html page refresh.
              e.preventDefault();
              onSubmitForm();
            }}
            // Prevent default html tooltip popups.
            noValidate
          >
            <div className={formContentContainerStyles}>
              <H3 className={formHeaderStyles}>
                {initialConnectionInfo.favorite?.name ?? 'New Connection'}
                {!!onSaveConnectionClicked && (
                  <IconButton
                    type="button"
                    aria-label="Save Connection"
                    data-testid="edit-favorite-name-button"
                    className={editFavoriteButtonStyles}
                    onClick={() => {
                      setSaveConnectionModal('save');
                    }}
                  >
                    <Icon glyph="Edit" />
                  </IconButton>
                )}
              </H3>
              <Description className={descriptionStyles}>
                Connect to a MongoDB deployment
              </Description>
              {!!onSaveConnectionClicked && (
                <IconButton
                  aria-label="Save Connection"
                  data-testid="edit-favorite-icon-button"
                  type="button"
                  className={favoriteButtonStyles}
                  size="large"
                  onClick={() => {
                    setSaveConnectionModal('save');
                  }}
                >
                  <div className={favoriteButtonContentStyles}>
                    <FavoriteIcon
                      isFavorite={!!initialConnectionInfo.favorite}
                      size={spacing[5]}
                    />
                    <span className={favoriteButtonLabelStyles}>FAVORITE</span>
                  </div>
                </IconButton>
              )}
              <ConnectionStringInput
                connectionString={connectionOptions.connectionString}
                enableEditingConnectionString={enableEditingConnectionString}
                setEnableEditingConnectionString={
                  setEnableEditingConnectionString
                }
                onSubmit={() => onSubmitForm()}
                updateConnectionFormField={updateConnectionFormField}
              />
              {connectionStringInvalidError && (
                <Banner
                  className={connectionStringErrorStyles}
                  variant={BannerVariant.Danger}
                >
                  {connectionStringInvalidError.message}
                </Banner>
              )}
              <AdvancedConnectionOptions
                errors={connectionStringInvalidError ? [] : errors}
                disabled={!!connectionStringInvalidError}
                updateConnectionFormField={updateConnectionFormField}
                connectionOptions={connectionOptions}
              />
            </div>
            <div className={formFooterStyles}>
              <ConnectFormActions
                errors={connectionStringInvalidError ? [] : errors}
                warnings={connectionStringInvalidError ? [] : warnings}
                saveButton={
                  isDirty || !initialConnectionInfo.favorite
                    ? 'enabled'
                    : 'disabled'
                }
                saveAndConnectButton={
                  initialConnectionInfo.favorite ? 'hidden' : 'enabled'
                }
                onSaveClicked={() => {
                  if (initialConnectionInfo.favorite) {
                    void callOnSaveConnectionClickedAndStoreErrors({
                      ...cloneDeep(initialConnectionInfo),
                      connectionOptions: cloneDeep(connectionOptions),
                    });
                  } else {
                    setSaveConnectionModal('save');
                  }
                }}
                onSaveAndConnectClicked={() => {
                  setSaveConnectionModal('saveAndConnect');
                }}
                onConnectClicked={() => onSubmitForm()}
              />
            </div>
          </form>
        </Card>
      </div>
      {!!onSaveConnectionClicked && (
        <SaveConnectionModal
          open={saveConnectionModal !== 'hidden'}
          saveText={
            saveConnectionModal === 'saveAndConnect' ? 'Save & Connect' : 'Save'
          }
          onCancelClicked={() => {
            setSaveConnectionModal('hidden');
          }}
          onSaveClicked={async (favoriteInfo: ConnectionFavoriteOptions) => {
            setSaveConnectionModal('hidden');

            const connectionInfo = {
              ...cloneDeep(initialConnectionInfo),
              connectionOptions: cloneDeep(connectionOptions),
              favorite: {
                ...favoriteInfo,
              },
            };
            await callOnSaveConnectionClickedAndStoreErrors(connectionInfo);

            if (saveConnectionModal === 'saveAndConnect') {
              // Connect to the newly created favorite
              onSubmitForm(connectionInfo);
            }
          }}
          key={initialConnectionInfo.id}
          initialFavoriteInfo={initialConnectionInfo.favorite}
        />
      )}
    </>
  );
}

export default withTheme(ConnectForm);
