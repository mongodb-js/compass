import { promises as fs } from 'fs';
import path from 'path';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { getStoragePath } from '@mongodb-js/compass-utils';
import { EJSON } from 'bson';

const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-USER-STORAGE');

type OnSerialize<T> = (content: T) => string;
type OnDeserialize<T> = (content: string) => T;

type UserDataOptions<T = unknown> = {
  subdir: string;
  basePath?: string;
  onSerialize?: OnSerialize<T>;
  onDeserialize?: OnDeserialize<T>;
};

type ReadOptions = {
  ignoreErrors: boolean;
};

export class UserData<T> {
  private readonly subdir: string;
  private readonly basePath?: string;
  private readonly onSerialize: OnSerialize<T>;
  private readonly onDeserialize: OnDeserialize<T>;

  constructor({
    subdir,
    basePath,
    onSerialize = (content: T) => EJSON.stringify(content, undefined, 2),
    onDeserialize = EJSON.parse,
  }: UserDataOptions<T>) {
    this.subdir = subdir;
    this.basePath = basePath;
    this.onDeserialize = onDeserialize;
    this.onSerialize = onSerialize;
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

  private async readAndParseFile(absolutePath: string, options: ReadOptions) {
    let data: string;
    try {
      data = await fs.readFile(absolutePath, 'utf-8');
    } catch (error) {
      log.error(mongoLogId(1_001_000_224), 'Filesystem', 'Error reading file', {
        path: absolutePath,
        error: (error as Error).message,
      });
      if (options.ignoreErrors) {
        return undefined;
      }
      throw error;
    }

    try {
      return this.onDeserialize(data);
    } catch (error) {
      log.error(mongoLogId(1_001_000_223), 'Filesystem', 'Error parsing data', {
        path: absolutePath,
        error: (error as Error).message,
      });
      if (options.ignoreErrors) {
        return undefined;
      }
      throw error;
    }
  }

  async readAll(
    options: ReadOptions = {
      ignoreErrors: true,
    }
  ) {
    const absolutePath = await this.getFileAbsolutePath();
    const filePathList = await fs.readdir(absolutePath);
    const data = await Promise.allSettled(
      filePathList.map((x) => this.readOne(x, options))
    );

    const result = {
      data: [],
      errors: [],
    } as {
      data: T[];
      errors: Error[];
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

  async readOne(filepath: string, options: { ignoreErrors: false }): Promise<T>;
  async readOne(
    filepath: string,
    options: { ignoreErrors: true }
  ): Promise<T | undefined>;
  async readOne(filepath: string, options: ReadOptions): Promise<T | undefined>;
  async readOne(
    filepath: string,
    options: ReadOptions = {
      ignoreErrors: true,
    }
  ) {
    const absolutePath = await this.getFileAbsolutePath(filepath);
    return await this.readAndParseFile(absolutePath, options);
  }

  async write(filepath: string, content: T) {
    const absolutePath = await this.getFileAbsolutePath(filepath);
    try {
      await fs.writeFile(absolutePath, this.onSerialize(content), {
        encoding: 'utf-8',
      });
      return true;
    } catch (error) {
      log.error(mongoLogId(1_001_000_221), 'Filesystem', 'Error writing file', {
        path: absolutePath,
        error: (error as Error).message,
      });
      return false;
    }
  }

  async delete(filepath: string) {
    const absolutePath = await this.getFileAbsolutePath(filepath);
    try {
      await fs.unlink(absolutePath);
      return true;
    } catch (error) {
      log.error(
        mongoLogId(1_001_000_222),
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
}
