import { configuredKMSProviders } from 'mongodb-data-service';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import { isLocalhost, isDigitalOcean, isAtlas } from 'mongodb-build-info';
import { getCloudInfo } from 'mongodb-cloud-info';
import ConnectionString from 'mongodb-connection-string-url';
import resolveMongodbSrv from 'resolve-mongodb-srv';
import type { MongoClientOptions } from 'mongodb';

type HostInformation = {
  is_localhost: boolean;
  is_atlas_url: boolean;
  is_do_url: boolean;
  is_public_cloud?: boolean;
  public_cloud_name?: string;
};

async function getPublicCloudInfo(host: string): Promise<{
  public_cloud_name?: string;
  is_public_cloud?: boolean;
}> {
  try {
    const { isAws, isAzure, isGcp } = await getCloudInfo(host);

    const public_cloud_name = isAws
      ? 'AWS'
      : isAzure
      ? 'Azure'
      : isGcp
      ? 'GCP'
      : undefined;

    if (public_cloud_name === undefined) {
      return { is_public_cloud: false };
    }

    return {
      is_public_cloud: true,
      public_cloud_name,
    };
  } catch (err) {
    return {};
  }
}

async function getHostInformation(
  host: string | null
): Promise<HostInformation> {
  if (!host) {
    return {
      is_do_url: false,
      is_atlas_url: false,
      is_localhost: false,
    };
  }

  if (isLocalhost(host)) {
    return {
      is_public_cloud: false,
      is_do_url: false,
      is_atlas_url: false,
      is_localhost: true,
    };
  }

  if (isDigitalOcean(host)) {
    return {
      is_localhost: false,
      is_public_cloud: false,
      is_atlas_url: false,
      is_do_url: true,
    };
  }

  const publicCloudInfo = await getPublicCloudInfo(host);

  return {
    is_localhost: false,
    is_do_url: false,
    is_atlas_url: isAtlas(host),
    ...publicCloudInfo,
  };
}

function getCsfleInformation(
  fleOptions: ConnectionInfo['connectionOptions']['fleOptions']
): Record<string, unknown> {
  const kmsProviders = configuredKMSProviders(fleOptions?.autoEncryption ?? {});
  const csfleInfo: Record<string, unknown> = {
    is_csfle: kmsProviders.length > 0,
    has_csfle_schema: !!fleOptions?.autoEncryption?.encryptedFieldsMap,
  };

  for (const kmsProvider of ['aws', 'gcp', 'kmip', 'local', 'azure'] as const) {
    csfleInfo[`has_kms_${kmsProvider}`] =
      !!fleOptions?.autoEncryption?.kmsProviders?.[kmsProvider];
  }

  return csfleInfo;
}

async function getHostnameForConnection(
  connectionInfo: ConnectionInfo
): Promise<string | null> {
  let connectionStringData = new ConnectionString(
    connectionInfo.connectionOptions.connectionString,
    {
      looseValidation: true,
    }
  );
  if (connectionStringData.isSRV) {
    const uri = await resolveMongodbSrv(connectionStringData.toString()).catch(
      () => {
        return null;
      }
    );
    if (uri) {
      connectionStringData = new ConnectionString(uri, {
        looseValidation: true,
      });
    }
  }

  const firstHost = connectionStringData.hosts[0] ?? '';

  if (firstHost.startsWith('[')) {
    return firstHost.slice(1).split(']')[0]; // IPv6
  }

  return firstHost.split(':')[0];
}

async function getConnectionData(
  {
    connectionOptions: { connectionString, sshTunnel, fleOptions },
  }: Pick<ConnectionInfo, 'connectionOptions'>,
  resolvedHostname: string | null
): Promise<Record<string, unknown>> {
  const connectionStringData = new ConnectionString(connectionString, {
    looseValidation: true,
  });
  const searchParams =
    connectionStringData.typedSearchParams<MongoClientOptions>();

  const authMechanism = searchParams.get('authMechanism');
  const authType = authMechanism
    ? authMechanism
    : connectionStringData.username
    ? 'DEFAULT'
    : 'NONE';
  const proxyHost = searchParams.get('proxyHost');

  return {
    ...(await getHostInformation(resolvedHostname)),
    auth_type: authType.toUpperCase(),
    tunnel: proxyHost ? 'socks5' : sshTunnel ? 'ssh' : 'none',
    is_srv: connectionStringData.isSRV,
    ...getCsfleInformation(fleOptions),
  };
}

export async function getExtraConnectionData(connectionInfo: ConnectionInfo) {
  const resolvedHostname = await getHostnameForConnection(connectionInfo);
  const connectionData = await getConnectionData(
    connectionInfo,
    resolvedHostname
  );
  return [connectionData, resolvedHostname] as [
    Record<string, unknown>,
    string
  ];
}
