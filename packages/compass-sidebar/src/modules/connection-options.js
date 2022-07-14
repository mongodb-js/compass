const HOST_STRING_LENGTH = 25;

export const CHANGE_CONNECTION_OPTIONS =
  'sidebar/connection-options/CHANGE_CONNECTION_OPTIONS';

export const INITIAL_STATE = {
  sshTunnel: false,
  sshTunnelHostname: '',
  sshTunnelPort: '',
  sshTunnelHostPortString: '',
};

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_CONNECTION_OPTIONS) {
    return action.options;
  }
  return state;
}

function combineHostPort(host, port) {
  if (host.length >= HOST_STRING_LENGTH) {
    return `${host.slice(0, 9)}...${host.slice(-9)}:${port}`;
  }

  return `${host}:${port}`;
}

export function changeConnectionOptions(connectionOptions) {
  const sshTunnel = !!connectionOptions.sshTunnel;
  const sshTunnelHostname = sshTunnel ? connectionOptions.sshTunnel.host : '';
  const sshTunnelPort = sshTunnel ? connectionOptions.sshTunnel.port : '';
  const sshTunnelHostPortString = sshTunnel
    ? combineHostPort(sshTunnelHostname, sshTunnelPort, true)
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
