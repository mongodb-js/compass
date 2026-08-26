export type GoToCandidateKind = 'connection' | 'database' | 'collection';

export type GoToCollectionType = 'collection' | 'view' | 'timeseries';

export type GoToCandidate = {
  id: string;
  kind: GoToCandidateKind;
  connectionId: string;
  /** Primary label shown in the result row */
  primary: string;
  /** Muted secondary text (connection title for nested items; empty for connections) */
  secondary: string;
  connected: boolean;
  /** db name for database; db.coll for collection */
  namespace?: string;
  collectionType?: GoToCollectionType;
};

export type GoToConnectionInput = {
  id: string;
  title: string;
  status: string;
};

export type GoToCollectionInput = {
  name: string;
  type?: string;
};

export type GoToDatabaseInput = {
  name: string;
  collections: readonly GoToCollectionInput[];
};

export type GoToInstanceInput = {
  databases: readonly GoToDatabaseInput[];
};

/**
 * Builds a flat list of go-to candidates from connections and (for connected
 * hosts) their loaded database/collection inventory. Disconnected hosts only
 * contribute a connection row — never ghost namespaces.
 */
export function buildGoToCandidates(
  connections: readonly GoToConnectionInput[],
  instancesByConnectionId: ReadonlyMap<string, GoToInstanceInput>
): GoToCandidate[] {
  const candidates: GoToCandidate[] = [];

  for (const connection of connections) {
    const connected = connection.status === 'connected';
    candidates.push({
      id: `connection:${connection.id}`,
      kind: 'connection',
      connectionId: connection.id,
      primary: connection.title,
      secondary: '',
      connected,
    });

    if (!connected) {
      continue;
    }

    const instance = instancesByConnectionId.get(connection.id);
    if (!instance) {
      continue;
    }

    for (const database of instance.databases) {
      candidates.push({
        id: `database:${connection.id}:${database.name}`,
        kind: 'database',
        connectionId: connection.id,
        primary: database.name,
        secondary: connection.title,
        connected: true,
        namespace: database.name,
      });

      for (const collection of database.collections) {
        const namespace = `${database.name}.${collection.name}`;
        candidates.push({
          id: `collection:${connection.id}:${namespace}`,
          kind: 'collection',
          connectionId: connection.id,
          primary: collection.name,
          secondary: connection.title,
          connected: true,
          namespace,
          collectionType: toCollectionType(collection.type),
        });
      }
    }
  }

  return candidates;
}

function toCollectionType(type: string | undefined): GoToCollectionType {
  if (type === 'view' || type === 'timeseries') {
    return type;
  }
  return 'collection';
}
