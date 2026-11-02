import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createLogger } from '@mongodb-js/compass-logging';
import { USER_DATA_BRIDGE, getStoragePath } from '@mongodb-js/compass-utils';
import type {
  UserDataBridge,
  UserDataRequest,
  UserDataResponse,
} from '@mongodb-js/compass-utils';
import type { z } from 'zod';
import writeFile from 'write-file-atomic';
import { Semaphore } from './semaphore';

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

// The id of a user-scoped data type is always undefined (singleton document),
// while project-scoped types require a document id.
export type ScopedId<Type extends UserDataType> =
  Type extends UserScopedUserDataType ? undefined : string;

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

export type FileUserDataOptions<Input> = {
  basePath?: string;
  serialize?: SerializeContent<Input>;
  deserialize?: DeserializeContent;
};

export type AtlasUserDataOptions<Type extends UserDataType, Input> = {
  atlasService: AtlasServiceLike;
  serialize?: SerializeContent<Input>;
  deserialize?: DeserializeContent;
} & (Type extends UserScopedUserDataType
  ? unknown
  : { orgId: string; projectId: string });

type ReadOptions = {
  ignoreErrors: boolean;
};

export interface ReadAllResult<T extends z.ZodType> {
  data: z.output<T>[];
  errors: Error[];
}

export abstract class IUserData<
  T extends z.ZodType,
  Type extends UserDataType = Exclude<UserDataType, UserScopedUserDataType>,
> {
  protected readonly validator: T;
  protected readonly dataType: UserDataType;
  protected readonly serialize: SerializeContent<z.input<T>>;
  protected readonly deserialize: DeserializeContent;
  constructor(
    validator: T,
    dataType: UserDataType,
    {
      serialize = (content: z.input<T>) => JSON.stringify(content, null, 2),
      deserialize = JSON.parse,
    }: {
      serialize?: SerializeContent<z.input<T>>;
      deserialize?: DeserializeContent;
    } = {}
  ) {
    this.validator = validator;
    assertsUserDataType(dataType);
    this.dataType = dataType;
    this.serialize = serialize;
    this.deserialize = deserialize;
  }

  // The concrete implementations constrain the id further: FileUserData
  // requires a string, AtlasUserData requires undefined for user-scoped types
  // (see ScopedId).
  abstract write(
    ...args: ScopedArgs<Type, [content: z.input<T>]>
  ): Promise<boolean>;
  abstract delete(...args: ScopedArgs<Type, []>): Promise<boolean>;
  abstract readAll(options?: ReadOptions): Promise<ReadAllResult<T>>;
  abstract readOne(
    ...args: ScopedArgs<Type, [options?: ReadOptions]>
  ): Promise<z.output<T> | undefined>;
  abstract updateAttributes(
    ...args: ScopedArgs<Type, [data: Partial<z.input<T>>]>
  ): Promise<boolean>;
}

export class FileUserData<T extends z.ZodType> extends IUserData<T> {
  private readonly basePath?: string;
  protected readonly semaphore = new Semaphore(100);

  constructor(
    validator: T,
    dataType: UserDataType,
    { basePath, serialize, deserialize }: FileUserDataOptions<z.input<T>>
  ) {
    super(validator, dataType, { serialize, deserialize });
    this.basePath = basePath;
  }

  private getFileName(id: string) {
    return `${id}.json`;
  }

  private async getEnsuredBasePath(): Promise<string> {
    const basepath = this.basePath ? this.basePath : getStoragePath();

    const root = path.join(basepath, this.dataType);

    await fs.mkdir(root, { recursive: true });

    return root;
  }

  /**
   * Migrates data from an old folder name to the current dataType folder.
   * This is useful when renaming a dataType while preserving existing user data.
   *
   * @param oldDataType - The old folder name to migrate from
   * @returns Promise<boolean> - true if migration was performed, false if not needed or failed
   */
  async migrateFromOldFolder(oldDataType: string): Promise<boolean> {
    if (oldDataType === this.dataType) {
      return false;
    }

    try {
      const basepath = this.basePath ? this.basePath : getStoragePath();
      const oldFolderPath = path.join(basepath, oldDataType);
      const newFolderPath = path.join(basepath, this.dataType);

      // Attempt to rename directly - if it succeeds, migration happened
      // If it fails, we handle the specific error cases
      await fs.rename(oldFolderPath, newFolderPath);

      log.info(
        mongoLogId(1_001_000_382),
        'Filesystem',
        'Successfully migrated data folder',
        {
          from: oldDataType,
          to: this.dataType,
        }
      );
      return true;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;

      // ENOENT means old folder doesn't exist - nothing to migrate
      if (err.code === 'ENOENT') {
        return false;
      }

      // EEXIST or ENOTEMPTY means new folder already exists
      // This could mean migration already happened or user has new data
      if (err.code === 'EEXIST' || err.code === 'ENOTEMPTY') {
        return false;
      }

      // Any other error is a real failure
      log.error(
        mongoLogId(1_001_000_383),
        'Filesystem',
        'Failed to migrate data folder',
        {
          from: oldDataType,
          to: this.dataType,
          error: err.message,
        }
      );
      return false;
    }
  }

  private async getFileAbsolutePath(filepath?: string): Promise<string> {
    const root = await this.getEnsuredBasePath();
    const pathRelativeToRoot = path.relative(
      root,
      path.join(root, filepath ?? '')
    );

    if (
      pathRelativeToRoot.startsWith('..') ||
      path.isAbsolute(pathRelativeToRoot)
    ) {
      throw new Error(
        `Invalid file path: '${filepath}' is not a subpath of ${root}.`
      );
    }

    return path.resolve(root, pathRelativeToRoot);
  }

  private async readAndParseFile(
    absolutePath: string,
    options: ReadOptions
  ): Promise<z.output<T> | undefined> {
    let data: string;
    let release: (() => void) | undefined = undefined;
    try {
      release = await this.semaphore.waitForRelease();
      data = await fs.readFile(absolutePath, 'utf-8');
    } catch (error) {
      log.error(mongoLogId(1_001_000_234), 'Filesystem', 'Error reading file', {
        path: absolutePath,
        error: (error as Error).message,
      });
      if (options.ignoreErrors) {
        return undefined;
      }
      throw error;
    } finally {
      release?.();
    }

    try {
      const content = this.deserialize(data);
      return this.validator.parse(content);
    } catch (error) {
      log.error(mongoLogId(1_001_000_235), 'Filesystem', 'Error parsing data', {
        path: absolutePath,
        error: (error as Error).message,
      });
      if (options.ignoreErrors) {
        return undefined;
      }
      throw error;
    }
  }

  async write(id: string, content: z.input<T>) {
    // Validate the input. Here we are not saving the parsed content
    // because after reading we validate the data again and it parses
    // the read content back to the expected output. This way we ensure
    // that we exactly save what we want without transforming it.
    this.validator.parse(content);

    const filepath = this.getFileName(id);
    const absolutePath = await this.getFileAbsolutePath(filepath);
    try {
      await writeFile(absolutePath, this.serialize(content), {
        encoding: 'utf-8',
      });
      return true;
    } catch (error) {
      log.error(mongoLogId(1_001_000_233), 'Filesystem', 'Error writing file', {
        path: absolutePath,
        error: (error as Error).message,
      });
      return false;
    }
  }

  async delete(id: string) {
    const filepath = this.getFileName(id);
    const absolutePath = await this.getFileAbsolutePath(filepath);
    try {
      await fs.unlink(absolutePath);
      return true;
    } catch (error) {
      log.error(
        mongoLogId(1_001_000_236),
        'Filesystem',
        'Error deleting file',
        {
          path: absolutePath,
          error: (error as Error).message,
        }
      );
      return false;
    }
  }

  async readAll(
    options: ReadOptions = {
      ignoreErrors: true,
    }
  ): Promise<ReadAllResult<T>> {
    const result: ReadAllResult<T> = {
      data: [],
      errors: [],
    };
    try {
      const absolutePath = await this.getFileAbsolutePath();
      const filePathList = await fs.readdir(absolutePath);
      for (const settled of await Promise.allSettled(
        filePathList.map((x) => {
          return this.readAndParseFile(path.join(absolutePath, x), options);
        })
      )) {
        if (settled.status === 'fulfilled' && settled.value) {
          result.data.push(settled.value);
        }
        if (settled.status === 'rejected') {
          result.errors.push(settled.reason);
        }
      }
      return result;
    } catch (err) {
      if (options.ignoreErrors) {
        return result;
      }
      throw err;
    }
  }

  async readOne(
    id: string,
    options?: { ignoreErrors: false }
  ): Promise<z.output<T>>;
  async readOne(
    id: string,
    options?: { ignoreErrors: true }
  ): Promise<z.output<T> | undefined>;
  async readOne(
    id: string,
    options?: ReadOptions
  ): Promise<z.output<T> | undefined>;
  async readOne(
    id: string,
    options: ReadOptions = {
      ignoreErrors: true,
    }
  ) {
    const filepath = this.getFileName(id);
    const absolutePath = await this.getFileAbsolutePath(filepath);
    return await this.readAndParseFile(absolutePath, options);
  }

  async updateAttributes(
    id: string,
    data: Partial<z.input<T>>
  ): Promise<boolean> {
    try {
      await this.write(id, {
        ...((await this.readOne(id)) ?? {}),
        ...data,
      } as z.input<T>);
      return true;
    } catch {
      return false;
    }
  }
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
  Type extends UserDataType = UserDataType,
> extends IUserData<T, Type> {
  private readonly env: UserDataEnvironment<Type>;
  constructor(
    validator: T,
    dataType: Type,
    env: UserDataEnvironment<Type>,
    {
      serialize,
      deserialize,
    }: {
      serialize?: SerializeContent<z.input<T>>;
      deserialize?: DeserializeContent;
    } = {}
  ) {
    super(validator, dataType, { serialize, deserialize });
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

// TODO: update endpoints to reflect the merged api endpoints https://jira.mongodb.org/browse/CLOUDP-329716
export class AtlasUserData<
  T extends z.ZodType,
  Type extends UserDataType = UserDataType,
> extends UserData<T, Type> {
  constructor(
    validator: T,
    dataType: Type,
    options: AtlasUserDataOptions<Type, z.input<T>>
  ) {
    const { atlasService, serialize, deserialize, ...scope } = options;
    super(
      validator,
      dataType,
      { kind: 'atlas', atlasService, ...scope },
      { serialize, deserialize }
    );
  }
}
