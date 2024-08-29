import React, { useMemo } from 'react';
import {
  getConnectionTitle,
  type ConnectionInfo,
} from '@mongodb-js/connection-info';
import { useCallback, useRef } from 'react';
import { createServiceLocator } from 'hadron-app-registry';
import { useConnections, useConnectionsList } from '../stores/store-context';

export type ConnectionRepository = {
  favoriteConnections: ConnectionInfo[];
  nonFavoriteConnections: ConnectionInfo[];
  getConnectionInfoById: (
    id: ConnectionInfo['id']
  ) => ConnectionInfo | undefined;
  getConnectionTitleById: (id: ConnectionInfo['id']) => string | undefined;
};

/**
 * @deprecated use connections-store hooks instead
 */
export function useConnectionRepository(): ConnectionRepository {
  const nonFavoriteConnections = useConnectionsList((connection) => {
    return (
      !connection.isBeingCreated &&
      !connection.isAutoconnectInfo &&
      connection.info.savedConnectionType !== 'favorite'
    );
  });

  const nonFavoriteConnectionsInfoOnly = useMemo(() => {
    return nonFavoriteConnections.map((connection) => {
      return connection.info;
    });
  }, [nonFavoriteConnections]);

  const favoriteConnections = useConnectionsList((connection) => {
    return (
      !connection.isBeingCreated &&
      connection.info.savedConnectionType === 'favorite'
    );
  });

  const favoriteConnectionsInfoOnly = useMemo(() => {
    return favoriteConnections.map((connection) => {
      return connection.info;
    });
  }, [favoriteConnections]);

  const { getConnectionById } = useConnections();

  const getConnectionInfoById = useCallback(
    (connectionInfoId: ConnectionInfo['id']) => {
      return getConnectionById(connectionInfoId)?.info;
    },
    [getConnectionById]
  );

  const getConnectionTitleById = useCallback(
    (connectionId: ConnectionInfo['id']) => {
      const connectionInfo = getConnectionInfoById(connectionId);
      if (connectionInfo) {
        return getConnectionTitle(connectionInfo);
      }
    },
    [getConnectionInfoById]
  );

  return {
    getConnectionInfoById,
    getConnectionTitleById,
    favoriteConnections: favoriteConnectionsInfoOnly,
    nonFavoriteConnections: nonFavoriteConnectionsInfoOnly,
  };
}

type FirstArgument<F> = F extends (...args: [infer A, ...any]) => any
  ? A
  : F extends { new (...args: [infer A, ...any]): any }
  ? A
  : never;

/**
 * @deprecated instead of using HOC, refactor class component to functional
 * component
 */
function withConnectionRepository<
  T extends ((...args: any[]) => any) | { new (...args: any[]): any }
>(
  ReactComponent: T
): React.FunctionComponent<Omit<FirstArgument<T>, 'connectionRepository'>> {
  const WithConnectionRepository = (
    props: Omit<FirstArgument<T>, 'connectionRepository'> & React.Attributes
  ) => {
    const connectionRepository = useConnectionRepository();
    return React.createElement(ReactComponent, {
      ...props,
      connectionRepository,
    });
  };
  return WithConnectionRepository;
}

export { withConnectionRepository };

export type ConnectionRepositoryAccess = Pick<
  ConnectionRepository,
  'getConnectionInfoById'
>;

/**
 * @deprecated use `connectionsLocator` instead
 */
export const connectionRepositoryAccessLocator = createServiceLocator(
  (): ConnectionRepositoryAccess => {
    const repository = useConnectionRepository();
    const repositoryRef = useRef(repository);
    repositoryRef.current = repository;
    return {
      getConnectionInfoById(id: ConnectionInfo['id']) {
        return repositoryRef.current.getConnectionInfoById(id);
      },
    };
  },
  'connectionRepositoryAccessLocator'
);
