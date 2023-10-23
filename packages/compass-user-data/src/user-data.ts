import { promises as fs } from 'fs';
import path from 'path';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { getStoragePath } from '@mongodb-js/compass-utils';
import type { z } from 'zod';
import writeFile from 'write-file-atomic';

const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-USER-STORAGE');

type SerializeContent<I> = (content: I) => string;
type DeserializeContent = (content: string) => unknown;
type GetFileName = (id: string) => string;

export type UserDataOptions<Input> = {
  subdir: string;
  basePath?: string;
  serialize?: SerializeContent<Input>;
  deserialize?: DeserializeContent;
  getFileName?: GetFileName;
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

export class UserData<T extends z.Schema> {
  private readonly subdir: string;
  private readonly basePath?: string;
  private readonly serialize: SerializeContent<z.input<T>>;
  private readonly deserialize: DeserializeContent;
  private readonly getFileName: GetFileName;

  constructor(
    private readonly validator: T,
    {
      subdir,
      basePath,
      serialize = (content: z.input<T>) => JSON.stringify(content, null, 2),
      deserialize = JSON.parse,
      getFileName = (id) => `${id}.json`,
    }: UserDataOptions<z.input<T>>
  ) {
    this.subdir = subdir;
    this.basePath = basePath;
    this.deserialize = deserialize;
    this.serialize = serialize;
    this.getFileName = getFileName;
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

  private async readAndParseFileWithStats(
    absolutePath: string,
    options: ReadOptions
  ): Promise<[z.output<T>, Stats] | undefined> {
    let data: string;
    let stats: Stats;
    let handle: fs.FileHandle | undefined = undefined;
    try {
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
}
