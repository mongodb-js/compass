import { configuredKMSProviders } from 'mongodb-data-service';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import { isLocalhost, isDigitalOcean, isAtlas } from 'mongodb-build-info';
import { getCloudInfo } from 'mongodb-cloud-info';
import ConnectionString from 'mongodb-connection-string-url';
import resolveMongodbSrv from 'resolve-mongodb-srv';
import type { KMSProviders, MongoClientOptions } from 'mongodb';

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

type ExtraConnectionData = {
  auth_type: string;
  tunnel: string;
  is_srv: boolean;
  is_localhost: boolean;
  is_atlas_url: boolean;
  is_do_url: boolean;
  is_public_cloud?: boolean;
  public_cloud_name?: string;
} & CsfleInfo;

type CsfleInfo = {
  count_kms_aws?: number;
  count_kms_gcp?: number;
  count_kms_kmip?: number;
  count_kms_local?: number;
  count_kms_azure?: number;
  is_csfle: boolean;
  has_csfle_schema: boolean;
};

function getKmsCount(
  kmsProviders: KMSProviders | undefined,
  kmsProviderType: 'local' | 'aws' | 'gcp' | 'kmip' | 'azure'
): number {
  return Object.keys(kmsProviders ?? {}).filter((x) =>
    x.startsWith(kmsProviderType)
  ).length;
}

function getCsfleInformation(
  fleOptions: ConnectionInfo['connectionOptions']['fleOptions']
): CsfleInfo {
  const kmsProviders = configuredKMSProviders(fleOptions?.autoEncryption ?? {});
  const csfleInfo: CsfleInfo = {
    is_csfle: kmsProviders.length > 0,
    has_csfle_schema: !!fleOptions?.autoEncryption?.encryptedFieldsMap,
    count_kms_aws: getKmsCount(fleOptions?.autoEncryption?.kmsProviders, 'aws'),
    count_kms_gcp: getKmsCount(fleOptions?.autoEncryption?.kmsProviders, 'gcp'),
    count_kms_kmip: getKmsCount(
      fleOptions?.autoEncryption?.kmsProviders,
      'kmip'
    ),
    count_kms_local: getKmsCount(
      fleOptions?.autoEncryption?.kmsProviders,
      'local'
    ),
    count_kms_azure: getKmsCount(
      fleOptions?.autoEncryption?.kmsProviders,
      'azure'
    ),
  };

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
): Promise<ExtraConnectionData> {
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

  const connectionData = {
    ...(await getHostInformation(resolvedHostname)),
    auth_type: authType.toUpperCase(),
    tunnel: proxyHost
      ? ('socks5' as const)
      : sshTunnel
      ? ('ssh' as const)
      : ('none' as const),
    is_srv: connectionStringData.isSRV,
    ...getCsfleInformation(fleOptions),
  };

  return connectionData;
}

export async function getExtraConnectionData(connectionInfo: ConnectionInfo) {
  const resolvedHostname = await getHostnameForConnection(connectionInfo);
  const connectionData = await getConnectionData(
    connectionInfo,
    resolvedHostname
  );
  return [connectionData, resolvedHostname] as [ExtraConnectionData, string];
}
