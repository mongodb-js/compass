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

export type FileUserDataOptions<Input> = {
  subdir: string;
  basePath?: string;
  serialize?: SerializeContent<Input>;
  deserialize?: DeserializeContent;
};

export type AtlasUserDataOptions<Input> = {
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
  protected readonly serialize: SerializeContent<z.input<T>>;
  protected readonly deserialize: DeserializeContent;

  constructor(
    validator: T,
    {
      serialize = (content: z.input<T>) => JSON.stringify(content, null, 2),
      deserialize = JSON.parse,
    }: {
      serialize?: SerializeContent<z.input<T>>;
      deserialize?: DeserializeContent;
    } = {}
  ) {
    this.validator = validator;
    this.serialize = serialize;
    this.deserialize = deserialize;
  }

  abstract write(id: string, content: z.input<T>): Promise<boolean>;
  abstract delete(id: string): Promise<boolean>;
  abstract readAll(options?: ReadOptions): Promise<ReadAllResult<T>>;
  abstract updateAttributes(
    id: string,
    data: Partial<z.input<T>>
  ): Promise<z.output<T>>;
}

export class FileUserData<T extends z.Schema> extends IUserData<T> {
  private readonly subdir: string;
  private readonly basePath?: string;
  protected readonly semaphore = new Semaphore(100);

  constructor(
    validator: T,
    {
      subdir,
      basePath,
      serialize,
      deserialize,
    }: FileUserDataOptions<z.input<T>>
  ) {
    super(validator, { serialize, deserialize });
    this.subdir = subdir;
    this.basePath = basePath;
  }

  private getFileName(id: string) {
    return `${id}.json`;
  }

  private async getEnsuredBasePath(): Promise<string> {
    const basepath = this.basePath ? this.basePath : getStoragePath();

    const root = path.join(basepath, this.subdir);

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
  ): Promise<z.output<T>> {
    await this.write(id, {
      ...((await this.readOne(id)) ?? {}),
      ...data,
    });
    return await this.readOne(id);
  }
}
