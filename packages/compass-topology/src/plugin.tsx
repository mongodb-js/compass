import {
  Banner,
  Tooltip,
  Card,
  Icon,
  css,
} from '@mongodb-js/compass-components';
import type { MongoClientOptions } from 'mongodb';
import { ConnectionString } from 'mongodb-connection-string-url';
import React from 'react';
import type AppRegistry from 'hadron-app-registry';
import type { Reducer, Store } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { Provider, connect } from 'react-redux';
import type { TopologyType } from 'mongodb';
import type { ConnectionOptions, DataService } from 'mongodb-data-service';
import { connect as connectDataService } from 'mongodb-data-service';
import { cloneDeep } from 'lodash';

type ReplicaSetMemberStatus =
  | 'STARTUP'
  | 'PRIMARY'
  | 'SECONDARY'
  | 'RECOVERING'
  | 'STARTUP2'
  | 'UNKNOWN'
  | 'ARBITER'
  | 'DOWN'
  | 'ROLLBACK'
  | 'REMOVED';

interface GenericServer {
  address: string;
}

interface ReplicaSetMember extends GenericServer {
  status: ReplicaSetMemberStatus;
}

interface ReplicaSetDescription {
  members: ReplicaSetMember[];
  name: string;
  isConfigSet?: boolean;
}

interface Topology {
  type: TopologyType;
  singleHost?: GenericServer;
  replicaSets: ReplicaSetDescription[];
  mongos: GenericServer[];
}

type State = {
  appRegistry?: AppRegistry;
  topology?: Topology;
  dataService?: DataService;
  err?: Error;
};

type Action =
  | {
      type: 'RESET';
    }
  | {
      type: 'APP_REGISTRY_ACTIVATED';
      appRegistry: AppRegistry;
    }
  | {
      type: 'DATA_SERVICE_CONNECTED';
      dataService: DataService;
    }
  | {
      type: 'UPDATE_TOPOLOGY';
      dataService: DataService;
      topology: Topology;
    }
  | {
      type: 'SET_ERROR';
      err: Error;
    };

function reset(): Action {
  return { type: 'RESET' };
}

function appRegistryActivated(appRegistry: AppRegistry): Action {
  return { type: 'APP_REGISTRY_ACTIVATED', appRegistry };
}

function dataServiceConnected(dataService: DataService): Action {
  return { type: 'DATA_SERVICE_CONNECTED', dataService };
}

function updateTopology(dataService: DataService, topology: Topology): Action {
  return { type: 'UPDATE_TOPOLOGY', topology, dataService };
}

function setError(err: Error): Action {
  return { type: 'SET_ERROR', err };
}

const topologyReducer: Reducer<State, Action> = ({ ...state } = {}, action) => {
  switch (action.type) {
    case 'RESET':
      state = {};
      break;
    case 'APP_REGISTRY_ACTIVATED':
      state.appRegistry = action.appRegistry;
      break;
    case 'UPDATE_TOPOLOGY':
      if (state.dataService === action.dataService)
        state.topology = action.topology;
      break;
    case 'DATA_SERVICE_CONNECTED':
      state.dataService = action.dataService;
      break;
    case 'SET_ERROR':
      state = { err: action.err };
      break;
  }
  return state;
};

function replicaSetDescriptionFromStatus(status: any): ReplicaSetDescription {
  return {
    name: status.set,
    members: status.members.map(({ name, stateStr }: any) => ({
      address: name,
      status: stateStr,
    })),
  };
}

function deriveConnectionOptions(
  original: ConnectionOptions,
  hostWithReplsetName: string
) {
  const cloned = cloneDeep(original);
  const cs = new ConnectionString(cloned.connectionString);
  const [replSet, hostList] = hostWithReplsetName.split('/');
  cs.typedSearchParams<MongoClientOptions>().set('replicaSet', replSet);
  cs.hosts = hostList.split(',');
  cloned.connectionString = cs.toString();
  return cloned;
}

async function fetchTopologyInformation(
  store: Store<State, Action>,
  dataService: DataService
): Promise<Topology> {
  const type = dataService.getCurrentTopologyType();
  switch (type) {
    case 'LoadBalanced':
    case 'Sharded': {
      const [shards, mongos, configReplset] = await Promise.all([
        (async function () {
          const shards = await dataService.find('config.shards', {});
          return await Promise.all(
            shards.map(async ({ host }) => {
              let ds: DataService | undefined;
              try {
                ds = await connectDataService({
                  connectionOptions: deriveConnectionOptions(
                    dataService.getConnectionOptions(),
                    host
                  ),
                });
                return replicaSetDescriptionFromStatus(
                  await ds.replSetGetStatus()
                );
              } finally {
                await ds?.disconnect();
              }
            })
          );
        })(),
        (async function () {
          const mongos = await dataService.find('config.mongos', {});
          return mongos.map(({ _id }) => ({ address: _id }));
        })(),
        (async function () {
          const { sharding } = (await dataService.serverStatus()) ?? {};
          const { configsvrConnectionString } = sharding ?? {};

          let ds: DataService | undefined;
          try {
            ds = await connectDataService({
              connectionOptions: deriveConnectionOptions(
                dataService.getConnectionOptions(),
                configsvrConnectionString
              ),
            });
            return {
              ...replicaSetDescriptionFromStatus(await ds.replSetGetStatus()),
              isConfigSet: true,
            };
          } finally {
            await ds?.disconnect();
          }
        })(),
      ]);
      return {
        type,
        mongos,
        replicaSets: [...shards, configReplset],
      };
      break;
    }
    case 'ReplicaSetNoPrimary':
    case 'ReplicaSetWithPrimary': {
      const status = await dataService.replSetGetStatus();
      return {
        type,
        mongos: [],
        replicaSets: [replicaSetDescriptionFromStatus(status)],
      };
    }
    case 'Single': {
      const status = await dataService.replSetGetStatus().catch(() => null);
      if (status) {
        return {
          type,
          mongos: [],
          replicaSets: [replicaSetDescriptionFromStatus(status)],
        };
      }
      return {
        type,
        mongos: [],
        replicaSets: [],
        singleHost: {
          address: dataService.getLastSeenTopology()?.servers.values().next()
            .value.address,
        },
      };
    }
    case 'Unknown':
    default: {
      return { type: 'Unknown', mongos: [], replicaSets: [] };
    }
  }
}

const store = Object.assign(
  createStore(topologyReducer, applyMiddleware(thunk)),
  {
    onActivated(appRegistry: AppRegistry) {
      appRegistry.on(
        'data-service-connected',
        (err: Error | undefined, dataService: DataService) => {
          if (err) {
            store.dispatch(setError(err));
            return;
          }
          store.dispatch(dataServiceConnected(dataService));
          fetchTopologyInformation(store, dataService)
            .then((topology) =>
              store.dispatch(updateTopology(dataService, topology))
            )
            .catch((err) => store.dispatch(setError(err)));
        }
      );

      // Abort the export operation when it's in progress.
      appRegistry.on('data-service-disconnected', () => {
        store.dispatch(reset());
      });

      /**
       * Set the app registry to use later.
       */
      store.dispatch(appRegistryActivated(appRegistry));
    },
  }
);

function IconWithTooltip({
  glyph,
  text,
}: {
  glyph: React.ComponentProps<typeof Icon>['glyph'];
  text: React.ReactNode;
}) {
  return (
    <Tooltip
      trigger={({ children, ...props }) => (
        <span {...props}>
          {children}
          <Icon glyph={glyph} />
        </span>
      )}
    >
      {text}
    </Tooltip>
  );
}

function HostStatus({ status }: { status: ReplicaSetMemberStatus }) {
  const glyph = (
    {
      STARTUP: 'Ellipsis',
      PRIMARY: 'Write',
      SECONDARY: 'Read',
      RECOVERING: 'Warning',
      STARTUP2: 'Refresh',
      UNKNOWN: 'Warning',
      ARBITER: 'Sparkle',
      DOWN: 'XWithCircle',
      ROLLBACK: 'XWithCircle',
      REMOVED: 'XWithCircle',
    } as const
  )[status];

  return <IconWithTooltip glyph={glyph} text={status} />;
}

function ShardedCluster({ topology }: { topology: Topology }) {
  return (
    <Card className={css({ margin: '8px' })}>
      <div>
        {topology.mongos.map((host) => (
          <SingleHost host={host} key={host.address} isMongos={true} />
        ))}
      </div>
      <div
        className={css({ textAlign: 'center', padding: '20px 0px 20px 0px' })}
      >
        <IconWithTooltip glyph="ShardedCluster" text="Sharded Cluster" />
      </div>
      <div className={css({ display: 'flex' })}>
        {topology.replicaSets.map((rs) => (
          <ReplicaSet replSet={rs} key={rs.name} />
        ))}
      </div>
    </Card>
  );
}

function ReplicaSet({ replSet }: { replSet: ReplicaSetDescription }) {
  return (
    <Card className={css({ margin: '8px' })}>
      <div className={css({ textAlign: 'center' })}>
        {replSet.isConfigSet ? (
          <IconWithTooltip glyph="Settings" text="Config Replica Set" />
        ) : (
          <IconWithTooltip glyph="ReplicaSet" text="Shard" />
        )}
      </div>
      <div>
        {replSet.members.map((host) => (
          <SingleHost host={host} key={host.address} />
        ))}
      </div>
    </Card>
  );
}

function SingleHost({
  host,
  isMongos,
}: {
  host: GenericServer | ReplicaSetMember;
  isMongos?: boolean;
}) {
  return (
    <Card className={css({ margin: '8px' })}>
      <div className={css({ textAlign: 'center' })}>
        {isMongos ? (
          <IconWithTooltip glyph="Laptop" text="mongos (sharding router)" />
        ) : (
          <IconWithTooltip glyph="Database" text="mongod (data-bearing node)" />
        )}
      </div>
      <div>
        {'status' in host && <HostStatus status={host.status} />}
        {host.address}
      </div>
    </Card>
  );
}

function Unknown() {
  return (
    <Card>
      <IconWithTooltip glyph="ReplicaSet" text="Unknown topology" />
      Unknown host
    </Card>
  );
}

function TopologyPluginContents({
  topology,
  err,
}: Pick<State, 'topology' | 'err'>) {
  if (err) {
    return (
      <Banner variant="danger">
        Could not get topology information: {err.message}
      </Banner>
    );
  }

  if (!topology) {
    return <div>Loading...</div>;
  }

  switch (topology.type) {
    case 'LoadBalanced':
    case 'Sharded':
      return <ShardedCluster topology={topology} />;
    case 'ReplicaSetNoPrimary':
    case 'ReplicaSetWithPrimary':
      return <ReplicaSet replSet={topology.replicaSets[0]} />;
    case 'Single':
      return <SingleHost host={topology.singleHost!} />;
    case 'Unknown':
      return <Unknown />;
  }
}

const ConnectedTopologyPluginContents = connect(({ topology, err }: State) => ({
  topology,
  err,
}))(TopologyPluginContents);

function TopologyPlugin() {
  return (
    <Provider store={store}>
      <div className={css({ width: '100%' })}>
        <ConnectedTopologyPluginContents />
      </div>
    </Provider>
  );
}

const TOPOLOGY_PLUGIN_ROLE = {
  name: 'Topology',
  component: TopologyPlugin,
  order: 3,
};

function activate(appRegistry: AppRegistry): void {
  appRegistry.registerRole('Instance.Tab', TOPOLOGY_PLUGIN_ROLE);
  appRegistry.registerStore('TopologyPlugin.TopologyStore', store);
}

function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterStore('TopologyPlugin.TopologyStore');
  appRegistry.deregisterRole('Instance.Tab', TOPOLOGY_PLUGIN_ROLE);
}

export { activate, deactivate };
export { default as metadata } from '../package.json';
