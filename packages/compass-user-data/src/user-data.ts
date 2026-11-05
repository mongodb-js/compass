import { createLogger } from '@mongodb-js/compass-logging';
import { USER_DATA_BRIDGE } from '@mongodb-js/compass-utils';
import type {
  UserDataBridge,
  UserDataRequest,
  UserDataResponse,
} from '@mongodb-js/compass-utils';
import type { z } from 'zod';

const { log, mongoLogId } = createLogger('COMPASS-USER-STORAGE');

export const validUserDataTypes = [
  'RecentQueries',
  'FavoriteQueries',
  'SavedPipelines',
  'DataModelDescriptions',
  'WorkspacesState',
  'AppPreferences',
  'Users',
  'Connections',
  'AtlasState',
  'ShellHistory',
] as const;

export type UserDataType = (typeof validUserDataTypes)[number];

export type UserScopedUserDataType = 'AppPreferences';

// A user-scoped type is a single document, so its methods take no id
type ScopedArgs<
  Type extends UserDataType,
  Rest extends unknown[],
> = Type extends UserScopedUserDataType ? Rest : [id: string, ...Rest];

export function isUserScopedUserDataType(
  type: UserDataType
): type is UserScopedUserDataType {
  return type === 'AppPreferences';
}

export function assertsUserDataType(
  value: unknown
): asserts value is UserDataType {
  if (!validUserDataTypes.includes(value as UserDataType)) {
    throw new Error(`Invalid UserDataType: ${String(value)}`);
  }
}

type SerializeContent<I> = (content: I) => string;
type DeserializeContent = (content: string) => unknown;
export type AuthenticatedFetch = (
  url: RequestInfo | URL,
  options?: RequestInit
) => Promise<Response>;

type ReadOptions = {
  ignoreErrors: boolean;
};

export interface ReadAllResult<T extends z.ZodType> {
  data: z.output<T>[];
  errors: Error[];
}

// This type exists to avoid a circular dependency between user-data and atlas-service.
export type AtlasServiceLike = {
  userDataEndpoint: (
    orgId: string,
    projectId: string,
    dataType: UserDataType,
    id?: string
  ) => string;
  userScopedUserDataEndpoint: (dataType: UserDataType) => string;
  authenticatedFetch: AuthenticatedFetch;
};

/** Where local user data is addressed; `createLocalUserDataHandler` serves it */
export const LOCAL_USER_DATA_BASE_URL = 'compass-user-data://local';

/**
 * Where a `UserData` reads and writes. Atlas is the user-data service; local
 * is Compass's own storage, reached through a fetch that speaks the same
 * routes (see `createLocalUserDataHandler`).
 */
export type UserDataEnvironment<Type extends UserDataType = UserDataType> =
  | ({
      kind: 'atlas';
      atlasService: AtlasServiceLike;
    } & (Type extends UserScopedUserDataType
      ? unknown
      : { orgId: string; projectId: string }))
  | { kind: 'local'; fetch: AuthenticatedFetch };

/** Thrown for error statuses; `statusCode` matches AtlasServiceError's */
export class UserDataRequestError extends Error {
  statusCode: number;
  constructor(statusCode: number, body: string) {
    super(`${statusCode}: ${body}`);
    this.name = 'UserDataRequestError';
    this.statusCode = statusCode;
  }
}

/**
 * Turns a function that answers plain `UserDataRequest`s into the fetch a
 * `UserData` uses. It throws on error statuses, as AtlasService's fetch does.
 */
export function createUserDataFetch(
  send: (request: UserDataRequest) => Promise<UserDataResponse>
): AuthenticatedFetch {
  return async (url, init) => {
    const { status, body } = await send({
      method: init?.method ?? 'GET',
      url: url instanceof Request ? url.url : url.toString(),
      body: typeof init?.body === 'string' ? init.body : undefined,
    });
    if (status >= 400) {
      throw new UserDataRequestError(status, body);
    }
    return new Response(status === 204 ? null : body, { status });
  };
}

/**
 * The fetch for local user data in the desktop renderer, which reaches it
 * through the bridge the preload script exposes. The bridge is looked up per
 * request, so creating this before the bridge exists is fine.
 */
export function createBridgeUserDataFetch(): AuthenticatedFetch {
  return createUserDataFetch((request) => {
    const bridge = (globalThis as Record<string, unknown>)[USER_DATA_BRIDGE] as
      UserDataBridge | undefined;
    if (!bridge) {
      return Promise.reject(new Error('User data bridge is not available'));
    }
    return bridge.request(request);
  });
}

function isNotFound(error: unknown): boolean {
  return (error as { statusCode?: unknown } | null)?.statusCode === 404;
}

export class UserData<
  T extends z.ZodType,
  Type extends UserDataType = Exclude<UserDataType, UserScopedUserDataType>,
> {
  private readonly validator: T;
  private readonly dataType: Type;
  private readonly serialize: SerializeContent<z.input<T>>;
  private readonly deserialize: DeserializeContent;
  private readonly env: UserDataEnvironment<Type>;
  constructor(
    validator: T,
    dataType: Type,
    env: UserDataEnvironment<Type>,
    {
      serialize = (content: z.input<T>) => JSON.stringify(content, null, 2),
      deserialize = JSON.parse,
    }: {
      serialize?: SerializeContent<z.input<T>>;
      deserialize?: DeserializeContent;
    } = {}
  ) {
    assertsUserDataType(dataType);
    this.validator = validator;
    this.dataType = dataType;
    this.serialize = serialize;
    this.deserialize = deserialize;
    this.env = env;
  }

  private get fetch(): AuthenticatedFetch {
    return this.env.kind === 'atlas'
      ? this.env.atlasService.authenticatedFetch
      : this.env.fetch;
  }

  private endpointFor(id?: string): string {
    if (this.env.kind === 'local') {
      const path = [this.dataType, id].filter((part) => part !== undefined);
      return [LOCAL_USER_DATA_BASE_URL, ...path.map(encodeURIComponent)].join(
        '/'
      );
    }
    // TODO: update endpoints to reflect the merged api endpoints https://jira.mongodb.org/browse/CLOUDP-329716
    if (isUserScopedUserDataType(this.dataType)) {
      return this.env.atlasService.userScopedUserDataEndpoint(this.dataType);
    }
    const { orgId, projectId } = this.env as Partial<{
      orgId: string;
      projectId: string;
    }>;
    return this.env.atlasService.userDataEndpoint(
      orgId ?? '',
      projectId ?? '',
      this.dataType,
      id
    );
  }

  private async put(id: string | undefined, content: z.input<T>) {
    await this.fetch(this.endpointFor(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: this.serialize(content),
        createdAt: new Date(),
      }),
    });
  }

  async write(
    ...args: ScopedArgs<Type, [content: z.input<T>]>
  ): Promise<boolean> {
    const [id, content] = isUserScopedUserDataType(this.dataType)
      ? ([undefined, args[0]] as [undefined, z.input<T>])
      : (args as [string, z.input<T>]);
    // Invalid content is a caller bug, so it throws rather than reading as a
    // failed write
    this.validator.parse(content);
    try {
      await this.put(id, content);
      return true;
    } catch (error) {
      log.error(mongoLogId(1_001_000_373), 'User Data', 'Error writing data', {
        url: this.endpointFor(id),
        error: (error as Error).message,
      });
      return false;
    }
  }

  async delete(...args: ScopedArgs<Type, []>): Promise<boolean> {
    const [id] = isUserScopedUserDataType(this.dataType)
      ? [undefined]
      : (args as [string]);
    const url = this.endpointFor(id);
    try {
      await this.fetch(url, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      log.error(mongoLogId(1_001_000_374), 'User Data', 'Error deleting data', {
        url,
        error: (error as Error).message,
      });
      return false;
    }
  }

  async readAll(
    options: ReadOptions = { ignoreErrors: true }
  ): Promise<ReadAllResult<T>> {
    const result: ReadAllResult<T> = {
      data: [],
      errors: [],
    };
    let docs: { data: string }[];
    try {
      const response = await this.fetch(this.endpointFor(undefined), {
        method: 'GET',
      });
      const json = await response.json();
      // The user-scoped route returns a single document; wrap it so the
      // parsing loop below stays list-shaped for both scopes.
      docs = isUserScopedUserDataType(this.dataType) ? [json] : json;
    } catch (error) {
      if (isUserScopedUserDataType(this.dataType) && isNotFound(error)) {
        return result;
      }
      if (!options.ignoreErrors) {
        throw error;
      }
      result.errors.push(error as Error);
      return result;
    }
    try {
      for (const item of docs) {
        try {
          const parsedData = this.deserialize(item.data);
          result.data.push(this.validator.parse(parsedData));
        } catch (error) {
          result.errors.push(error as Error);
        }
      }
    } catch (error) {
      // Not a list
      result.errors.push(error as Error);
    }
    return result;
  }

  async updateAttributes(
    ...args: ScopedArgs<Type, [data: Partial<z.input<T>>]>
  ): Promise<boolean> {
    const [id, data] = isUserScopedUserDataType(this.dataType)
      ? ([undefined, args[0]] as [undefined, Partial<z.input<T>>])
      : (args as [string, Partial<z.input<T>>]);
    try {
      const prevData = (await this.readOneById(id, { ignoreErrors: true })) as
        Record<string, unknown> | undefined;
      await this.put(id, { ...prevData, ...data } as z.input<T>);
      return true;
    } catch (error) {
      log.error(mongoLogId(1_001_000_375), 'User Data', 'Error updating data', {
        url: this.endpointFor(id),
        error: (error as Error).message,
      });
      return false;
    }
  }

  // A missing document is not an error: it reads as undefined even when
  // errors are not ignored, so callers can tell "never written" from "broken"
  private async readOneById(
    id: string | undefined,
    options: ReadOptions
  ): Promise<z.output<T> | undefined> {
    const url = this.endpointFor(id);
    try {
      const getResponse = await this.fetch(url, {
        method: 'GET',
      });
      const json = await getResponse.json();
      return this.validator.parse(this.deserialize(json.data as string));
    } catch (error) {
      if (isNotFound(error)) {
        return undefined;
      }
      log.error(mongoLogId(1_001_000_376), 'User Data', 'Error reading data', {
        url,
        error: (error as Error).message,
      });
      if (!options.ignoreErrors) {
        throw error;
      }
      return undefined;
    }
  }

  async readOne(
    ...args: ScopedArgs<Type, [options?: ReadOptions]>
  ): Promise<z.output<T> | undefined> {
    const [id, options = { ignoreErrors: true }] = isUserScopedUserDataType(
      this.dataType
    )
      ? [undefined, args[0] as ReadOptions | undefined]
      : (args as [string, ReadOptions?]);
    return this.readOneById(id, options);
  }
}
