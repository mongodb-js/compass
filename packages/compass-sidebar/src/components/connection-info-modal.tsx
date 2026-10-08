import React from 'react';
import { connect } from 'react-redux';
import {
  InfoModal,
  Body,
  css,
  spacing,
  useTranslation,
  Translated,
} from '@mongodb-js/compass-components';
import { ServerType, TopologyType } from 'mongodb-instance-model';
import type { ConnectionInfo as ConnectionStorageConnectionInfo } from '@mongodb-js/connection-info';
import type { RootState } from '../modules';
import type { Database } from '../modules/databases';
import type { SingleConnectionOptionsState } from '../modules/connection-options';
import type { SingleInstanceState } from '../modules/instance';

type ConnectionInfo = {
  term: React.ReactChild;
  description: React.ReactChild;
};

const infoContainer = css({
  margin: `${spacing[400]}px 0`,
});

function InfoTerm({ children }: { children: React.ReactChild }) {
  return <Body weight="medium">{children}</Body>;
}
function InfoDescription({ children }: { children: React.ReactChild }) {
  return <Body>{children}</Body>;
}

function Info({
  term,
  children,
}: {
  term: React.ReactChild;
  children: React.ReactChild;
}) {
  return (
    <div className={infoContainer}>
      <dt>
        <InfoTerm>{term}</InfoTerm>
      </dt>
      <dd>
        <InfoDescription>{children}</InfoDescription>
      </dd>
    </div>
  );
}

export function ConnectionInfoModal({
  isVisible,
  close,
  infos = [],
}: {
  connectionInfo?: ConnectionStorageConnectionInfo;
  isVisible: boolean;
  close: () => void;
  infos?: ConnectionInfo[];
}) {
  const t = useTranslation();
  return (
    <InfoModal
      title={t('sidebar.connectionInfo.title', 'Connection info')}
      open={isVisible}
      onClose={close}
      size="small"
      data-testid="connection-info-modal"
    >
      <dl>
        {infos.map((info, i) => (
          <Info key={i} term={info.term}>
            {info.description}
          </Info>
        ))}
      </dl>
    </InfoModal>
  );
}

function getVersionDistro({
  isEnterprise,
  isAtlas,
  isLocalAtlas,
}: {
  isEnterprise?: boolean;
  isAtlas?: boolean;
  isLocalAtlas?: boolean;
}): string {
  if (isAtlas) {
    return 'Atlas';
  }

  if (isLocalAtlas) {
    return 'AtlasLocalDev';
  }

  // it is unknown until instance details are loaded
  if (typeof isEnterprise === 'undefined') {
    return '';
  }

  return isEnterprise ? 'Enterprise' : 'Community';
}

type InfoParameters = {
  instance: SingleInstanceState;
  connectionOptions: SingleConnectionOptionsState;
  databases: Database[];
  connectionInfo: Partial<ConnectionStorageConnectionInfo>;
};

function StatsDescription({
  numDbs,
  numCollections,
}: {
  numDbs: number | string;
  numCollections: number | string;
}) {
  const t = useTranslation();
  return (
    <div>
      <div>
        {numDbs === 1
          ? t('sidebar.connectionInfo.dbs.one', '{count} DB', {
              count: numDbs,
            })
          : t('sidebar.connectionInfo.dbs.other', '{count} DBs', {
              count: numDbs,
            })}
      </div>
      <div>
        {numCollections === 1
          ? t('sidebar.connectionInfo.collections.one', '{count} Collection', {
              count: numCollections,
            })
          : t(
              'sidebar.connectionInfo.collections.other',
              '{count} Collections',
              { count: numCollections }
            )}
      </div>
    </div>
  );
}

function getStatsInfo({ instance, databases }: InfoParameters): ConnectionInfo {
  const isReady = instance?.refreshingStatus === 'ready';

  const numDbs = isReady ? databases.length : '-';
  const numCollections = isReady
    ? databases.map((db) => db.collectionsLength).reduce((acc, n) => acc + n, 0)
    : '-';
  return {
    term: <Translated id="sidebar.connectionInfo.stats">Stats</Translated>,
    description: (
      <StatsDescription numDbs={numDbs} numCollections={numCollections} />
    ),
  };
}

function HostHeading({
  isSingleHost,
  isLoadBalanced,
}: {
  isSingleHost: boolean;
  isLoadBalanced: boolean;
}) {
  const t = useTranslation();
  const heading = isSingleHost
    ? t('sidebar.connectionInfo.host', 'Host')
    : t('sidebar.connectionInfo.hosts', 'Hosts');
  return (
    <>
      {isLoadBalanced
        ? `${heading} ${t(
            'sidebar.connectionInfo.loadBalancer',
            '(Load Balancer)'
          )}`
        : heading}
    </>
  );
}

function getHostInfo({ instance }: InfoParameters): ConnectionInfo {
  const { type, servers = [] } = instance?.topologyDescription ?? {};

  const heading = (
    <HostHeading
      isSingleHost={servers.length === 1}
      isLoadBalanced={type === TopologyType.LOAD_BALANCED}
    />
  );

  const hosts =
    servers.length === 1 ? (
      servers[0].address
    ) : (
      <div>
        {servers.map((server, i) => (
          <div key={i}>{server.address}</div>
        ))}
      </div>
    );

  return {
    term: heading,
    description: hosts,
  };
}

function NodesInfo({
  kind,
  numNodes,
}: {
  kind: 'mongos' | 'node';
  numNodes: number;
}) {
  const t = useTranslation();
  const count = numNodes;
  if (kind === 'mongos') {
    return (
      <>
        {numNodes === 1
          ? t('sidebar.connectionInfo.mongos.one', '{count} Mongos', { count })
          : t('sidebar.connectionInfo.mongos.other', '{count} Mongoses', {
              count,
            })}
      </>
    );
  }
  return (
    <>
      {numNodes === 1
        ? t('sidebar.connectionInfo.node.one', '{count} Node', { count })
        : t('sidebar.connectionInfo.node.other', '{count} Nodes', { count })}
    </>
  );
}

function ClusterType({
  type,
  setName,
  serverType,
}: {
  type?: string;
  setName?: string | null;
  serverType?: string;
}) {
  const t = useTranslation();
  switch (type) {
    case TopologyType.SHARDED:
      return <>{t('sidebar.connectionInfo.sharded', 'Sharded')}</>;
    case TopologyType.REPLICA_SET_NO_PRIMARY:
    case TopologyType.REPLICA_SET_WITH_PRIMARY:
      return (
        <>
          {t('sidebar.connectionInfo.replicaSet', 'Replica Set {name}', {
            name: setName ?? '',
          })}
        </>
      );
    default:
      return <>{ServerType.humanize(serverType ?? 'Unknown')}</>;
  }
}

function getClusterInfo({ instance }: InfoParameters): ConnectionInfo {
  const { type, setName, servers = [] } = instance?.topologyDescription ?? {};

  const clusterType = (
    <ClusterType type={type} setName={setName} serverType={servers[0]?.type} />
  );

  let nodesInfo: React.ReactElement | undefined;
  switch (type) {
    case TopologyType.SHARDED:
      nodesInfo = <NodesInfo kind="mongos" numNodes={servers.length} />;
      break;

    case TopologyType.REPLICA_SET_NO_PRIMARY:
    case TopologyType.REPLICA_SET_WITH_PRIMARY:
      nodesInfo = <NodesInfo kind="node" numNodes={servers.length} />;
      break;
  }

  return {
    term: <Translated id="sidebar.connectionInfo.cluster">Cluster</Translated>,
    description: nodesInfo ? (
      <div>
        <div>{clusterType}</div>
        <div>{nodesInfo}</div>
      </div>
    ) : (
      clusterType
    ),
  };
}

function getVersionInfo({ instance }: InfoParameters): ConnectionInfo {
  return {
    term: <Translated id="sidebar.connectionInfo.edition">Edition</Translated>,
    description: instance?.dataLake.isDataLake
      ? `Atlas Data Federation ${instance?.dataLake.version ?? ''}`
      : `MongoDB ${instance?.build.version} ${getVersionDistro({
          isEnterprise: instance?.build.isEnterprise,
          isLocalAtlas: instance?.isLocalAtlas,
          isAtlas: instance?.isAtlas,
        })}`,
  };
}

function getSSHTunnelInfo({
  connectionOptions,
}: InfoParameters): ConnectionInfo {
  const { sshTunnelHostPortString } = connectionOptions;
  return {
    term: (
      <Translated id="sidebar.connectionInfo.sshVia">
        SSH Connection Via
      </Translated>
    ),
    description: sshTunnelHostPortString,
  };
}

function getInfos(infoParameters: InfoParameters) {
  const infos: ConnectionInfo[] = [];

  const { instance, connectionOptions } = infoParameters;

  if (!instance) {
    return infos;
  }

  infos.push(getStatsInfo(infoParameters));

  infos.push(getHostInfo(infoParameters));

  if (
    instance.dataLake.isDataLake === false &&
    instance.topologyDescription.type !== TopologyType.LOAD_BALANCED
  ) {
    infos.push(getClusterInfo(infoParameters));
  }

  infos.push(getVersionInfo(infoParameters));

  if (connectionOptions.sshTunnel) {
    infos.push(getSSHTunnelInfo(infoParameters));
  }

  return infos;
}

const mapStateToProps = (
  state: RootState,
  { connectionInfo }: { connectionInfo?: ConnectionStorageConnectionInfo }
) => {
  if (!connectionInfo) return { infos: [] };

  const instance = state.instance[connectionInfo.id];
  const databases = state.databases[connectionInfo.id];
  const connectionOptions = state.connectionOptions[connectionInfo.id];

  return {
    infos: getInfos({
      instance: instance,
      databases: databases?.databases ?? [],
      connectionInfo: connectionInfo,
      connectionOptions: connectionOptions || {},
    }),
  };
};

const MappedConnectionInfoModal = connect(
  mapStateToProps,
  {}
)(ConnectionInfoModal);

export default MappedConnectionInfoModal;
