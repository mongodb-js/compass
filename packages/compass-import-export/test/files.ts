import fs from 'fs';
import path from 'path';
import { File as NodeFile } from 'buffer';

// The test environment's global File comes from jsdom, which has no
// .stream(), so build files with Node.js' implementation instead.
export function createFile(parts: (string | Uint8Array)[], name: string): File {
  return new NodeFile(parts, name) as unknown as File;
}

export async function readFixtureFile(fixturePath: string): Promise<File> {
  return createFile(
    [await fs.promises.readFile(fixturePath)],
    path.basename(fixturePath)
  );
}

// Matches what Chromium throws when a File's contents changed on disk after
// it was selected.
export function createChangedOnDiskFile(name: string): File {
  return {
    name,
    size: 1,
    stream() {
      return new ReadableStream({
        pull(controller) {
          controller.error(
            new DOMException(
              'The requested file could not be read, typically due to permission problems that have occurred after a reference to a file was acquired.',
              'NotReadableError'
            )
          );
        },
      });
    },
  } as unknown as File;
}

export function createFakeFileHandle(name: string) {
  const chunks: Uint8Array[] = [];
  const state = { closed: false, aborted: false };
  const handle = {
    name,
    createWritable() {
      return Promise.resolve(
        new WritableStream<Uint8Array>({
          write(chunk) {
            chunks.push(chunk);
          },
          close() {
            state.closed = true;
          },
          abort() {
            state.aborted = true;
          },
        })
      );
    },
  } as unknown as FileSystemFileHandle;
  return {
    handle,
    state,
    text: () => Buffer.concat(chunks).toString('utf8'),
  };
}

type FakeFile = { contents: Uint8Array[]; lastModified: number };

// An in-memory stand-in for the origin private file system, which the test
// environment doesn't have. Like the real one, writes only become visible
// when the writable is closed.
export function createFakeDirectory() {
  const files = new Map<string, FakeFile>();
  const created: string[] = [];

  function getFile(name: string) {
    const file = files.get(name);
    if (!file) {
      throw new DOMException(`${name} not found`, 'NotFoundError');
    }
    return file;
  }

  const directory = {
    getFileHandle(name: string, options?: { create?: boolean }) {
      if (!files.has(name)) {
        if (!options?.create) {
          return Promise.reject(
            new DOMException(`${name} not found`, 'NotFoundError')
          );
        }
        files.set(name, { contents: [], lastModified: Date.now() });
        created.push(name);
      }
      return Promise.resolve({
        name,
        getFile() {
          const { contents, lastModified } = getFile(name);
          return Promise.resolve(
            new NodeFile(contents, name, { lastModified }) as unknown as File
          );
        },
        createWritable() {
          const chunks: Uint8Array[] = [];
          return Promise.resolve(
            new WritableStream<Uint8Array>({
              write(chunk) {
                chunks.push(chunk);
              },
              close() {
                getFile(name).contents = chunks;
              },
            })
          );
        },
      });
    },
    removeEntry(name: string) {
      getFile(name);
      files.delete(name);
      return Promise.resolve();
    },
    keys() {
      return [...files.keys()][Symbol.iterator]();
    },
  };

  return {
    directory: directory as unknown as FileSystemDirectoryHandle,
    created,
    names: () => [...files.keys()],
    addFile(name: string, lastModified: number) {
      files.set(name, { contents: [], lastModified });
    },
  };
}
