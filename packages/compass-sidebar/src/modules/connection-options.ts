import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type { RootAction } from '.';
const HOST_STRING_LENGTH = 25;

export const CHANGE_CONNECTION_OPTIONS =
  'sidebar/connection-options/CHANGE_CONNECTION_OPTIONS' as const;
interface ChangeConnectionOptionsAction {
  type: typeof CHANGE_CONNECTION_OPTIONS;
  connectionId: ConnectionInfo['id'];
  options: SingleConnectionOptionsState;
}
export type ConnectionOptionsAction = ChangeConnectionOptionsAction;

export const INITIAL_STATE: ConnectionOptionsState = {};
export type SingleConnectionOptionsState = {
  sshTunnel: boolean;
  sshTunnelHostname: string;
  sshTunnelPort: string | number;
  sshTunnelHostPortString: string;
};

export type ConnectionOptionsState = Record<
  ConnectionInfo['id'],
  {
    sshTunnel: boolean;
    sshTunnelHostname: string;
    sshTunnelPort: string | number;
    sshTunnelHostPortString: string;
  }
>;

export default function reducer(
  state = INITIAL_STATE,
  action: RootAction
): ConnectionOptionsState {
  if (action.type === CHANGE_CONNECTION_OPTIONS) {
    return {
      ...state,
      [action.connectionId]: action.options,
    };
  }

  return state;
}

function combineHostPort(host: string, port: string | number): string {
  if (host.length >= HOST_STRING_LENGTH) {
    return `${host.slice(0, 9)}...${host.slice(-9)}:${port}`;
  }

  return `${host}:${port}`;
}

export function changeConnectionOptions(
  connectionId: ConnectionInfo['id'],
  connectionOptions: {
    sshTunnel?: { host: string; port: string | number };
  }
): ConnectionOptionsAction {
  const sshTunnel = !!connectionOptions.sshTunnel;
  const sshTunnelHostname = connectionOptions?.sshTunnel?.host ?? '';
  const sshTunnelPort = connectionOptions?.sshTunnel?.port ?? '';
  const sshTunnelHostPortString = connectionOptions.sshTunnel
    ? combineHostPort(sshTunnelHostname, sshTunnelPort)
    : '';

  return {
    type: CHANGE_CONNECTION_OPTIONS,
    connectionId,
    options: {
      sshTunnel,
      sshTunnelHostname,
      sshTunnelPort,
      sshTunnelHostPortString,
    },
  };
}
