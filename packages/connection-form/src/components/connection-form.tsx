import React, { useCallback, useMemo, useState } from 'react';
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
  ConfirmationModalArea,
  createGlyphComponent,
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
  type ConnectionPersonalizationOptions,
  type UpdateConnectionFormField,
} from '../hooks/use-connect-form';
import { validateConnectionOptionsErrors } from '../utils/validation';
import SaveConnectionModal from './save-connection-modal';
import type { ConnectionFormPreferences } from '../hooks/use-connect-form-preferences';
import {
  ConnectionFormPreferencesContext,
  useConnectionFormPreference,
} from '../hooks/use-connect-form-preferences';
import { useConnectionColor } from '../hooks/use-connection-color';
import FormHelp from './form-help/form-help';

const descriptionStyles = css({
  marginTop: spacing[2],
});

const formStyles = css({
  display: 'contents',
});

const formContainerStyles = css({
  padding: spacing[4],
  overflowY: 'auto',
  position: 'relative',
});

const formContentStyles = css({
  display: 'flex',
  columnGap: spacing[3],
});

const formSettingsStyles = css({
  width: '100%',
  maxHeight: '530px',
  overflow: 'auto',
  scrollbarGutter: 'stable',
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
  onCancel?: () => void;
  onConnectClicked: (connectionInfo: ConnectionInfo) => void;
  onSaveConnectionClicked: (connectionInfo: ConnectionInfo) => Promise<void>;
};

const colorPreviewStyles = css({
  height: spacing[3],
  width: spacing[3],
  marginRight: spacing[2],
});

type ColorCircleGlyphProps = { hexColor?: string };
const ColorCircleGlyph = createGlyphComponent(
  'ColorCircle',
  ({ hexColor, ...props }: any & ColorCircleGlyphProps) => (
    <svg
      {...props}
      className={colorPreviewStyles}
      width={spacing[3]}
      height={spacing[3]}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_756_18092)">
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
        fill={hexColor}
      />
      <defs>
        <clipPath id="clip0_756_18092">
          <rect width="16" height="16" rx="8" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
) as React.FunctionComponent<ColorCircleGlyphProps>;

const personalizationSectionLayoutStyles = css({
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

const personalizationNameInputStyles = css({
  gridArea: 'name-input',
});

const personalizationColorInputStyles = css({
  gridArea: 'color-input',
});

const personalizationFavoriteMarkerStyles = css({
  gridArea: 'favorite-marker',
});

type ConnectionPersonalizationFormProps = {
  personalizationOptions: ConnectionPersonalizationOptions;
  updateConnectionFormField: UpdateConnectionFormField;
};

function ConnectionPersonalizationForm({
  updateConnectionFormField,
  personalizationOptions,
}: ConnectionPersonalizationFormProps): React.ReactElement {
  const showFavoriteActions = useConnectionFormPreference(
    'showFavoriteActions'
  );

  const onChangeName = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      updateConnectionFormField({
        type: 'update-connection-personalization',
        ...personalizationOptions,
        name: ev.target.value,
        isNameDirty: true,
      });
    },
    [updateConnectionFormField, personalizationOptions]
  );

  const onChangeColor = useCallback(
    (newValue: string) => {
      updateConnectionFormField({
        type: 'update-connection-personalization',
        ...personalizationOptions,
        color: newValue,
      });
    },
    [updateConnectionFormField, personalizationOptions]
  );

  const onChangeFavorite = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      updateConnectionFormField({
        type: 'update-connection-personalization',
        ...personalizationOptions,
        isFavorite: ev.target.checked,
      });
    },
    [updateConnectionFormField, personalizationOptions]
  );

  const { connectionColorToHex, connectionColorToName, connectionColorCodes } =
    useConnectionColor();

  return (
    <div className={personalizationSectionLayoutStyles}>
      <TextInput
        className={personalizationNameInputStyles}
        value={personalizationOptions.name}
        data-testid="personalization-name-input"
        onChange={onChangeName}
        label="Name"
      />
      <Select
        className={personalizationColorInputStyles}
        data-testid="personalization-color-input"
        label="Color"
        defaultValue={personalizationOptions.color || 'no-color'}
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
            key={colorCode}
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
        <Checkbox
          className={personalizationFavoriteMarkerStyles}
          onChange={onChangeFavorite}
          data-testid="personalization-favorite-checkbox"
          checked={personalizationOptions.isFavorite}
          label={<b>Favorite this connection</b>}
          description="Favoriting a connection will pin it to the top of your list of
        connections"
        />
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
  onCancel,
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
      personalizationOptions,
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

  const getConnectionInfoToSave = useCallback(
    (favoriteInfo?: ConnectionFavoriteOptions): ConnectionInfo => {
      if (isMultiConnectionEnabled) {
        return {
          ...cloneDeep(initialConnectionInfo),
          connectionOptions: cloneDeep(connectionOptions),
          savedConnectionType: personalizationOptions.isFavorite
            ? 'favorite'
            : 'recent',
          favorite: {
            ...(favoriteInfo || {}),
            name: personalizationOptions.name,
            color: personalizationOptions.color,
          },
        };
      } else {
        return {
          ...cloneDeep(initialConnectionInfo),
          connectionOptions: cloneDeep(connectionOptions),
          savedConnectionType: 'favorite',
          favorite: {
            name: '',
            color: undefined,
            ...favoriteInfo,
          },
        };
      }
    },
    [
      isMultiConnectionEnabled,
      initialConnectionInfo,
      connectionOptions,
      personalizationOptions,
    ]
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
        <div className={formContainerStyles}>
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
            {!isMultiConnectionEnabled && 'Connect to a MongoDB deployment'}
            {isMultiConnectionEnabled && 'Manage your connection settings'}
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
          <div className={formContentStyles}>
            <div className={formSettingsStyles}>
              <ConnectionStringInput
                connectionString={connectionOptions.connectionString}
                enableEditingConnectionString={enableEditingConnectionString}
                setEnableEditingConnectionString={
                  setEnableEditingConnectionString
                }
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
                <ConnectionPersonalizationForm
                  personalizationOptions={personalizationOptions}
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
            {isMultiConnectionEnabled && <FormHelp />}
          </div>
        </div>
        <div className={formFooterStyles}>
          {isMultiConnectionEnabled && (
            <ConnectionFormModalActions
              errors={connectionStringInvalidError ? [] : errors}
              warnings={connectionStringInvalidError ? [] : warnings}
              onCancel={onCancel}
              onSave={() =>
                void callOnSaveConnectionClickedAndStoreErrors?.(
                  getConnectionInfoToSave()
                )
              }
              onConnect={() => {
                void callOnSaveConnectionClickedAndStoreErrors?.(
                  getConnectionInfoToSave()
                );
                onSubmitForm();
              }}
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

            const connectionInfo = getConnectionInfoToSave(favoriteInfo);
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
