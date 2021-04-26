import { CommonErrors, MongoshUnimplementedError } from '@mongosh/errors';
import i18n from '@mongosh/i18n';
import { CliOptions } from '@mongosh/service-provider-server';
import parser from 'yargs-parser';
import { colorizeForStderr as clr } from './clr';
import { USAGE } from './constants';

/**
 * Unknown translation key.
 */
const UNKNOWN = 'cli-repl.arg-parser.unknown-option';

/**
 * npm start constant.
 */
const START = 'start';

/**
 * The yargs-parser options configuration.
 */
const OPTIONS = {
  string: [
    'apiVersion',
    'authenticationDatabase',
    'authenticationMechanism',
    'awsAccessKeyId',
    'awsIamSessionToken',
    'awsSecretAccessKey',
    'awsSessionToken',
    'awsIamSessionToken',
    'db',
    'eval',
    'gssapiHostName',
    'gssapiServiceName',
    'host',
    'keyVaultNamespace',
    'kmsURL',
    'locale',
    'password',
    'port',
    'sslPEMKeyFile',
    'sslPEMKeyPassword',
    'sslCAFile',
    'sslCertificateSelector',
    'sslCRLFile',
    'sslDisabledProtocols',
    'tlsCAFile',
    'tlsCertificateKeyFile',
    'tlsCertificateKeyFilePassword',
    'tlsCertificateSelector',
    'tlsCRLFile',
    'tlsDisabledProtocols',
    'username'
  ],
  boolean: [
    'apiDeprecationErrors',
    'apiStrict',
    'help',
    'ipv6',
    'nodb',
    'norc',
    'quiet',
    'redactInfo',
    'retryWrites',
    'shell',
    'smokeTests',
    'ssl',
    'sslAllowInvalidCertificates',
    'sslAllowInvalidHostname',
    'sslFIPSMode',
    'tls',
    'tlsAllowInvalidCertificates',
    'tlsAllowInvalidHostnames',
    'tlsFIPSMode',
    'verbose',
    'version'
  ],
  alias: {
    h: 'help',
    p: 'password',
    u: 'username'
  },
  configuration: {
    'camel-case-expansion': false,
    'unknown-options-as-args': true
  }
};

/**
 * Maps deprecated arguments to their new counterparts.
 */
const DEPRECATED_ARGS_WITH_REPLACEMENT: Record<string, string> = {
  ssl: 'tls',
  sslAllowInvalidCertificates: 'tlsAllowInvalidCertificates',
  sslAllowInvalidHostname: 'tlsAllowInvalidHostname',
  sslFIPSMode: 'tlsFIPSMode',
  sslPEMKeyFile: 'tlsCertificateKeyFile',
  sslPEMKeyPassword: 'tlsCertificateKeyFilePassword',
  sslCAFile: 'tlsCAFile',
  sslCertificateSelector: 'tlsCertificateSelector',
  sslCRLFile: 'tlsCRLFile',
  sslDisabledProtocols: 'tlsDisabledProtocols'
};

/**
 * If an unsupported argument is given an error will be thrown.
 */
const UNSUPPORTED_ARGS: Readonly<string[]> = [
  'sslFIPSMode',
  'tlsFIPSMode'
];

/**
 * Determine the locale of the shell.
 *
 * @param {string[]} args - The arguments.
 *
 * @returns {string} The locale.
 */
export function getLocale(args: string[], env: any): string {
  const localeIndex = args.indexOf('--locale');
  if (localeIndex > -1) {
    return args[localeIndex + 1];
  }
  const lang = env.LANG || env.LANGUAGE || env.LC_ALL || env.LC_MESSAGES;
  return lang ? lang.split('.')[0] : lang;
}

/**
 * Parses arguments into a JS object.
 *
 * @param args - The CLI arguments.
 *
 * @returns The arguments as cli options.
 */
export function parseCliArgs(args: string[]): (CliOptions & { smokeTests: boolean }) {
  const programArgs = args.slice(2);
  i18n.setLocale(getLocale(programArgs, process.env));

  const parsed = parser(programArgs, OPTIONS);
  parsed._ = parsed._.filter(arg => {
    if (arg === START) {
      return false;
    }
    if (!arg.startsWith('-')) {
      return true;
    }
    throw new Error(
      `  ${clr(i18n.__(UNKNOWN), ['red', 'bold'])} ${clr(arg, 'bold')}
      ${USAGE}`
    );
  });

  const messages = verifyCliArguments(parsed);
  messages.forEach(m => console.warn(m));

  return parsed as unknown as (CliOptions & { smokeTests: boolean });
}

export function verifyCliArguments(args: parser.Arguments): string[] {
  for (const unsupported of UNSUPPORTED_ARGS) {
    if (unsupported in args) {
      throw new MongoshUnimplementedError(
        `Argument --${unsupported} is not yet supported in mongosh`,
        CommonErrors.InvalidArgument
      );
    }
  }

  const messages = [];
  for (const deprecated in DEPRECATED_ARGS_WITH_REPLACEMENT) {
    if (deprecated in args) {
      const replacement = DEPRECATED_ARGS_WITH_REPLACEMENT[deprecated];
      messages.push(`WARNING: argument --${deprecated} is deprecated and will be removed. Use --${replacement} instead.`);

      args[replacement] = args[deprecated];
      delete args[deprecated];
    }
  }
  return messages;
}
