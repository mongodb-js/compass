import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import { glob } from 'glob';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { getAppPath } from './electron';

const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-UTILS');

type FilesystemOptions<T = unknown> = {
  subdir: string;
  onSerialize: (content: T) => string;
  onDeserialize: (content: string) => T;
};

export class Filesystem<T> {
  private readonly subdir: string;
  private readonly onSerialize: FilesystemOptions<T>['onSerialize'];
  private readonly onDeserialize: FilesystemOptions<T>['onDeserialize'];

  constructor({
    subdir = '/',
    onSerialize = (content: T) => JSON.stringify(content, null, 2),
    onDeserialize = JSON.parse,
  }: Partial<FilesystemOptions<T>> = {}) {
    this.subdir = subdir;
    this.onDeserialize = onDeserialize;
    this.onSerialize = onSerialize;
  }

  private getStorageBasePath(): string {
    if (process.env.COMPASS_TESTS_STORAGE_BASE_PATH) {
      return path.join(
        process.env.COMPASS_TESTS_STORAGE_BASE_PATH,
        this.subdir
      );
    }
    const basepath = getAppPath();
    if (!basepath) {
      throw new Error('The storage path is not defined.');
    }
    return path.join(basepath, this.subdir);
  }

  private async getFileAbsolutePath(filepath: string): Promise<string> {
    const root = this.getStorageBasePath();
    const pathRelativeToRoot = path.relative(root, path.join(root, filepath));

    if (
      pathRelativeToRoot.startsWith('..') ||
      path.isAbsolute(pathRelativeToRoot)
    ) {
      throw new Error(
        `Invalid file path: '${filepath}' is not a subpath of ${root}.`
      );
    }

    const absolutePath = path.resolve(root, pathRelativeToRoot);

    await this.ensureBasedirExists(absolutePath);

    return absolutePath;
  }

  private async ensureBasedirExists(absolutePath: string): Promise<void> {
    const basedir = path.dirname(absolutePath);
    await fs.mkdir(basedir, { recursive: true });
  }

  private async readAndParseFile(absolutePath: string): Promise<T | undefined> {
    let data: string;
    try {
      data = (await fs.readFile(absolutePath, 'utf-8')).toString();
    } catch (error) {
      log.error(mongoLogId(1_001_000_224), 'Filesystem', 'Error reading file', {
        path: absolutePath,
        error: (error as Error).message,
      });
      throw error;
    }

    try {
      return this.onDeserialize(data);
    } catch (error) {
      log.error(mongoLogId(1_001_000_223), 'Filesystem', 'Error parsing data', {
        path: absolutePath,
        error: (error as Error).message,
      });
      return undefined;
    }
  }

  async readAll(pattern = '*.*'): Promise<T[]> {
    const absolutePath = await this.getFileAbsolutePath(pattern);
    const filePathList = await glob(absolutePath);
    const data = await Promise.all(
      filePathList.map((x) => this.readAndParseFile(x))
    );
    return data.filter(Boolean) as T[];
  }

  async readOne(filepath: string): Promise<T | undefined> {
    const absolutePath = await this.getFileAbsolutePath(filepath);
    return await this.readAndParseFile(absolutePath);
  }

  async createWriteStream(filepath: string) {
    const absolutePath = await this.getFileAbsolutePath(filepath);
    return createWriteStream(absolutePath);
  }

  async write(filepath: string, content: T): Promise<boolean> {
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

  async delete(filepath: string): Promise<boolean> {
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
