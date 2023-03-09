import React, {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Button,
  FavoriteIcon,
  H3,
  Icon,
  palette,
  spacing,
  css,
  cx,
  useDarkMode,
  useHoverState,
  ItemActionControls,
  SpinLoader,
  Logo,
  openToast,
} from '@mongodb-js/compass-components';
import type { ItemAction } from '@mongodb-js/compass-components';
import type { ConnectionInfo } from 'mongodb-data-service';

import Connection from './connection';
import ConnectionsTitle from './connections-title';
import { ipcRenderer } from 'hadron-ipc';

const newConnectionButtonContainerStyles = css({
  padding: spacing[3],
});

const newConnectionButtonStyles = css({
  width: '100%',
  justifyContent: 'center',
  fontWeight: 'bold',
  '> div': {
    width: 'auto',
  },
});

const newConnectionButtonStylesLight = css({
  backgroundColor: palette.white,
});
const newConnectionButtonStylesDark = css({
  backgroundColor: palette.gray.dark2,
});

const sectionHeaderStyles = css({
  marginTop: spacing[4],
  marginBottom: spacing[3],
  paddingLeft: spacing[3],
  paddingRight: spacing[2],
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing[2],
  ':hover': {},
});

const recentHeaderStyles = css({
  marginTop: spacing[4],
});

const sectionHeaderTitleStyles = css({
  flex: 1,
  fontSize: '16px',
  lineHeight: '24px',
  fontWeight: 700,
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  maxWidth: '100%',
  width: '100%',
});

const sectionHeaderTitleStylesLight = css({
  color: palette.gray.dark3,
});

const sectionHeaderTitleStylesDark = css({
  color: 'white',
});

const sectionHeaderIconStyles = css({
  fontSize: spacing[3],
  margin: 0,
  padding: 0,
  display: 'flex',
  flex: 'none',
});

const connectionListSectionStyles = css({
  overflowY: 'auto',
  padding: 0,
  paddingBottom: spacing[3],
});

const connectionListStyles = css({
  listStyleType: 'none',
  margin: 0,
  padding: 0,
});

function RecentIcon() {
  const darkMode = useDarkMode();

  const color = darkMode ? 'white' : palette.gray.dark3;

  return (
    <svg
      width={spacing[4]}
      height={spacing[4]}
      viewBox="0 0 24 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.66663 11.6667C9.66663 14.0566 11.6101 16 14 16C16.3899 16 18.3333 14.0566 18.3333 11.6667C18.3333 9.27677 16.3899 7.33333 14 7.33333C11.6101 7.33333 9.66663 9.27677 9.66663 11.6667Z"
        stroke={color}
      />
      <path
        d="M4.99998 12.449C4.99998 12.2348 4.99998 12.0475 4.99998 11.8333C4.99998 6.96162 8.9616 3 13.8333 3C18.705 3 22.6666 6.96162 22.6666 11.8333C22.6666 16.705 18.705 20.6667 13.8333 20.6667M1.33331 9L4.63998 12.1795C4.85331 12.3846 5.17331 12.3846 5.35998 12.1795L8.66665 9"
        stroke={color}
        strokeMiterlimit="10"
      />
      <path d="M13.6666 10V12H15.6666" stroke={color} strokeMiterlimit="10" />
    </svg>
  );
}

export type ConnectionInfoFavorite = ConnectionInfo &
  Required<Pick<ConnectionInfo, 'favorite'>>;

type FavoriteAction = 'import-favorites' | 'export-favorites';

const favoriteActions: ItemAction<FavoriteAction>[] = [
  {
    action: 'import-favorites',
    label: 'Import saved connections',
    icon: 'Download',
  },
  {
    action: 'export-favorites',
    label: 'Export saved connections',
    icon: 'Export',
  },
];

const baseUrl = 'https://cloud.mongodb.com/v2/';
const ndsBaseUrl = 'https://cloud.mongodb.com/nds/';

const atlasClient = {
  async getGroupId() {
    const res = await fetch('https://cloud.mongodb.com');
    if (res.status === 200 && res.redirected) {
      return res.url.replace(baseUrl, '');
    } else {
      throw new Error(`Failed to fetch: ${res.statusText} (${res.status})`);
    }
  },
  async getGroupParams(groupId: string) {
    return await (await fetch(`${baseUrl}${groupId}/params`)).json();
  },
  async getClusters(groupId: string) {
    return await (await fetch(`${ndsBaseUrl}clusters/${groupId}`)).json();
  },
  async getADF(groupId: string) {
    return await (
      await fetch(
        `${ndsBaseUrl}dataLakes/${groupId}/tenants?includeStorage=true`
      )
    ).json();
  },
};

const loginButtonContainerStyles = css({
  marginTop: '12px',
  marginRight: spacing[3],
  marginBottom: spacing[3],
  marginLeft: spacing[3],
});

const loginButtonStyles = css({
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  width: '100%',
});

const logoContainerStyles = css({
  width: spacing[4],
  height: spacing[4],
});

const logoStyles = css({
  display: 'block',
  margin: '0 auto',
});

const AtlasClusters: React.FunctionComponent<{
  onConnectionClick: any;
  onConnectionDoubleClick: any;
  activeConnectionId: any;
}> = ({ onConnectionClick, onConnectionDoubleClick, activeConnectionId }) => {
  const mounted = useRef(true);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [initialCheck, setInitialCheck] = useState(false);
  const [orgParams, setOrgParams] = useState<any>(null);
  const [clusters, setClusters] = useState<any[]>([]);
  const [adf, setADF] = useState<any[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  // useEffect(() => {
  //   let canceled = false;
  //   void ipcRenderer.invoke('is-atlas-session').then((hasSession) => {
  //     if (canceled) {
  //       return;
  //     }
  //     setHasSession(hasSession);
  //     setInitialCheck(true);
  //   });
  //   return () => {
  //     canceled = true;
  //   };
  // }, []);

  const onConnectAtlasClick = useCallback(() => {
    setLoading(true);
    void ipcRenderer
      .invoke('start-atlas-login')
      .then(async () => {
        // Get org id first
        const groupId = await atlasClient.getGroupId();
        setGroupId(groupId);
        const [params, clusters, adf] = await Promise.all([
          atlasClient.getGroupParams(groupId),
          atlasClient.getClusters(groupId),
          atlasClient.getADF(groupId),
        ]);
        const { firstName, lastName, primaryEmail } = params.appUser;
        openToast('atlas-login', {
          variant: 'success',
          body: `Signed in as ${firstName} ${lastName} (${primaryEmail})`,
          timeout: 6000,
        });
        setOrgParams(params);
        setClusters(clusters);
        setADF(adf);
      })
      .catch((reason) => {
        setLoading(false);
        openToast('atlas-login', {
          variant: 'warning',
          title: 'Failed to sign in',
          body: reason.message,
          timeout: 6000,
        });
        void ipcRenderer.invoke('atlas-logout');
      });
  }, []);

  console.log({ atlasOrgId: groupId, orgParams, clusters, adf, error });

  // if (!initialCheck) {
  //   return (
  //     <div>
  //       <SpinLoader></SpinLoader>
  //     </div>
  //   );
  // }

  if (orgParams) {
    return (
      <>
        <div className={sectionHeaderStyles}>
          <div className={logoContainerStyles}>
            <Logo
              className={logoStyles}
              name="MongoDBLogoMark"
              color="black"
              height={24}
            ></Logo>
          </div>
          <H3
            className={sectionHeaderTitleStyles}
            title={orgParams.currentGroup.name}
          >
            {orgParams.currentGroup.name}
          </H3>
        </div>
        <ul className={connectionListStyles}>
          {clusters.map((cluster) => {
            const info: ConnectionInfo = {
              id: `atlas-${cluster.uniqueId}`,
              favorite: {
                name: cluster.name,
                lastUpdateDate: new Date(cluster.lastUpdateDate),
                type: cluster['@provider'],
              },
              connectionOptions: {
                connectionString: `mongodb+srv://${cluster.srvAddress}/test`,
              },
            };
            return (
              <li data-testid="atlas-connection" key={info.id}>
                <Connection
                  isActive={activeConnectionId === info.id}
                  connectionInfo={info}
                  onClick={() => onConnectionClick(info)}
                  onDoubleClick={() => onConnectionDoubleClick(info)}
                />
              </li>
            );
          })}
          {adf.map((adf) => {
            const info: ConnectionInfo = {
              id: `adf-${adf.tenantId}`,
              favorite: {
                name: adf.name,
                lastUpdateDate: new Date(adf.lastUpdatedDate),
                type: 'ADF',
              },
              connectionOptions: {
                connectionString: `mongodb://${adf.privateLinkHostname}/test?tls=true&authSource=admin`,
              },
            };
            return (
              <li data-testid="atlas-connection" key={info.id}>
                <Connection
                  isActive={activeConnectionId === info.id}
                  connectionInfo={info}
                  onClick={() => onConnectionClick(info)}
                  onDoubleClick={() => onConnectionDoubleClick(info)}
                />
              </li>
            );
          })}
        </ul>
      </>
    );
  }

  return (
    <div className={loginButtonContainerStyles}>
      <Button
        className={loginButtonStyles}
        variant="primary"
        onClick={onConnectAtlasClick}
        leftGlyph={
          loading ? (
            <SpinLoader></SpinLoader>
          ) : (
            <Logo name="MongoDBLogoMark" color="white" height={22}></Logo>
          )
        }
        disabled={loading}
      >
        Connect your Atlas account
      </Button>
    </div>
  );
};

const AtlasClustersMemo = React.memo(AtlasClusters);

function ConnectionList({
  activeConnectionId,
  recentConnections,
  favoriteConnections,
  createNewConnection,
  setActiveConnectionId,
  setActiveConnectionFromConnectionInfo,
  onDoubleClick,
  removeAllRecentsConnections,
  duplicateConnection,
  removeConnection,
  openConnectionImportExportModal,
}: {
  activeConnectionId?: string;
  recentConnections: ConnectionInfo[];
  favoriteConnections: ConnectionInfo[];
  createNewConnection: () => void;
  setActiveConnectionId: (connectionId: string) => void;
  setActiveConnectionFromConnectionInfo: (
    connectionInfo: ConnectionInfo
  ) => void;
  onDoubleClick: (connectionInfo: ConnectionInfo) => void;
  removeAllRecentsConnections: () => void;
  duplicateConnection: (connectionInfo: ConnectionInfo) => void;
  removeConnection: (connectionInfo: ConnectionInfo) => void;
  openConnectionImportExportModal: (modal: FavoriteAction) => void;
}): React.ReactElement {
  const darkMode = useDarkMode();
  const [recentHoverProps, recentHeaderHover] = useHoverState();
  const [favoriteHoverProps, favoriteHeaderHover] = useHoverState();

  return (
    <Fragment>
      <ConnectionsTitle />
      <div className={newConnectionButtonContainerStyles}>
        <Button
          className={cx(
            newConnectionButtonStyles,
            darkMode
              ? newConnectionButtonStylesDark
              : newConnectionButtonStylesLight
          )}
          onClick={createNewConnection}
          size="default"
          data-testid="new-connection-button"
          rightGlyph={<Icon glyph="Plus" />}
        >
          New connection
        </Button>
      </div>
      <div className={connectionListSectionStyles}>
        <AtlasClustersMemo
          onConnectionClick={setActiveConnectionFromConnectionInfo}
          onConnectionDoubleClick={onDoubleClick}
          activeConnectionId={activeConnectionId}
        ></AtlasClustersMemo>
        <div
          className={sectionHeaderStyles}
          {...favoriteHoverProps}
          data-testid="favorite-connections-list-header"
        >
          <div className={sectionHeaderIconStyles}>
            <FavoriteIcon />
          </div>
          <H3
            className={cx(
              sectionHeaderTitleStyles,
              darkMode
                ? sectionHeaderTitleStylesDark
                : sectionHeaderTitleStylesLight
            )}
          >
            Saved connections
          </H3>
          <ItemActionControls<FavoriteAction>
            data-testid="favorites-menu"
            onAction={openConnectionImportExportModal}
            iconSize="small"
            actions={favoriteActions}
            isVisible={favoriteHeaderHover}
          ></ItemActionControls>
        </div>
        <ul className={connectionListStyles}>
          {favoriteConnections.map((connectionInfo, index) => (
            <li
              data-testid="favorite-connection"
              data-id={`favorite-connection-${
                connectionInfo?.favorite?.name || ''
              }`}
              key={`${connectionInfo.id || ''}-${index}`}
            >
              <Connection
                data-testid="favorite-connection"
                key={`${connectionInfo.id || ''}-${index}`}
                isActive={
                  !!activeConnectionId &&
                  activeConnectionId === connectionInfo.id
                }
                connectionInfo={connectionInfo}
                onClick={() => setActiveConnectionId(connectionInfo.id)}
                onDoubleClick={onDoubleClick}
                removeConnection={removeConnection}
                duplicateConnection={duplicateConnection}
              />
            </li>
          ))}
        </ul>
        <div
          className={cx(sectionHeaderStyles, recentHeaderStyles)}
          {...recentHoverProps}
          data-testid="recent-connections-list-header"
        >
          <div className={sectionHeaderIconStyles}>
            <RecentIcon />
          </div>
          <H3
            data-testid="recents-header"
            className={cx(
              sectionHeaderTitleStyles,
              darkMode
                ? sectionHeaderTitleStylesDark
                : sectionHeaderTitleStylesLight
            )}
          >
            Recents
          </H3>
          {recentHeaderHover && (
            <Button
              onClick={removeAllRecentsConnections}
              variant="default"
              size="xsmall"
            >
              Clear All
            </Button>
          )}
        </div>
        <ul className={connectionListStyles}>
          {recentConnections.map((connectionInfo, index) => (
            <li
              data-testid="recent-connection"
              key={`${connectionInfo.id || ''}-${index}`}
            >
              <Connection
                isActive={
                  !!activeConnectionId &&
                  activeConnectionId === connectionInfo.id
                }
                connectionInfo={connectionInfo}
                onClick={() => setActiveConnectionId(connectionInfo.id)}
                onDoubleClick={onDoubleClick}
                removeConnection={removeConnection}
                duplicateConnection={duplicateConnection}
              />
            </li>
          ))}
        </ul>
      </div>
    </Fragment>
  );
}

export default ConnectionList;
