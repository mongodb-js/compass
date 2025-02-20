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
  H3,
  spacing,
  Select,
  TextInput,
  Option,
  css,
  ConfirmationModalArea,
  createGlyphComponent,
  cx,
  palette,
  useDarkMode,
  Button,
  Icon,
} from '@mongodb-js/compass-components';
import { cloneDeep } from 'lodash';
import ConnectionStringInput from './connection-string-input';
import AdvancedConnectionOptions from './advanced-connection-options';
import { ConnectionFormModalActions } from './connection-form-modal-actions';
import {
  useConnectForm,
  type ConnectionPersonalizationOptions,
  type UpdateConnectionFormField,
} from '../hooks/use-connect-form';
import { validateConnectionOptionsErrors } from '../utils/validation';
import type { ConnectionFormSettings } from '../hooks/use-connect-form-settings';
import {
  ConnectionFormSettingsContext,
  useConnectionFormSetting,
} from '../hooks/use-connect-form-settings';
import { useConnectionColor } from '../hooks/use-connection-color';
import FormHelp from './form-help/form-help';

const descriptionStyles = css({
  marginTop: spacing[200],
});

const formStyles = css({
  display: 'grid',
  gridTemplateAreas: `
    "header"
    "content"
    "footer"
  `,
  gridTemplateRows: 'max-content 1fr max-content',

  minHeight: 0,
  height: '100%',
});

const formHeaderStyles = css({
  gridArea: 'header',

  paddingTop: spacing[600],
  paddingLeft: spacing[600],
  paddingRight: spacing[600],
});

const formHeaderContentStyles = css({
  position: 'relative',
});

const formContentContainerStyles = css({
  gridArea: 'content',

  display: 'flex',
  gap: spacing[400],

  paddingLeft: spacing[600],
  paddingRight: spacing[600],

  overflowY: 'auto',
  scrollbarGutter: 'stable',
});

const formContentStyles = css({
  minWidth: 0,
  flex: '1 1 auto',

  // To prevent input outline being cut by the overflow
  paddingLeft: spacing[100],

  // Adds some scrollable spacing to the end of the form. Needs to be applied to
  // the child so that the form is scrollable with the padding and not with
  // padding cutting the form content at the end
  '& > :last-child': {
    paddingBottom: spacing[600],
  },
});

const formHelpContainerStyles = css({
  position: 'sticky',
  top: 0,

  flex: '1 1 0px',
  minWidth: spacing[1600] * 4,
  maxWidth: spacing[1600] * 5,
});

const formFooterStyles = css({
  gridArea: 'footer',
});

const formFooterBorderDarkModeStyles = css({
  borderTop: `1px solid ${palette.gray.dark2}`,
});

const formFooterBorderLightModeStyles = css({
  borderTop: `1px solid ${palette.gray.light2}`,
});

const headingWithHiddenButtonStyles = css({
  button: {
    visibility: 'hidden',
  },
  '&:hover': {
    button: {
      visibility: 'visible',
    },
  },
});

const bannerStyles = css({
  marginTop: spacing[400],
  paddingRight: 0,
});
const disabledConnectedConnectionContentStyles = css({
  display: 'flex',
  gap: spacing[400],
  alignItems: 'center',
});

const connectionStringErrorStyles = css({
  marginBottom: spacing[400],
});

const colorPreviewStyles = css({
  height: spacing[400],
  width: spacing[400],
});

type ColorCircleGlyphProps = { hexColor?: string };
export const ColorCircleGlyph = createGlyphComponent(
  'ColorCircle',
  ({ hexColor, ...props }: any & ColorCircleGlyphProps) => (
    <svg
      {...props}
      className={colorPreviewStyles}
      width={spacing[400]}
      height={spacing[400]}
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
  gap: spacing[600],
  marginBottom: spacing[600],
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
  const showFavoriteActions = useConnectionFormSetting('showFavoriteActions');

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

type ConnectionFormPropsWithoutSettings = {
  darkMode?: boolean;
  initialConnectionInfo: ConnectionInfo;
  connectionErrorMessage?: string | null;
  disableEditingConnectedConnection?: boolean;
  onDisconnectClicked?: () => void;
  onAdvancedOptionsToggle?: (newState: boolean) => void;
  openSettingsModal?: (tab?: string) => void;

  // form action buttons:

  onCancel?: () => void;

  // If onSaveClicked is specified, a Save button will show up. It will be the
  // primary button if there is no onSaveAndConnectClick.
  onSaveClicked?: (connectionInfo: ConnectionInfo) => Promise<void>;

  // If onConnectClicked is specified, a Connect button will show up.
  onConnectClicked?: (connectionInfo: ConnectionInfo) => void;

  // If onSaveAndConnectClicked is specified, a button will show up with
  // its label set to the value of the setting saveAndConnectLabel. It will be
  // the primary button if specified. If onConnectClicked is specified, the test
  // id will be save-and-connect-button, otherwise it will be connect-button.
  // For historical/backwards compatible reasons.
  onSaveAndConnectClicked?: (connectionInfo: ConnectionInfo) => void;
};

export type ConnectionFormProps = ConnectionFormPropsWithoutSettings &
  Partial<ConnectionFormSettings>;

function ConnectionForm({
  initialConnectionInfo,
  connectionErrorMessage,
  disableEditingConnectedConnection = false,
  onSaveAndConnectClicked,
  onSaveClicked,
  onConnectClicked,
  onDisconnectClicked,
  onCancel,
  onAdvancedOptionsToggle,
  openSettingsModal,
}: ConnectionFormPropsWithoutSettings): React.ReactElement {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const isDarkMode = useDarkMode();

  const onAdvancedChange = useCallback(
    (newState: boolean) => {
      setAdvancedOpen(newState);
      onAdvancedOptionsToggle?.(newState);
    },
    [onAdvancedOptionsToggle]
  );

  const [
    {
      enableEditingConnectionString: _enableEditingConnectionString,
      errors,
      warnings: _warnings,
      connectionOptions,
      allowEditingIfProtected,
      personalizationOptions,
    },
    { setEnableEditingConnectionString, updateConnectionFormField, setErrors },
  ] = useConnectForm(initialConnectionInfo, connectionErrorMessage);

  const protectConnectionStrings =
    !!useConnectionFormSetting('protectConnectionStrings') &&
    !allowEditingIfProtected;
  const enableEditingConnectionString =
    _enableEditingConnectionString && !protectConnectionStrings;

  const forceConnectionOptions = useConnectionFormSetting(
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
    (favoriteInfo?: ConnectionFavoriteOptions): ConnectionInfo => ({
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
    }),
    [initialConnectionInfo, connectionOptions, personalizationOptions]
  );

  const callOnSaveConnectionClickedAndStoreErrors = useCallback(
    async (connectionInfo: ConnectionInfo): Promise<void> => {
      try {
        await onSaveClicked?.(connectionInfo);
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
    [onSaveClicked, setErrors]
  );
  const onSubmitForm = useCallback(
    (intendedAction?: 'connect' | 'save-and-connect') => {
      const updatedConnectionOptions = cloneDeep(connectionOptions);
      // TODO: this method throws on malformed connection strings instead of
      // returning errors
      const formErrors = validateConnectionOptionsErrors(
        updatedConnectionOptions
      );
      if (formErrors.length) {
        setErrors(formErrors);
        return;
      }
      if (intendedAction === 'connect') {
        // The user explicitly clicked connect, so we use that.
        onConnectClicked?.({
          ...initialConnectionInfo,
          ...getConnectionInfoToSave(),
          connectionOptions: updatedConnectionOptions,
        });
      } else {
        if (onSaveAndConnectClicked) {
          // If there is a save&connect button, we use that action by default.
          onSaveAndConnectClicked?.({
            ...initialConnectionInfo,
            ...getConnectionInfoToSave(),
            connectionOptions: updatedConnectionOptions,
          });
        } else {
          // If there isn't a save&connect button then the next default action
          // should be to save.
          void callOnSaveConnectionClickedAndStoreErrors?.(
            getConnectionInfoToSave()
          );
        }
      }
    },
    [
      connectionOptions,
      setErrors,
      onConnectClicked,
      initialConnectionInfo,
      getConnectionInfoToSave,
      callOnSaveConnectionClickedAndStoreErrors,
      onSaveAndConnectClicked,
    ]
  );

  const showPersonalisationForm = useConnectionFormSetting(
    'showPersonalisationForm'
  );

  const showHelpCardsInForm = useConnectionFormSetting('showHelpCardsInForm');

  /*
  To test onSubmit on a form (ie. what happens when you press {enter} and not
  what happens when you click a submit button) you have to use submit() which only
  works with role="form", but eslint doesn't like that because role="form"
  should be redundant.
  https://stackoverflow.com/questions/59362804/pressing-enter-to-submit-form-in-react-testing-library-does-not-work
  */
  /* eslint-disable jsx-a11y/no-redundant-roles */
  return (
    <ConfirmationModalArea>
      <form
        role="form"
        className={formStyles}
        onSubmit={(e) => {
          // Prevent default html page refresh.
          e.preventDefault();
          onSubmitForm();
        }}
        // Prevent default html tooltip popups.
        noValidate
      >
        <div className={formHeaderStyles}>
          <div className={formHeaderContentStyles}>
            <H3 className={headingWithHiddenButtonStyles}>
              {(initialConnectionInfo.favorite?.name ?? 'New Connection') ||
                'Edit Connection'}
            </H3>
            <Description className={descriptionStyles}>
              Manage your connection settings
            </Description>
          </div>
        </div>

        <div className={formContentContainerStyles}>
          <div className={formContentStyles}>
            {disableEditingConnectedConnection && onDisconnectClicked && (
              <Banner
                data-testid="disabled-connected-connection-banner"
                className={bannerStyles}
              >
                <div className={disabledConnectedConnectionContentStyles}>
                  <div>
                    While connected, you may only personalize your
                    connection&apos;s name, color or favorite status. To fully
                    configure it, you must first disconnect. Beware that
                    disconnecting might cause work in progress to be lost.
                  </div>
                  <div>
                    <Button
                      size="small"
                      leftGlyph={<Icon glyph="Disconnect" />}
                      onClick={onDisconnectClicked}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              </Banner>
            )}
            {protectConnectionStrings && !disableEditingConnectedConnection && (
              <Banner
                data-testid="protect-connection-strings-banner"
                className={bannerStyles}
              >
                Advanced Connection Options are hidden while the &quot;Protect
                Connection String Secrets&quot; setting is enabled. Disable the
                setting to configure Advanced Connection Options or edit your
                connection string.
              </Banner>
            )}
            <ConnectionStringInput
              connectionString={connectionOptions.connectionString}
              enableEditingConnectionString={enableEditingConnectionString}
              disableEditingConnectedConnection={
                !!disableEditingConnectedConnection
              }
              setEnableEditingConnectionString={
                setEnableEditingConnectionString
              }
              onSubmit={onSubmitForm}
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
            {showPersonalisationForm && (
              <ConnectionPersonalizationForm
                personalizationOptions={personalizationOptions}
                updateConnectionFormField={updateConnectionFormField}
              />
            )}
            {!(
              protectConnectionStrings || disableEditingConnectedConnection
            ) && (
              <AdvancedConnectionOptions
                open={advancedOpen}
                setOpen={onAdvancedChange}
                errors={connectionStringInvalidError ? [] : errors}
                disabled={
                  !!(
                    connectionStringInvalidError ||
                    disableEditingConnectedConnection
                  )
                }
                updateConnectionFormField={updateConnectionFormField}
                connectionOptions={connectionOptions}
                openSettingsModal={openSettingsModal}
              />
            )}
          </div>

          {showHelpCardsInForm && (
            <div className={formHelpContainerStyles}>
              <FormHelp />
            </div>
          )}
        </div>

        <div
          className={cx(
            formFooterStyles,
            isDarkMode
              ? formFooterBorderDarkModeStyles
              : formFooterBorderLightModeStyles
          )}
        >
          <ConnectionFormModalActions
            errors={connectionStringInvalidError ? [] : errors}
            warnings={connectionStringInvalidError ? [] : warnings}
            onCancel={onCancel}
            onSave={
              onSaveClicked
                ? () =>
                    void callOnSaveConnectionClickedAndStoreErrors?.(
                      getConnectionInfoToSave()
                    )
                : undefined
            }
            onConnect={
              onConnectClicked ? () => onSubmitForm('connect') : undefined
            }
            onSaveAndConnect={
              onSaveAndConnectClicked
                ? () => onSubmitForm('save-and-connect')
                : undefined
            }
          />
        </div>
      </form>
    </ConfirmationModalArea>
  );
  /* eslint-enable jsx-a11y/no-redundant-roles */
}

const ConnectionFormWithSettings: React.FunctionComponent<
  ConnectionFormPropsWithoutSettings & Partial<ConnectionFormSettings>
> = ({
  showFavoriteActions,
  showHelpCardsInForm,
  showPersonalisationForm,
  protectConnectionStrings,
  forceConnectionOptions,
  showKerberosPasswordField,
  showOIDCDeviceAuthFlow,
  enableOidc,
  enableDebugUseCsfleSchemaMap,
  protectConnectionStringsForNewConnections,
  showOIDCAuth,
  showKerberosAuth,
  showCSFLE,
  showProxySettings,
  saveAndConnectLabel,
  ...rest
}) => {
  const value = useMemo(
    () => ({
      showFavoriteActions,
      showHelpCardsInForm,
      showPersonalisationForm,
      protectConnectionStrings,
      forceConnectionOptions,
      showKerberosPasswordField,
      showOIDCDeviceAuthFlow,
      enableOidc,
      enableDebugUseCsfleSchemaMap,
      protectConnectionStringsForNewConnections,
      showOIDCAuth,
      showKerberosAuth,
      showCSFLE,
      showProxySettings,
      saveAndConnectLabel,
    }),
    [
      showFavoriteActions,
      showHelpCardsInForm,
      showPersonalisationForm,
      protectConnectionStrings,
      forceConnectionOptions,
      showKerberosPasswordField,
      showOIDCDeviceAuthFlow,
      enableOidc,
      enableDebugUseCsfleSchemaMap,
      protectConnectionStringsForNewConnections,
      showOIDCAuth,
      showKerberosAuth,
      showCSFLE,
      showProxySettings,
      saveAndConnectLabel,
    ]
  );

  return (
    <ConnectionFormSettingsContext.Provider value={value}>
      <ConnectionForm {...rest} />
    </ConnectionFormSettingsContext.Provider>
  );
};

export default ConnectionFormWithSettings;
