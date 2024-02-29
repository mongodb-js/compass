import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ConnectionInfo,
  ConnectionFavoriteOptions,
} from '@mongodb-js/connection-info';
import {
  Banner,
  BannerVariant,
  Checkbox,
  Description,
  FavoriteIcon,
  Icon,
  IconButton,
  Overline,
  H3,
  spacing,
  Select,
  TextInput,
  Option,
  css,
  cx,
  ConfirmationModalArea,
  createGlyphComponent,
  createIconComponent,
} from '@mongodb-js/compass-components';
import { cloneDeep } from 'lodash';
import { usePreference } from 'compass-preferences-model/provider';
import ConnectionStringInput from './connection-string-input';
import AdvancedConnectionOptions from './advanced-connection-options';
import ConnectionFormActions, {
  ConnectionFormModalActions,
} from './connection-form-actions';
import {
  useConnectForm,
  type ConnectionPersonalisationOptions,
} from '../hooks/use-connect-form';
import {
  ConnectionFormError,
  ConnectionFormWarning,
  validateConnectionOptionsErrors,
} from '../utils/validation';
import SaveConnectionModal from './save-connection-modal';
import type { ConnectionFormPreferences } from '../hooks/use-connect-form-preferences';
import {
  ConnectionFormPreferencesContext,
  useConnectionFormPreference,
} from '../hooks/use-connect-form-preferences';
import { useConnectionColor } from '../hooks/use-connection-color';

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
});

const connectionStringErrorStyles = css({
  marginBottom: spacing[3],
});

type ConnectionFormPropsWithoutPreferences = {
  darkMode?: boolean;
  initialConnectionInfo: ConnectionInfo;
  connectionErrorMessage?: string | null;
  onConnectClicked: (connectionInfo: ConnectionInfo) => void;
  onSaveConnectionClicked: (connectionInfo: ConnectionInfo) => Promise<void>;
};

const colorPreviewStyles = css({
  height: '16px',
  width: '16px',
  marginRight: spacing[2],
});

const ColorCircleGlyph = createGlyphComponent('ColorCircle', (props) => (
  <svg
    {...props}
    className={colorPreviewStyles}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clip-path="url(#clip0_756_18092)">
      <line
        opacity="0.5"
        x1="16.3536"
        y1="-0.146447"
        x2="0.353554"
        y2="15.8536"
        stroke="#DB3030"
      />
    </g>
    <rect
      x="0.5"
      y="0.5"
      width="15"
      height="15"
      rx="7.5"
      stroke="#889397"
      fill={props.hexColor}
    />
    <defs>
      <clipPath id="clip0_756_18092">
        <rect width="16" height="16" rx="8" fill="white" />
      </clipPath>
    </defs>
  </svg>
));

const personalisationSectionLayoutStyles = css({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gridTemplateRows: 'auto',
  gridTemplateAreas: `
    'name-input color-input'
    'favorite-marker favorite-marker'
  `,
  gap: spacing[4],
  marginBottom: spacing[4],
});

type ConnectionPersonalisationFormProps = {
  initialValue?: ConnectionPersonalisationOptions;
  updateConnectionFormField: UpdateConnectionFormFieldAction;
};

function ConnectionPersonalisationForm({
  updateConnectionFormField,
  personalisationOptions,
}: ConnectionPersonalisationFormProps): React.ReactElement {
  const showFavoriteActions = useConnectionFormPreference(
    'showFavoriteActions'
  );

  const onChangeName = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      updateConnectionFormField({
        type: 'update-connection-personalisation',
        ...personalisationOptions,
        name: ev.target.value,
        isNameDirty: true,
      });
    },
    [updateConnectionFormField, personalisationOptions]
  );

  const onChangeColor = useCallback(
    (newValue: string) => {
      updateConnectionFormField({
        type: 'update-connection-personalisation',
        ...personalisationOptions,
        color: newValue,
      });
    },
    [updateConnectionFormField, personalisationOptions]
  );

  const onChangeFavorite = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      updateConnectionFormField({
        type: 'update-connection-personalisation',
        ...personalisationOptions,
        isFavorite: ev.target.checked,
      });
    },
    [updateConnectionFormField, personalisationOptions]
  );

  const { connectionColorToHex, connectionColorToName, connectionColorCodes } =
    useConnectionColor();

  return (
    <div className={personalisationSectionLayoutStyles}>
      <TextInput
        value={personalisationOptions.name}
        style={{ gridArea: 'name-input' }}
        onChange={onChangeName}
        label="Name"
      />
      <Select
        style={{ gridArea: 'color-input' }}
        label="Color"
        defaultValue={personalisationOptions.color || 'no-color'}
        allowDeselect={false}
        onChange={onChangeColor}
      >
        <Option
          glyph={<ColorCircleGlyph hexColor="transparent" />}
          value={'no-color'}
        >
          No Color
        </Option>
        {connectionColorCodes().map((colorCode) => (
          <Option
            glyph={
              <ColorCircleGlyph hexColor={connectionColorToHex(colorCode)} />
            }
            value={colorCode}
          >
            {connectionColorToName(colorCode)}
          </Option>
        ))}
      </Select>
      {showFavoriteActions && (
        <div style={{ gridArea: 'favorite-marker' }}>
          <Checkbox
            onChange={onChangeFavorite}
            checked={personalisationOptions.isFavorite}
            label={<b>Favorite this connection</b>}
            description="Favoriting a connection will pin it to the top of your list of
          connections"
          />
        </div>
      )}
    </div>
  );
}

export type ConnectionFormProps = ConnectionFormPropsWithoutPreferences & {
  preferences?: Partial<ConnectionFormPreferences>;
};

function ConnectionForm({
  initialConnectionInfo,
  connectionErrorMessage,
  onConnectClicked,
  // The connect form will not always used in an environment where
  // the connection info can be saved.
  onSaveConnectionClicked,
}: ConnectionFormPropsWithoutPreferences): React.ReactElement {
  const isMultiConnectionEnabled = usePreference(
    'enableNewMultipleConnectionSystem'
  );

  const [
    {
      enableEditingConnectionString: _enableEditingConnectionString,
      isDirty,
      errors,
      warnings: _warnings,
      connectionOptions,
      allowEditingIfProtected,
      personalisationOptions,
    },
    { setEnableEditingConnectionString, updateConnectionFormField, setErrors },
  ] = useConnectForm(initialConnectionInfo, connectionErrorMessage);

  type SaveConnectionModalState = 'hidden' | 'save' | 'saveAndConnect';

  const [saveConnectionModal, setSaveConnectionModal] =
    useState<SaveConnectionModalState>('hidden');
  const protectConnectionStrings =
    !!useConnectionFormPreference('protectConnectionStrings') &&
    !allowEditingIfProtected;
  const enableEditingConnectionString =
    _enableEditingConnectionString && !protectConnectionStrings;

  const forceConnectionOptions = useConnectionFormPreference(
    'forceConnectionOptions'
  );
  const warnings = useMemo(() => {
    if (!forceConnectionOptions?.length) return _warnings;
    const overriddenKeys = forceConnectionOptions.map(([key]) => key);
    return [
      ..._warnings,
      // Do not include values here, only keys, since values might contain sensitive information/credentials
      {
        message: `Some connection options have been overridden through settings: ${overriddenKeys.join(
          ', '
        )}`,
      },
    ];
  }, [_warnings, forceConnectionOptions]);

  const connectionStringInvalidError = errors.find(
    (error) => error.fieldName === 'connectionString'
  );

  const getConnectionInfoToSave = useCallback(() => {
    if (isMultiConnectionEnabled) {
      return {
        ...cloneDeep(initialConnectionInfo),
        connectionOptions: cloneDeep(connectionOptions),
        savedConnectionType: personalisationOptions.isFavorite
          ? 'favorite'
          : 'recent',
        favorite: {
          name: personalisationOptions.name,
          color: personalisationOptions.color,
        },
      };
    } else {
      return {
        ...cloneDeep(initialConnectionInfo),
        connectionOptions: cloneDeep(connectionOptions),
        savedConnectionType: 'favorite',
        favorite: {
          ...favoriteInfo,
        },
      };
    }
  }, [
    isMultiConnectionEnabled,
    initialConnectionInfo,
    connectionOptions,
    personalisationOptions,
  ]);
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

  const showFavoriteActions = useConnectionFormPreference(
    'showFavoriteActions'
  );

  return (
    <ConfirmationModalArea>
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
            {!isMultiConnectionEnabled && showFavoriteActions && (
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
          {!isMultiConnectionEnabled && showFavoriteActions && (
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
                <Overline className={favoriteButtonLabelStyles}>
                  FAVORITE
                </Overline>
              </div>
            </IconButton>
          )}
          <ConnectionStringInput
            connectionString={connectionOptions.connectionString}
            enableEditingConnectionString={enableEditingConnectionString}
            setEnableEditingConnectionString={setEnableEditingConnectionString}
            onSubmit={() => onSubmitForm()}
            updateConnectionFormField={updateConnectionFormField}
            protectConnectionStrings={protectConnectionStrings}
          />
          {connectionStringInvalidError && (
            <Banner
              className={connectionStringErrorStyles}
              variant={BannerVariant.Danger}
            >
              {connectionStringInvalidError.message}
            </Banner>
          )}
          {isMultiConnectionEnabled && (
            <ConnectionPersonalisationForm
              personalisationOptions={personalisationOptions}
              updateConnectionFormField={updateConnectionFormField}
            />
          )}
          {!protectConnectionStrings && (
            <AdvancedConnectionOptions
              errors={connectionStringInvalidError ? [] : errors}
              disabled={!!connectionStringInvalidError}
              updateConnectionFormField={updateConnectionFormField}
              connectionOptions={connectionOptions}
            />
          )}
        </div>
        <div className={formFooterStyles}>
          {isMultiConnectionEnabled && (
            <ConnectionFormModalActions
              errors={connectionStringInvalidError ? [] : errors}
              warnings={connectionStringInvalidError ? [] : warnings}
              onCancel={() => {}}
              onSave={() =>
                callOnSaveConnectionClickedAndStoreErrors?.(
                  getConnectionInfoToSave()
                )
              }
              onConnect={() => {}}
            />
          )}
          {!isMultiConnectionEnabled && (
            <ConnectionFormActions
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
          )}
        </div>
      </form>
      {showFavoriteActions && (
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

            const connectionInfo = getConnectionInfoToSave();
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
    </ConfirmationModalArea>
  );
}

const ConnectionFormWithPreferences = (
  props: ConnectionFormPropsWithoutPreferences & {
    preferences?: Partial<ConnectionFormPreferences>;
  }
) => {
  const { preferences, ...rest } = props;

  return (
    <ConnectionFormPreferencesContext.Provider value={preferences ?? {}}>
      <ConnectionForm {...rest} />
    </ConnectionFormPreferencesContext.Provider>
  );
};

export default ConnectionFormWithPreferences;
