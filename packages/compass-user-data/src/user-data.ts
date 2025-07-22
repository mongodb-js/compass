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
type GetResourceUrl = (path?: string) => Promise<string>;
type AuthenticatedFetch = (
  url: RequestInfo | URL,
  options?: RequestInit
) => Promise<Response>;

export type FileUserDataOptions<Input> = {
  basePath?: string;
  serialize?: SerializeContent<Input>;
  deserialize?: DeserializeContent;
};

export type AtlasUserDataOptions<Input> = {
  orgId: string;
  projectId: string;
  getResourceUrl: GetResourceUrl;
  authenticatedFetch: AuthenticatedFetch;
  serialize?: SerializeContent<Input>;
  deserialize?: DeserializeContent;
};

type ReadOptions = {
  ignoreErrors: boolean;
};

export interface ReadAllResult<T extends z.Schema> {
  data: z.output<T>[];
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
  protected readonly semaphore = new Semaphore(100);

  constructor(
    validator: T,
    dataType: string,
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
  private orgId: string;
  private projectId: string;
  constructor(
    validator: T,
    dataType: string,
    {
      orgId,
      projectId,
      getResourceUrl,
      authenticatedFetch,
      serialize,
      deserialize,
    }: AtlasUserDataOptions<z.input<T>>
  ) {
    super(validator, dataType, { serialize, deserialize });
    this.authenticatedFetch = authenticatedFetch;
    this.getResourceUrl = getResourceUrl;
    this.orgId = orgId;
    this.projectId = projectId;
  }

  async write(id: string, content: z.input<T>): Promise<boolean> {
    const url = await this.getResourceUrl(
      `${this.dataType}/${this.orgId}/${this.projectId}`
    );

    try {
      this.validator.parse(content);

      await this.authenticatedFetch(url, {
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
      });

      return true;
    } catch (error) {
      log.error(
        mongoLogId(1_001_000_366),
        'Atlas Backend',
        'Error writing data',
        {
          url,
          error: (error as Error).message,
        }
      );
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    const url = await this.getResourceUrl(
      `${this.dataType}/${this.orgId}/${this.projectId}/${id}`
    );

    try {
      await this.authenticatedFetch(url, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      log.error(
        mongoLogId(1_001_000_367),
        'Atlas Backend',
        'Error deleting data',
        {
          url,
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

  // TODO: change this depending on whether or not updateAttributes can provide all current data
  async readOne(id: string): Promise<z.output<T>> {
    const url = await this.getResourceUrl(
      `${this.dataType}/${this.orgId}/${this.projectId}/${id}`
    );

    try {
      const getResponse = await this.authenticatedFetch(url, {
        method: 'GET',
      });
      const json = await getResponse.json();
      const data = this.validator.parse(this.deserialize(json.data as string));
      return data;
    } catch (error) {
      log.error(
        mongoLogId(1_001_000_369),
        'Atlas Backend',
        'Error reading data',
        {
          url,
          error: (error as Error).message,
        }
      );
      throw error;
    }
  }

  async updateAttributes(
    id: string,
    data: Partial<z.input<T>>
  ): Promise<boolean> {
    try {
      const prevData = await this.readOne(id);
      const newData: z.input<T> = {
        ...prevData,
        ...data,
      };

      await this.authenticatedFetch(
        await this.getResourceUrl(
          `${this.dataType}/${this.orgId}/${this.projectId}/${id}`
        ),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: this.serialize(newData),
            createdAt: new Date(),
          }),
        }
      );
      return true;
    } catch (error) {
      log.error(
        mongoLogId(1_001_000_368),
        'Atlas Backend',
        'Error updating data',
        {
          url: await this.getResourceUrl(
            `${this.dataType}/${this.orgId}/${this.projectId}/${id}`
          ),
          error: (error as Error).message,
        }
      );
      throw error;
    }
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
  private orgId: string = '';
  private groupId: string = '';
  private readonly type: 'recents' | 'favorites' | 'pipelines';
  private readonly BASE_URL = 'cluster-connection.cloud-local.mongodb.com';
  constructor(
    validator: T,
    authenticatedFetch: (
      url: RequestInfo | URL,
      options?: RequestInit
    ) => Promise<Response>,
    orgId: string,
    groupId: string,
    type: 'recents' | 'favorites' | 'pipelines',
    { serialize, deserialize }: AtlasUserDataOptions<z.input<T>>
  ) {
    super(validator, { serialize, deserialize });
    this.authenticatedFetch = authenticatedFetch;
    this.orgId = orgId;
    this.groupId = groupId;
    this.type = type;
  }

  async write(id: string, content: z.input<T>): Promise<boolean> {
    try {
      this.validator.parse(content);

      const response = await this.authenticatedFetch(this.getUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          data: this.serialize(content),
          createdAt: new Date(),
          groupId: this.groupId,
        }),
      });

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
          url: this.getUrl(),
          error: (error as Error).message,
        }
      );
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const response = await this.authenticatedFetch(this.getUrl() + `/${id}`, {
        method: 'DELETE',
      });
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
          url: this.getUrl(),
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
      const response = await this.authenticatedFetch(this.getUrl(), {
        method: 'GET',
      });
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
      const response = await this.authenticatedFetch(this.getUrl() + `/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: this.serialize(data),
      });
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
          url: this.getUrl(),
          error: (error as Error).message,
        }
      );
      return false;
    }
  }

  private getUrl() {
    return `${this.BASE_URL}/${this.type}/${this.orgId}/${this.groupId}`;
  }
}
