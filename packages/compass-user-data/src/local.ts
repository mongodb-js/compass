import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createLogger } from '@mongodb-js/compass-logging';
import { getStoragePath } from '@mongodb-js/compass-utils';
import writeFile from 'write-file-atomic';
import { Semaphore } from './semaphore';
import {
  LOCAL_USER_DATA_BASE_URL,
  createUserDataFetch,
  isUserScopedUserDataType,
  validUserDataTypes,
} from './user-data';
import type {
  UserDataRequest,
  UserDataResponse,
  UserDataType,
} from './user-data';

const { log, mongoLogId } = createLogger('COMPASS-USER-STORAGE');

// The file Compass has always kept user-scoped data (AppPreferences) in
const USER_SCOPED_ID = 'General';

type LocalUserDataOptions = {
  basePath?: string;
};

type Route = { type: UserDataType; id?: string };

function respond(status: number, body?: unknown): UserDataResponse {
  return { status, body: body === undefined ? '' : JSON.stringify(body) };
}

const notFound = () => respond(404, { error: 'Not Found' });
const badRequest = () => respond(400, { error: 'Bad Request' });

/**
 * Matches the user-data service's routes: `/<type>` lists, `/<type>/<id>` is
 * one document, and user-scoped types are a single document at `/<type>`.
 */
function parseRoute(url: string): Route | null {
  if (!url.startsWith(`${LOCAL_USER_DATA_BASE_URL}/`)) return null;
  let segments: string[];
  try {
    segments = url
      .slice(LOCAL_USER_DATA_BASE_URL.length + 1)
      .split('/')
      .map(decodeURIComponent);
  } catch {
    return null;
  }
  const [type, id, ...rest] = segments;
  if (rest.length > 0 || id === '') return null;
  if (!validUserDataTypes.includes(type as UserDataType)) return null;
  if (isUserScopedUserDataType(type as UserDataType)) {
    return id === undefined
      ? { type: type as UserDataType, id: USER_SCOPED_ID }
      : null;
  }
  return { type: type as UserDataType, id };
}

function parseBody(body: string | undefined): { data: string } | null {
  try {
    const parsed: unknown = JSON.parse(body ?? '');
    return typeof (parsed as { data?: unknown })?.data === 'string'
      ? (parsed as { data: string })
      : null;
  } catch {
    return null;
  }
}

function isErrnoCode(error: unknown, code: string): boolean {
  return (error as NodeJS.ErrnoException)?.code === code;
}

class LocalUserDataStore {
  private readonly basePath?: string;
  private readonly semaphore = new Semaphore(100);

  constructor({ basePath }: LocalUserDataOptions) {
    this.basePath = basePath;
  }

  private dir(type: UserDataType): string {
    return path.join(this.basePath ?? getStoragePath(), type);
  }

  private file(type: UserDataType, id: string): string {
    return path.join(this.dir(type), `${id}.json`);
  }

  private async view(type: UserDataType, id: string) {
    const file = this.file(type, id);
    const release = await this.semaphore.waitForRelease();
    try {
      const [data, stats] = await Promise.all([
        fs.readFile(file, 'utf-8'),
        fs.stat(file),
      ]);
      return { _id: id, data, createdAt: stats.birthtime.toISOString() };
    } finally {
      release();
    }
  }

  async list(type: UserDataType): Promise<UserDataResponse> {
    let names: string[];
    try {
      names = await fs.readdir(this.dir(type));
    } catch (error) {
      if (isErrnoCode(error, 'ENOENT')) return respond(200, []);
      throw error;
    }
    const ids = names
      .filter((name) => name.endsWith('.json'))
      .map((name) => name.slice(0, -'.json'.length));
    const views = await Promise.allSettled(
      ids.map((id) => this.view(type, id))
    );
    const docs = [];
    for (const [index, settled] of views.entries()) {
      if (settled.status === 'fulfilled') {
        docs.push(settled.value);
      } else {
        // The service's list has no per-document errors, so skip the file
        log.error(
          mongoLogId(1_001_000_454),
          'Filesystem',
          'Error reading file',
          {
            path: this.file(type, ids[index]),
            error: (settled.reason as Error).message,
          }
        );
      }
    }
    return respond(200, docs);
  }

  async get(type: UserDataType, id: string): Promise<UserDataResponse> {
    try {
      return respond(200, await this.view(type, id));
    } catch (error) {
      if (isErrnoCode(error, 'ENOENT')) return notFound();
      throw error;
    }
  }

  async put(
    type: UserDataType,
    id: string,
    body: string | undefined
  ): Promise<UserDataResponse> {
    const parsed = parseBody(body);
    if (!parsed) return badRequest();
    const file = this.file(type, id);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, parsed.data, { encoding: 'utf-8' });
    return respond(200);
  }

  async delete(type: UserDataType, id: string): Promise<UserDataResponse> {
    try {
      await fs.unlink(this.file(type, id));
    } catch (error) {
      if (!isErrnoCode(error, 'ENOENT')) throw error;
    }
    return respond(204);
  }
}

/**
 * Serves user-data requests from Compass's storage directory with the same
 * routes, status codes and response shapes as the Atlas user-data service, so
 * one `UserData` client works against either. Each document is stored as its
 * serialized `data`, in `<type>/<id>.json` (user-scoped types use
 * `<type>/General.json`), which is the layout Compass has always used.
 */
export function createLocalUserDataHandler(
  options: LocalUserDataOptions = {}
): (request: UserDataRequest) => Promise<UserDataResponse> {
  const store = new LocalUserDataStore(options);
  return async ({ method, url, body }) => {
    const route = parseRoute(url);
    if (!route) return notFound();
    const { type, id } = route;
    // An id names a file, so it must not be able to reach outside its folder
    if (id !== undefined && (path.basename(id) !== id || id === '..')) {
      return badRequest();
    }
    try {
      if (id === undefined) {
        return method === 'GET'
          ? await store.list(type)
          : respond(405, { error: 'Method Not Allowed' });
      }
      switch (method) {
        case 'GET':
          return await store.get(type, id);
        case 'PUT':
          return await store.put(type, id, body);
        case 'DELETE':
          return isUserScopedUserDataType(type)
            ? respond(405, { error: 'Method Not Allowed' })
            : await store.delete(type, id);
        default:
          return respond(405, { error: 'Method Not Allowed' });
      }
    } catch (error) {
      log.error(
        mongoLogId(1_001_000_455),
        'Filesystem',
        'Error handling user data request',
        { method, url, error: (error as Error).message }
      );
      return respond(500, { error: (error as Error).message });
    }
  };
}

/** A fetch for a local `UserData` that runs in the same process as the files */
export function createLocalUserDataFetch(options: LocalUserDataOptions = {}) {
  return createUserDataFetch(createLocalUserDataHandler(options));
}
