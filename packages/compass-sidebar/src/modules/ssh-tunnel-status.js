const HOST_STRING_LENGTH = 25;

export const CHANGE_STATUS = 'sidebar/ssh-tunnel-status/CHANGE_STATUS';

export const INITIAL_STATE = {
  sshTunnel: false,
  sshTunnelHostname: '',
  sshTunnelPort: '',
  sshTunnelHostPortString: ''
};

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_STATUS) {
    return action.status;
  }
  return state;
}

function combineHostPort(host, port, truncate) {
  if (host.length >= HOST_STRING_LENGTH && truncate) {
    return `${host.slice(0, 9)}...${host.slice(-9)}:${port}`;
  }

  return `${host}:${port}`;
}

export function changeDataService(ds) {
  const connectionOptions = ds.getConnectionOptions();
  const sshTunnel = !!connectionOptions.sshTunnel;
  const sshTunnelHostname = sshTunnel
    ? connectionOptions.sshTunnel.host
    : '';
  const sshTunnelPort = sshTunnel
    ? connectionOptions.sshTunnel.port
    : '';
  const sshTunnelHostPortString = sshTunnel
    ? combineHostPort(sshTunnelHostname, sshTunnelPort, true)
    : '';

  return {
    type: CHANGE_STATUS,
    status: {
      sshTunnel,
      sshTunnelHostname,
      sshTunnelPort,
      sshTunnelHostPortString
    }
  };
}
