import assert from 'assert';
import { CommonErrors, MongoshInvalidInputError, MongoshInternalError } from '@mongosh/errors';
import { URL, URLSearchParams } from './whatwg-url';

const DUMMY_HOSTNAME = '__this_is_a_placeholder__';

// Adapted from the Node.js driver code:
// https://github.com/mongodb/node-mongodb-native/blob/350d14fde5b24480403313cfe5044f6e4b25f6c9/src/connection_string.ts#L146-L206
const HOSTS_REGEX = new RegExp(
  String.raw`(?<protocol>mongodb(?:\+srv|)):\/\/(?:(?<username>[^:]*)(?::(?<password>[^@]*))?@)?(?<hosts>(?!:)[^\/?@]+)(?<rest>.*)`
);

const caseInsenstiveURLSearchParams = (Ctor: typeof URLSearchParams) =>
  class CaseInsenstiveURLSearchParams extends Ctor {
    append(name: any, value: any): void {
      return super.append(this._normalizeKey(name), value);
    }

    delete(name: any): void {
      return super.delete(this._normalizeKey(name));
    }

    get(name: any): string | null {
      return super.get(this._normalizeKey(name));
    }

    getAll(name: any): string[] {
      return super.getAll(this._normalizeKey(name));
    }

    has(name: any): boolean {
      return super.has(this._normalizeKey(name));
    }

    set(name: any, value: any): void {
      return super.set(this._normalizeKey(name), value);
    }

    _normalizeKey(name: any): string {
      name = `${name}`;
      for (const key of this.keys()) {
        if (key.toLowerCase() === name.toLowerCase()) {
          name = key;
          break;
        }
      }
      return name;
    }
  };

// Abstract middle class to appease TypeScript, see https://github.com/microsoft/TypeScript/pull/37894
abstract class URLWithoutHost extends URL {
  abstract host: never;
  abstract hostname: never;
  abstract port: never;
  abstract href: string;
}

/**
 * Represents a mongodb:// or mongodb+srv:// connection string.
 * See: https://github.com/mongodb/specifications/blob/master/source/connection-string/connection-string-spec.rst#reference-implementation
 */
export class ConnectionString extends URLWithoutHost {
  _hosts: string[];

  // eslint-disable-next-line complexity
  constructor(uri: string) {
    const match = uri.match(HOSTS_REGEX);
    if (!match) {
      throw new MongoshInvalidInputError(`Invalid connection string "${uri}"`, CommonErrors.InvalidArgument);
    }

    const { protocol, username, password, hosts, rest } = match.groups ?? {};

    assert(protocol);
    assert(hosts);

    try {
      decodeURIComponent(username ?? '');
      decodeURIComponent(password ?? '');
    } catch (err) {
      throw new MongoshInvalidInputError(err.message, CommonErrors.InvalidArgument);
    }

    // characters not permitted in username nor password Set([':', '/', '?', '#', '[', ']', '@'])
    const illegalCharacters = new RegExp(String.raw`[:/?#\[\]@]`, 'gi');
    if (username?.match(illegalCharacters)) {
      throw new MongoshInvalidInputError(`Username contains unescaped characters ${username}`, CommonErrors.InvalidArgument);
    }
    if (!username || !password) {
      const uriWithoutProtocol = uri.replace(`${protocol}://`, '');
      if (uriWithoutProtocol.startsWith('@') || uriWithoutProtocol.startsWith(':')) {
        throw new MongoshInvalidInputError('URI contained empty userinfo section', CommonErrors.InvalidArgument);
      }
    }

    if (password?.match(illegalCharacters)) {
      throw new MongoshInvalidInputError('Password contains unescaped characters', CommonErrors.InvalidArgument);
    }

    let authString = '';
    if (typeof username === 'string') authString += username;
    if (typeof password === 'string') authString += `:${password}`;
    if (authString) authString += '@';

    super(`${protocol.toLowerCase()}://${authString}${DUMMY_HOSTNAME}${rest}`);
    this._hosts = hosts.split(',');

    if (this.isSRV && this.hosts.length !== 1) {
      throw new MongoshInvalidInputError('mongodb+srv URI cannot have multiple service names', CommonErrors.InvalidArgument);
    }
    if (this.isSRV && this.hosts.some(host => host.includes(':'))) {
      throw new MongoshInvalidInputError('mongodb+srv URI cannot have port number', CommonErrors.InvalidArgument);
    }
    if (!this.pathname) {
      this.pathname = '/';
    }
    Object.setPrototypeOf(this.searchParams, caseInsenstiveURLSearchParams(this.searchParams.constructor as any).prototype);
  }

  // The getters here should throw, but that would break .toString() because of
  // https://github.com/nodejs/node/issues/36887. Using 'never' as the type
  // should be enough to stop anybody from using them in TypeScript, though.
  get host(): never { return DUMMY_HOSTNAME as never; }
  set host(_ignored: never) { throw new MongoshInternalError('No single host for connection string'); }
  get hostname(): never { return DUMMY_HOSTNAME as never; }
  set hostname(_ignored: never) { throw new MongoshInternalError('No single host for connection string'); }
  get port(): never { return '' as never; }
  set port(_ignored: never) { throw new MongoshInternalError('No single host for connection string'); }
  get href(): string { return this.toString(); }
  set href(_ignored: string) { throw new MongoshInternalError('Cannot set href for connection strings'); }

  get isSRV(): boolean {
    return this.protocol.includes('srv');
  }

  get hosts(): string[] {
    return this._hosts;
  }

  set hosts(list: string[]) {
    this._hosts = list;
  }

  toString(): string {
    return super.toString().replace(DUMMY_HOSTNAME, this.hosts.join(','));
  }

  clone(): ConnectionString {
    return new ConnectionString(this.toString());
  }
}
