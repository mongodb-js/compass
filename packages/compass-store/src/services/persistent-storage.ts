import { promises as fs } from 'fs';
import path from 'path';
import { EJSON } from 'bson';
import electron from 'electron';

export type CollectionItem = { _id: string } & Record<string, unknown>;

export type FileMetadata = { createdAt: number; updatedAt: number };

export type PersistentStorage = {
  readCollectionFromFS<T extends CollectionItem>(
    collectionName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    processFn?: (input: any) => T
  ): Promise<(T & FileMetadata)[]>;
  writeCollectionToFS<T extends CollectionItem>(
    collectionName: string,
    collection: T[]
  ): Promise<void>;
  removeCollectionFromFS(collectionName: string): Promise<void>;
  removeItemFromFS(collectionName: string, id: string): Promise<void>;
};

type FS = Pick<
  typeof fs,
  'readdir' | 'readFile' | 'writeFile' | 'stat' | 'unlink'
>;

export type PersistentStorageOptions = {
  baseDir: string;
  fs: FS;
};

async function readFileWithStats<T>(
  fs: FS,
  filePath: string
): Promise<T & FileMetadata> {
  const [document, stats] = await Promise.all([
    fs.readFile(filePath, 'utf-8').then((content) => EJSON.parse(content) as T),
    fs.stat(filePath).catch(() => null),
  ]);
  return {
    ...document,
    createdAt: stats?.birthtimeMs ?? 0,
    updatedAt: stats?.mtimeMs ?? 0,
  };
}

/**
 * This is here for demonstration purposes only, we probably would want
 * something more robust for the real thing that handles file locking, parallel
 * updates, atomic writes, and possibly does it from the main thread instead of
 * renderer
 */
export class PersistentStorageService implements PersistentStorage {
  private baseDir?: PersistentStorageOptions['baseDir'] =
    electron?.remote?.app?.getPath?.('userData');
  private fs: PersistentStorageOptions['fs'] = fs;
  constructor(opts: Partial<PersistentStorageOptions> = {}) {
    this.baseDir = opts.baseDir ?? this.baseDir;
    this.fs = opts.fs ?? this.fs;
  }
  async readCollectionFromFS<T extends CollectionItem>(
    collectionName: string,
    processFn: (input: unknown) => T = (i) => i as T
  ): Promise<(T & FileMetadata)[]> {
    const collectionDir = path.join(this.baseDir ?? '', collectionName);
    const items = await Promise.allSettled(
      (
        await this.fs.readdir(collectionDir).catch(() => {
          return [];
        })
      ).map(async (filename) => {
        const item = await readFileWithStats(
          fs,
          path.join(collectionDir, filename)
        );
        return processFn(item);
      })
    );
    return items
      .filter((item) => item.status === 'fulfilled')
      .map((item) => (item as PromiseFulfilledResult<T & FileMetadata>).value);
  }
  async writeCollectionToFS<T extends CollectionItem>(
    collectionName: string,
    collection: T[]
  ): Promise<void> {
    const collectionDir = path.join(this.baseDir ?? '', collectionName);
    await Promise.allSettled(
      collection.map((item) => {
        return fs.writeFile(
          path.join(collectionDir, `${item._id}.json`),
          EJSON.stringify(item)
        );
      })
    );
  }
  async removeCollectionFromFS(collectionName: string): Promise<void> {
    const collectionDir = path.join(this.baseDir ?? '', collectionName);
    await Promise.allSettled(
      (
        await this.fs.readdir(collectionDir).catch(() => {
          return [];
        })
      ).map(async (filename) => {
        return fs.unlink(path.join(collectionDir, filename));
      })
    );
  }
  async removeItemFromFS(collectionName: string, id: string): Promise<void> {
    const collectionItemPath = path.join(
      this.baseDir ?? '',
      collectionName,
      `${id}.json`
    );
    try {
      await this.fs.unlink(collectionItemPath);
    } catch {
      //
    }
  }
}
