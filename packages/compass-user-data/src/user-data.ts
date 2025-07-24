import { promises as fs } from 'fs';
import path from 'path';
import { createLogger } from '@mongodb-js/compass-logging';
import { getStoragePath } from '@mongodb-js/compass-utils';
import type { z } from 'zod';
import writeFile from 'write-file-atomic';
import { Semaphore } from './semaphore';

const { log, mongoLogId } = createLogger('COMPASS-USER-STORAGE');

type SerializeContent<I> = (content: I) => string;
type DeserializeContent = (content: string) => unknown;
type GetFileName = (id: string) => string;
type GetResourceUrl = (path?: string) => Promise<string>;
type AuthenticatedFetch = (
  url: RequestInfo | URL,
  options?: RequestInit
) => Promise<Response>;

export type FileUserDataOptions<Input> = {
  basePath?: string;
  serialize?: SerializeContent<Input>;
  deserialize?: DeserializeContent;
  getFileName?: GetFileName;
};

export type AtlasUserDataOptions<Input> = {
  serialize?: SerializeContent<Input>;
  deserialize?: DeserializeContent;
};

type ReadOptions = {
  ignoreErrors: boolean;
};

// Copied from the Node.js fs module.
export interface Stats {
  isFile(): boolean;
  isDirectory(): boolean;
  isBlockDevice(): boolean;
  isCharacterDevice(): boolean;
  isSymbolicLink(): boolean;
  isFIFO(): boolean;
  isSocket(): boolean;
  dev: number;
  ino: number;
  mode: number;
  nlink: number;
  uid: number;
  gid: number;
  rdev: number;
  size: number;
  blksize: number;
  blocks: number;
  atimeMs: number;
  mtimeMs: number;
  ctimeMs: number;
  birthtimeMs: number;
  atime: Date;
  mtime: Date;
  ctime: Date;
  birthtime: Date;
}

export interface ReadAllResult<T extends z.Schema> {
  data: z.output<T>[];
  errors: Error[];
}

export interface ReadAllWithStatsResult<T extends z.Schema> {
  data: [z.output<T>, Stats][];
  errors: Error[];
}

export abstract class IUserData<T extends z.Schema> {
  protected readonly validator: T;
  protected readonly dataType: string;
  protected readonly serialize: SerializeContent<z.input<T>>;
  protected readonly deserialize: DeserializeContent;
  constructor(
    validator: T,
    dataType: string,
    {
      serialize = (content: z.input<T>) => JSON.stringify(content, null, 2),
      deserialize = JSON.parse,
    }: {
      serialize?: SerializeContent<z.input<T>>;
      deserialize?: DeserializeContent;
    } = {}
  ) {
    this.validator = validator;
    this.dataType = dataType;
    this.serialize = serialize;
    this.deserialize = deserialize;
  }

  abstract write(id: string, content: z.input<T>): Promise<boolean>;
  abstract delete(id: string): Promise<boolean>;
  abstract readAll(options?: ReadOptions): Promise<ReadAllResult<T>>;
  abstract updateAttributes(
    id: string,
    data: Partial<z.input<T>>
  ): Promise<boolean>;
}

export class FileUserData<T extends z.Schema> extends IUserData<T> {
  private readonly basePath?: string;
  private readonly getFileName: GetFileName;
  protected readonly semaphore = new Semaphore(100);

  constructor(
    validator: T,
    dataType: string,
    {
      basePath,
      serialize,
      deserialize,
      getFileName = (id) => `${id}.json`,
    }: FileUserDataOptions<z.input<T>>
  ) {
    super(validator, dataType, { serialize, deserialize });
    this.basePath = basePath;
    this.getFileName = getFileName;
  }

  private async getEnsuredBasePath(): Promise<string> {
    const basepath = this.basePath ? this.basePath : getStoragePath();

    const root = path.join(basepath, this.dataType);

    await fs.mkdir(root, { recursive: true });

    return root;
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

  private async readAndParseFileWithStats(
    absolutePath: string,
    options: ReadOptions
  ): Promise<[z.output<T>, Stats] | undefined> {
    let data: string;
    let stats: Stats;
    let handle: fs.FileHandle | undefined = undefined;
    let release: (() => void) | undefined = undefined;
    try {
      release = await this.semaphore.waitForRelease();
      handle = await fs.open(absolutePath, 'r');
      [stats, data] = await Promise.all([
        handle.stat(),
        handle.readFile('utf-8'),
      ]);
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
      await handle?.close();
      release?.();
    }

    try {
      const content = this.deserialize(data);
      return [this.validator.parse(content), stats];
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

  async readAllWithStats(
    options: ReadOptions = {
      ignoreErrors: true,
    }
  ): Promise<ReadAllWithStatsResult<T>> {
    const absolutePath = await this.getFileAbsolutePath();
    const filePathList = await fs.readdir(absolutePath);

    const data = await Promise.allSettled(
      filePathList.map((x) =>
        this.readAndParseFileWithStats(path.join(absolutePath, x), options)
      )
    );

    const result: ReadAllWithStatsResult<T> = {
      data: [],
      errors: [],
    };

    for (const item of data) {
      if (item.status === 'fulfilled' && item.value) {
        result.data.push(item.value);
      }
      if (item.status === 'rejected') {
        result.errors.push(item.reason);
      }
    }

    return result;
  }

  async readOneWithStats(
    id: string,
    options?: { ignoreErrors: false }
  ): Promise<[z.output<T>, Stats]>;
  async readOneWithStats(
    id: string,
    options?: { ignoreErrors: true }
  ): Promise<[z.output<T>, Stats] | undefined>;
  async readOneWithStats(
    id: string,
    options?: ReadOptions
  ): Promise<[z.output<T>, Stats] | undefined>;
  async readOneWithStats(
    id: string,
    options: ReadOptions = {
      ignoreErrors: true,
    }
  ) {
    const filepath = this.getFileName(id);
    const absolutePath = await this.getFileAbsolutePath(filepath);
    return await this.readAndParseFileWithStats(absolutePath, options);
  }

  async readAll(
    options: ReadOptions = {
      ignoreErrors: true,
    }
  ): Promise<ReadAllResult<T>> {
    const result = await this.readAllWithStats(options);
    return {
      data: result.data.map(([data]) => data),
      errors: result.errors,
    };
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
    return (await this.readOneWithStats(id, options))?.[0];
  }

  async updateAttributes(
    id: string,
    data: Partial<z.input<T>>
  ): Promise<boolean> {
    try {
      await this.write(id, {
        ...((await this.readOne(id)) ?? {}),
        ...data,
      });
      return true;
    } catch {
      return false;
    }
  }
}

// TODO: update endpoints to reflect the merged api endpoints https://jira.mongodb.org/browse/CLOUDP-329716
export class AtlasUserData<T extends z.Schema> extends IUserData<T> {
  private readonly authenticatedFetch;
  private readonly getResourceUrl;
  private orgId: string = '';
  private projectId: string = '';
  constructor(
    validator: T,
    dataType: string,
    orgId: string,
    projectId: string,
    getResourceUrl: GetResourceUrl,
    authenticatedFetch: AuthenticatedFetch,
    { serialize, deserialize }: AtlasUserDataOptions<z.input<T>>
  ) {
    super(validator, dataType, { serialize, deserialize });
    this.authenticatedFetch = authenticatedFetch;
    this.getResourceUrl = getResourceUrl;
    this.orgId = orgId;
    this.projectId = projectId;
  }

  async write(id: string, content: z.input<T>): Promise<boolean> {
    try {
      this.validator.parse(content);

      const response = await this.authenticatedFetch(
        await this.getResourceUrl(
          `${this.dataType}/${this.orgId}/${this.projectId}`
        ),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: id,
            data: this.serialize(content),
            createdAt: new Date(),
            projectId: this.projectId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to post data: ${response.status} ${response.statusText}`
        );
      }

      return true;
    } catch (error) {
      log.error(
        mongoLogId(1_001_000_362),
        'Atlas Backend',
        'Error writing data',
        {
          url: await this.getResourceUrl(
            `${this.dataType}/${this.orgId}/${this.projectId}`
          ),
          error: (error as Error).message,
        }
      );
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const response = await this.authenticatedFetch(
        await this.getResourceUrl(
          `${this.dataType}/${this.orgId}/${this.projectId}/${id}`
        ),
        {
          method: 'DELETE',
        }
      );
      if (!response.ok) {
        throw new Error(
          `Failed to delete data: ${response.status} ${response.statusText}`
        );
      }
      return true;
    } catch (error) {
      log.error(
        mongoLogId(1_001_000_363),
        'Atlas Backend',
        'Error deleting data',
        {
          url: await this.getResourceUrl(
            `${this.dataType}/${this.orgId}/${this.projectId}/${id}`
          ),
          error: (error as Error).message,
        }
      );
      return false;
    }
  }

  async readAll(): Promise<ReadAllResult<T>> {
    const result: ReadAllResult<T> = {
      data: [],
      errors: [],
    };
    try {
      const response = await this.authenticatedFetch(
        await this.getResourceUrl(
          `${this.dataType}/${this.orgId}/${this.projectId}`
        ),
        {
          method: 'GET',
        }
      );
      if (!response.ok) {
        throw new Error(
          `Failed to get data: ${response.status} ${response.statusText}`
        );
      }
      const json = await response.json();
      for (const item of json) {
        try {
          const parsedData = this.deserialize(item.data as string);
          result.data.push(this.validator.parse(parsedData) as z.output<T>);
        } catch (error) {
          result.errors.push(error as Error);
        }
      }
      return result;
    } catch (error) {
      result.errors.push(error as Error);
      return result;
    }
  }

  async updateAttributes(
    id: string,
    data: Partial<z.input<T>>
  ): Promise<boolean> {
    try {
      // TODO: change this depending on whether or not updateAttributes can provide all current data
      const getResponse = await this.authenticatedFetch(
        await this.getResourceUrl(
          `${this.dataType}/${this.orgId}/${this.projectId}/${id}`
        ),
        {
          method: 'GET',
        }
      );
      if (!getResponse.ok) {
        throw new Error(
          `Failed to fetch data: ${getResponse.status} ${getResponse.statusText}`
        );
      }
      const prevData = await getResponse.json();
      const validPrevData = this.validator.parse(
        this.deserialize(prevData.data as string)
      );
      const newData: z.input<T> = {
        ...validPrevData,
        ...data,
      };

      const response = await this.authenticatedFetch(
        await this.getResourceUrl(
          `${this.dataType}/${this.orgId}/${this.projectId}/${id}`
        ),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: this.serialize(newData),
        }
      );
      if (!response.ok) {
        throw new Error(
          `Failed to update data: ${response.status} ${response.statusText}`
        );
      }
      return true;
    } catch (error) {
      log.error(
        mongoLogId(1_001_000_364),
        'Atlas Backend',
        'Error updating data',
        {
          url: await this.getResourceUrl(
            `${this.dataType}/${this.orgId}/${this.projectId}/${id}`
          ),
          error: (error as Error).message,
        }
      );
      return false;
    }
  }
}
