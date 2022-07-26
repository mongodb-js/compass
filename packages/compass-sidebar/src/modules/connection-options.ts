import type { AnyAction } from 'redux';
const HOST_STRING_LENGTH = 25;

export const CHANGE_CONNECTION_OPTIONS =
  'sidebar/connection-options/CHANGE_CONNECTION_OPTIONS';

export const INITIAL_STATE = {
  sshTunnel: false,
  sshTunnelHostname: '',
  sshTunnelPort: '',
  sshTunnelHostPortString: '',
};

export type ConnectionOptions = {
  sshTunnel: boolean;
  sshTunnelHostname: string;
  sshTunnelPort: string | number;
  sshTunnelHostPortString: string;
};

export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): ConnectionOptions {
  if (action.type === CHANGE_CONNECTION_OPTIONS) {
    return action.options;
  }
  return state;
}

function combineHostPort(host: string, port: string | number): string {
  if (host.length >= HOST_STRING_LENGTH) {
    return `${host.slice(0, 9)}...${host.slice(-9)}:${port}`;
  }

  return `${host}:${port}`;
}

export function changeConnectionOptions(connectionOptions: {
  sshTunnel?: { host: string; port: string | number };
}): { type: typeof CHANGE_CONNECTION_OPTIONS; options: ConnectionOptions } {
  const sshTunnel = !!connectionOptions.sshTunnel;
  const sshTunnelHostname = connectionOptions?.sshTunnel?.host ?? '';
  const sshTunnelPort = connectionOptions?.sshTunnel?.port ?? '';
  const sshTunnelHostPortString = connectionOptions.sshTunnel
    ? combineHostPort(sshTunnelHostname, sshTunnelPort)
    : '';

  return {
    type: CHANGE_CONNECTION_OPTIONS,
    options: {
      sshTunnel,
      sshTunnelHostname,
      sshTunnelPort,
      sshTunnelHostPortString,
    },
  };
}
