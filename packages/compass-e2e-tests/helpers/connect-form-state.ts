// undefined if not set/existing, boolean for ticked checkboxes, strings for
// everything else because this is the raw form field state as much as possible
export interface ConnectFormState {
  // Default
  connectionString?: string;
  scheme?: 'MONGODB' | 'MONGODB_SRV';
  hosts?: string[];
  directConnection?: boolean;

  // Authentication
  authMethod?:
    | 'DEFAULT'
    | 'MONGODB-X509'
    | 'GSSAPI'
    | 'PLAIN'
    | 'MONGODB-AWS'
    | 'MONGODB-OIDC';

  // - Username/Password
  defaultUsername?: string;
  defaultPassword?: string;
  defaultAuthSource?: string;
  defaultAuthMechanism?: 'DEFAULT' | 'SCRAM-SHA-1' | 'SCRAM-SHA-256';

  // - Kerberos
  kerberosPrincipal?: string;
  kerberosServiceName?: string;
  kerberosCanonicalizeHostname?: 'none' | 'forward' | 'forwardAndReverse';
  kerberosServiceRealm?: string;
  kerberosProvidePassword?: boolean;
  kerberosPassword?: string;

  // - LDAP
  ldapUsername?: string;
  ldapPassword?: string;

  // - OIDC
  oidcUsername?: string; // (Principal).

  // - AWS IAM
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsSessionToken?: string;

  // TLS/SSL
  sslConnection?: 'DEFAULT' | 'ON' | 'OFF';
  tlsCAFile?: string;
  tlsCertificateKeyFile?: string;
  clientKeyPassword?: string;
  tlsInsecure?: boolean;
  tlsAllowInvalidHostnames?: boolean;
  tlsAllowInvalidCertificates?: boolean;
  useSystemCA?: boolean;

  // Proxy/SSH
  proxyMethod?: 'none' | 'password' | 'identity' | 'socks';

  // FLE2
  fleKeyVaultNamespace?: string;
  fleStoreCredentials?: boolean;
  fleKey?: string;
  fleEncryptedFieldsMap?: string;

  // - SSH with Password
  sshPasswordHost?: string;
  sshPasswordPort?: string;
  sshPasswordUsername?: string;
  sshPasswordPassword?: string;

  // - SSH with Identitity File
  sshIdentityHost?: string;
  sshIdentityPort?: string;
  sshIdentityUsername?: string;
  sshIdentityKeyFile?: string;
  sshIdentityPassword?: string;

  // - Socks5
  socksHost?: string;
  socksPort?: string;
  socksUsername?: string;
  socksPassword?: string;

  // Advanced
  readPreference?:
    | 'defaultReadPreference'
    | 'primary'
    | 'primaryPreferred'
    | 'secondary'
    | 'secondaryPreferred'
    | 'nearest';
  replicaSet?: string;
  defaultDatabase?: string;
  urlOptions?: { [key: string]: string };
}
